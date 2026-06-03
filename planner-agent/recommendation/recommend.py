"""
Recommendation API endpoints.
  POST /api/recommend/feed   — get Thompson-ranked recommendations
  POST /api/recommend/event  — track user events (batch)
  POST /api/recommend/init   — initialize arms for a segment
"""

import logging
from fastapi import APIRouter
from pydantic import BaseModel, Field

from recommendation.segments import build_segment_key, build_user_segment_key
from recommendation.thompson import sample_arms, blend_and_sample, ScoredArm
from recommendation.db import (
    get_arms_for_segment,
    get_arms_for_segment_multi,
    process_event_batch,
    initialize_arms_for_segment,
    count_user_events,
)

logger = logging.getLogger(__name__)

router = APIRouter()


# ── Request / Response models ─────────────────────────────────


class FeedRequest(BaseModel):
    """Request for recommendation feed."""
    section: str = "homepage"            # "homepage", "category_activities", etc.
    destination_id: str
    listing_type: str | None = None      # "ACTIVITY", "STAY", etc. (null = all for homepage)
    limit: int = 8
    user_id: str | None = None


class RecommendationItem(BaseModel):
    listing_id: str = Field(alias="listingId")
    listing_type: str = Field(alias="listingType")
    theta: float
    alpha: float
    beta_val: float = Field(alias="beta")
    impressions: int
    conversions: int

    model_config = {"populate_by_name": True}


class FeedResponse(BaseModel):
    items: list[RecommendationItem]
    segment: str
    section: str
    personalized: bool = False


class EventPayload(BaseModel):
    event: str         # "impression", "click", "dwell_time", "gallery_swipe", "wishlist", "reservation"
    listing_id: str = Field(alias="listingId")
    listing_type: str = Field(alias="listingType")
    meta: dict | None = None  # { price, dwellMs, swipeCount, position }

    model_config = {"populate_by_name": True}


class EventBatchRequest(BaseModel):
    """Batch event tracking request from frontend tracker."""
    session_id: str = Field(alias="sessionId")
    user_id: str | None = Field(None, alias="userId")
    destination_id: str = Field(alias="destinationId")
    budget: int | None = None
    group_type: str | None = Field(None, alias="groupType")
    events: list[EventPayload]

    model_config = {"populate_by_name": True}


class InitRequest(BaseModel):
    destination_id: str = Field(alias="destinationId")

    model_config = {"populate_by_name": True}


# ── Endpoints ─────────────────────────────────────────────────


@router.post("/feed", response_model=FeedResponse)
async def get_recommendations(req: FeedRequest):
    """
    Get Thompson Sampling-ranked recommendations.
    If user_id is provided and user has interaction history,
    blends user-specific arms with global arms.
    """
    global_segment = build_segment_key(req.destination_id)

    logger.info("")
    logger.info("🎰" + "=" * 58)
    logger.info("🎰  RECOMMENDATION REQUEST")
    logger.info("🎰  Section:     %s", req.section)
    logger.info("🎰  Segment:     %s", global_segment)
    logger.info("🎰  ListingType: %s", req.listing_type or "ALL")
    logger.info("🎰  Limit:       %d", req.limit)
    logger.info("🎰  UserId:      %s", req.user_id[:16] if req.user_id else "(anonymous)")
    logger.info("🎰" + "=" * 58)

    # Fetch global arms
    if req.listing_type:
        global_arms = get_arms_for_segment(req.listing_type, global_segment)
    else:
        global_arms = get_arms_for_segment_multi(
            ["ACTIVITY", "STAY", "RESTAURANT", "RENTAL", "TRANSFER", "SHOP", "PRODUCT"],
            global_segment,
        )

    if not global_arms:
        logger.warning("⚠️  No arms for segment %s — initializing...", global_segment)
        initialize_arms_for_segment(global_segment)
        if req.listing_type:
            global_arms = get_arms_for_segment(req.listing_type, global_segment)
        else:
            global_arms = get_arms_for_segment_multi(
                ["ACTIVITY", "STAY", "RESTAURANT", "RENTAL", "TRANSFER", "SHOP", "PRODUCT"],
                global_segment,
            )

    if not global_arms:
        logger.warning("⚠️  Still no arms after init — returning empty")
        return FeedResponse(items=[], segment=global_segment, section=req.section)

    # ── Personalized or global? ───────────────────────────────
    personalized = False
    if req.user_id:
        user_segment = build_user_segment_key(req.destination_id, req.user_id)
        user_event_count = count_user_events(req.user_id)
        logger.info("👤 User %s has %d events", req.user_id[:16], user_event_count)

        if user_event_count > 0:
            # Fetch user-specific arms
            if req.listing_type:
                user_arms = get_arms_for_segment(req.listing_type, user_segment)
            else:
                user_arms = get_arms_for_segment_multi(
                    ["ACTIVITY", "STAY", "RESTAURANT", "RENTAL", "TRANSFER", "SHOP", "PRODUCT"],
                    user_segment,
                )

            if user_arms:
                scored = blend_and_sample(global_arms, user_arms, user_event_count, top_k=req.limit)
                personalized = True
            else:
                scored = sample_arms(global_arms, top_k=req.limit)
        else:
            scored = sample_arms(global_arms, top_k=req.limit)
    else:
        scored = sample_arms(global_arms, top_k=req.limit)

    items = [
        RecommendationItem(
            listingId=s.listing_id,
            listingType=s.listing_type,
            theta=s.theta,
            alpha=s.alpha,
            beta=s.beta,
            impressions=s.impressions,
            conversions=s.conversions,
        )
        for s in scored
    ]

    return FeedResponse(
        items=items,
        segment=global_segment,
        section=req.section,
        personalized=personalized,
    )


@router.post("/event")
async def track_events(req: EventBatchRequest):
    """
    Receive a batch of user interaction events from the frontend tracker.
    Updates BanditArm α/β in both global AND user-specific segments.
    """
    global_segment = build_segment_key(req.destination_id)
    user_segment = build_user_segment_key(req.destination_id, req.user_id) if req.user_id else None

    logger.info("")
    logger.info("📨" + "=" * 58)
    logger.info("📨  EVENT BATCH RECEIVED")
    logger.info("📨  Session:  %s", req.session_id)
    logger.info("📨  Dest:     %s", req.destination_id)
    logger.info("📨  UserId:   %s", req.user_id[:16] if req.user_id else "(anonymous)")
    logger.info("📨  Global:   %s", global_segment)
    logger.info("📨  User:     %s", user_segment or "(none)")
    logger.info("📨  Events:   %d", len(req.events))
    for i, evt in enumerate(req.events):
        logger.info("📨    [%d] %s %s/%s", i, evt.event, evt.listing_type, evt.listing_id[:16])
    logger.info("📨" + "=" * 58)

    events_raw = [
        {
            "event": evt.event,
            "listing_id": evt.listing_id,
            "listing_type": evt.listing_type,
            "meta": evt.meta,
        }
        for evt in req.events
    ]

    count = process_event_batch(
        events=events_raw,
        session_id=req.session_id,
        global_segment=global_segment,
        user_segment=user_segment,
        user_id=req.user_id,
    )

    return {"processed": count, "segment": global_segment, "user_segment": user_segment}


@router.post("/init")
async def initialize_segment(req: InitRequest):
    """
    Initialize BanditArm rows for all listings in a destination segment.
    """
    segment = build_segment_key(req.destination_id)
    count = initialize_arms_for_segment(segment)
    return {"initialized": count, "segment": segment}
