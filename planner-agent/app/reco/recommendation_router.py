"""Recommendation Router — FastAPI endpoints for LinUCB recommendations.

Endpoints:
    GET  /api/recommendations         — Get personalized recommendations
    POST /api/recommendations/events  — Batch process user events
    POST /api/recommendations/merge-session — Merge anonymous → user
"""

from __future__ import annotations

import logging
import os
import threading
import time
import uuid
from contextlib import asynccontextmanager
from typing import Optional

import numpy as np
from fastapi import BackgroundTasks, FastAPI, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from app.reco.context import (
    UserContext,
    build_context_from_profile,
    build_user_vector,
)
from app.reco.db import (
    get_arms_for_zone,
    get_cached_matrices,
    get_user_profile,
    init_matrix_cache,
    merge_anonymous_session,
    persist_matrices_to_db,
    process_event_batch,
    upsert_user_session,
)
from app.reco.db_init import run_startup_checks
from app.reco.linucb import ArmState, ScoredArm
from app.reco.ranker import rank

from app.reco.logger import reco_logger as logger

# ──────────────────────────────────────────────────────────────
# Config
# ──────────────────────────────────────────────────────────────

EXPOSE_SCORES = os.environ.get("EXPOSE_SCORES", "false").lower() == "true"


# ──────────────────────────────────────────────────────────────
# Arms cache (raw DB results only — NOT ranked results)
# ──────────────────────────────────────────────────────────────

_arms_cache: dict[str, tuple[list[ArmState], float]] = {}
_arms_cache_lock = threading.Lock()
ARMS_CACHE_TTL = 30  # seconds


def _arms_cache_key(location_zone: str, listing_types: list[str]) -> str:
    """Build cache key from zone + sorted types ONLY.

    No hour/budget/device — personalization happens in ranker.
    """
    return f"{location_zone}:{','.join(sorted(listing_types))}"


def _get_cached_arms(key: str) -> list[ArmState] | None:
    """Get cached arms if still fresh."""
    with _arms_cache_lock:
        entry = _arms_cache.get(key)
        if entry is None:
            return None
        arms, ts = entry
        if time.time() - ts > ARMS_CACHE_TTL:
            del _arms_cache[key]
            return None
        return arms


def _set_cached_arms(key: str, arms: list[ArmState]) -> None:
    """Store arms in cache with current timestamp."""
    with _arms_cache_lock:
        _arms_cache[key] = (arms, time.time())


def _invalidate_arms_cache(location_zone: str) -> None:
    """Invalidate all cache entries for a zone.

    Called when a reservation event is received.
    """
    with _arms_cache_lock:
        keys_to_delete = [
            k for k in _arms_cache if k.startswith(f"{location_zone}:")
        ]
        for k in keys_to_delete:
            del _arms_cache[k]
    if keys_to_delete:
        logger.debug("Invalidated %d arms cache entries for zone %s",
                      len(keys_to_delete), location_zone)


# ──────────────────────────────────────────────────────────────
# Pydantic models
# ──────────────────────────────────────────────────────────────

class SessionState(BaseModel):
    """Client session state sent with each request."""
    scroll_depth: float = 0.0
    dwell_seconds: int = 0
    price_range_viewed: dict = Field(default_factory=lambda: {"min": 0.0, "max": 0.0})
    click_sequence: list[str] = Field(default_factory=list)
    lat: float | None = None
    lon: float | None = None
    device_type: str = "mobile"
    hour: int
    month: int
    budget_segment: str = "unknown"


class EventPayload(BaseModel):
    """Single user event."""
    event: str
    listing_id: str
    listing_type: str
    meta: dict = Field(default_factory=dict)


class BatchRequest(BaseModel):
    """Batch event submission request."""
    session_id: str
    user_id: str | None = None
    location_zone: str
    session_state: SessionState
    session_rewards: dict[str, float] = Field(default_factory=dict)
    events: list[EventPayload]


class BatchResponse(BaseModel):
    """Response after processing a batch of events."""
    processed: int
    session_id: str
    session_rewards: dict[str, float]


class RecommendationItem(BaseModel):
    """Single recommendation result."""
    listing_id: str
    listing_type: str
    tags: list[str]
    rank: int
    is_new_listing: bool
    score: float | None = None
    exploitation: float | None = None
    ucb_bonus: float | None = None


class RecommendationResponse(BaseModel):
    """Full recommendation response."""
    items: list[RecommendationItem]
    location_zone: str
    request_id: str
    processing_time_ms: int


class MergeSessionRequest(BaseModel):
    """Request to merge anonymous session with user account."""
    session_id: str
    user_id: str


class SingleExtractionRequest(BaseModel):
    """Request to re-extract tags for a specific listing."""
    listing_id: str
    listing_type: str


# ──────────────────────────────────────────────────────────────
# Lifespan
# ──────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    logger.info("🎯 Recommendation system starting up...")

    # 1. Run startup checks (vocab hash, schema version)
    try:
        run_startup_checks()
        logger.info("✅ Startup checks passed")
    except RuntimeError as e:
        logger.critical("❌ Startup checks FAILED: %s", e)
        raise

    # 2. Load matrices into RAM cache
    init_matrix_cache()
    logger.info("✅ Matrix cache loaded")

    # 3. Start background scheduler
    try:
        from app.reco.scheduler import start_scheduler
        start_scheduler()
        logger.info("✅ Scheduler started")
    except Exception as e:
        logger.error("⚠️ Scheduler failed to start: %s", e)

    logger.info("🎯 Recommendation system ready")

    yield

    yield

    # Shutdown
    logger.info("🎯 Recommendation system shutting down...")

    # Persist matrices one final time
    try:
        persist_matrices_to_db()
        logger.info("✅ Final matrix persistence complete")
    except Exception as e:
        logger.error("⚠️ Final persistence failed: %s", e)

    # Stop scheduler
    try:
        from app.reco.scheduler import shutdown_scheduler
        shutdown_scheduler()
    except Exception as e:
        logger.error("⚠️ Scheduler shutdown failed: %s", e)


# ──────────────────────────────────────────────────────────────
# App & middleware
# ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="Guidni Recommendations",
    description="Hybrid LinUCB recommendation system for Tunisian travel",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
_allowed_origins = os.environ.get("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    """Add X-Request-ID and X-Processing-Time-Ms to every response."""
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    start = time.time()

    response = await call_next(request)

    elapsed_ms = int((time.time() - start) * 1000)
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Processing-Time-Ms"] = str(elapsed_ms)
    return response


# ──────────────────────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────────────────────

@app.post(
    "/api/recommendations/events",
    response_model=BatchResponse,
    summary="Process a batch of user events",
)
async def handle_events(
    body: BatchRequest,
    background_tasks: BackgroundTasks,
):
    """Process user interaction events (clicks, impressions, etc.).

    Updates LinUCB matrices in RAM, logs events to DB,
    and updates arm counters.
    """
    # Build UserContext
    profile = None
    if body.user_id:
        profile = get_user_profile(body.user_id)

    session_dict = body.session_state.model_dump()
    ctx = build_context_from_profile(profile, session_dict)
    x_user = build_user_vector(ctx)

    logger.debug("Processing event batch for session %s (user_id: %s)", body.session_id, body.user_id)
    logger.debug("User context: %s", ctx)

    # Convert events to dicts
    events_list = [e.model_dump() for e in body.events]

    # Mutable copy of session_rewards
    session_rewards = dict(body.session_rewards)

    # Process batch
    count, updated_rewards = process_event_batch(
        events_list,
        body.session_id,
        body.location_zone,
        x_user,
        body.user_id,
        session_rewards,
    )

    # Invalidate arms cache on reservation
    if any(e.event == "reservation" for e in body.events):
        _invalidate_arms_cache(body.location_zone)

    # Background: persist session state
    background_tasks.add_task(
        upsert_user_session,
        body.session_id,
        session_dict,
        body.user_id,
    )

    logger.info("Processed %d events for session %s. New rewards: %s", count, body.session_id, updated_rewards)

    return BatchResponse(
        processed=count,
        session_id=body.session_id,
        session_rewards=updated_rewards,
    )


@app.get(
    "/api/recommendations",
    response_model=RecommendationResponse,
    summary="Get personalized recommendations",
)
async def get_recommendations(
    request: Request,
    location_zone: str,
    session_id: str,
    hour: int,
    month: int,
    listing_types: str = "STAY,ACTIVITY,RESTAURANT,TRANSFER",
    user_id: str | None = None,
    lat: float | None = None,
    lon: float | None = None,
    scroll_depth: float = 0.0,
    dwell_seconds: int = 0,
    budget_estimate: float | None = None,
    budget_segment: str = "unknown",
    top_k: int = 10,
):
    """Get ranked recommendations for a user/session.

    Cache stores raw DB arms ONLY. Personalization (phi, scoring,
    filtering) always runs fresh per request.
    """
    start = time.time()
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))

    listing_types_list = [t.strip() for t in listing_types.split(",") if t.strip()]

    # Build UserContext
    profile = None
    if user_id:
        profile = get_user_profile(user_id)

    session_dict = {
        "hour": hour,
        "month": month,
        "lat": lat,
        "lon": lon,
        "scroll_depth": scroll_depth,
        "dwell_seconds": dwell_seconds,
        "device_type": "mobile",
        "price_range_viewed": (
            {"min": 0, "max": budget_estimate * 2}
            if budget_estimate else {"min": 0, "max": 0}
        ),
        "budget_segment": budget_segment,
    }
    ctx = build_context_from_profile(profile, session_dict)
    if budget_estimate:
        ctx.budget_estimate = budget_estimate

    logger.debug("Recommendation request [%s]: session=%s, user=%s, zone=%s, types=%s", 
                 request_id, session_id, user_id, location_zone, listing_types_list)
    logger.debug("Active context: %s", ctx)

    # STEP 3: Cache raw arms (DB results only)
    cache_key = _arms_cache_key(location_zone, listing_types_list)
    arms = _get_cached_arms(cache_key)
    if arms is None:
        arms = get_arms_for_zone(location_zone, listing_types_list)
        _set_cached_arms(cache_key, arms)
        logger.debug("Arms cache MISS: %s → %d arms loaded from DB", cache_key, len(arms))
    else:
        logger.debug("Arms cache HIT: %s → %d arms", cache_key, len(arms))

    # Step 4: Get cached matrices (from RAM, never DB)
    A, b = get_cached_matrices()

    # Step 5: User tag affinity
    user_tag_affinity = {}
    if profile:
        tag_aff = profile.get("tag_affinity", {})
        if isinstance(tag_aff, str):
            import json
            tag_aff = json.loads(tag_aff)
        user_tag_affinity = tag_aff

    # Step 6: Rank (always fresh — personalization not cached)
    results = rank(
        arms, A, b, ctx,
        user_tag_affinity=user_tag_affinity,
        top_k=top_k,
    )

    # Step 7: Build response
    items: list[RecommendationItem] = []
    for i, arm in enumerate(results):
        item = RecommendationItem(
            listing_id=arm.listing_id,
            listing_type=arm.listing_type,
            tags=arm.tags,
            rank=i + 1,
            is_new_listing=(arm.impressions < 50),
        )
        if EXPOSE_SCORES:
            item.score = round(arm.score, 4)
            item.exploitation = round(arm.exploitation, 4)
            item.ucb_bonus = round(arm.ucb_bonus, 4)
        items.append(item)

    elapsed_ms = int((time.time() - start) * 1000)

    logger.info("Recommended %d items for session %s in %dms", len(items), session_id, elapsed_ms)
    if items:
        top_3 = [f"{item.listing_type}:{item.listing_id}" for item in items[:3]]
        logger.debug("Top 3 results: %s", top_3)

    return RecommendationResponse(
        items=items,
        location_zone=location_zone,
        request_id=request_id,
        processing_time_ms=elapsed_ms,
    )


@app.post(
    "/api/recommendations/merge-session",
    summary="Merge anonymous session with user account",
)
async def handle_merge_session(
    body: MergeSessionRequest,
    background_tasks: BackgroundTasks,
):
    """Merge anonymous events to a user account after login.

    Triggers a background profile update for the user.
    """
    merged = merge_anonymous_session(body.session_id, body.user_id)

    # Background: trigger profile update for this user
    def _update_profile():
        try:
            from app.reco.nightly_job import run_profile_update_job
            run_profile_update_job()
        except Exception as e:
            logger.error("Background profile update failed: %s", e)

    background_tasks.add_task(_update_profile)

    return {"merged_events": merged}


@app.get("/api/recommendations/health")
async def health():
    """Health check for the recommendation system."""
    from app.reco.db import _GLOBAL_A
    return {
        "status": "ok",
        "matrix_loaded": _GLOBAL_A is not None,
        "matrix_dim": _GLOBAL_A.shape[0] if _GLOBAL_A is not None else 0,
        "expose_scores": EXPOSE_SCORES,
    }


# ──────────────────────────────────────────────────────────────
# Maintenance Endpoints
# ──────────────────────────────────────────────────────────────

@app.post(
    "/api/recommendations/maintenance/extract-tags-missing",
    summary="Extract tags for untagged listings",
)
async def trigger_extract_missing():
    """Extracts tags for listings missing from ListingTag and returns results."""
    from app.reco.tag_extractor import batch_extract_missing_listings
    result = batch_extract_missing_listings()
    return {
        "status": "success",
        "job": "extract-tags-missing",
        "results": result
    }


@app.post(
    "/api/recommendations/maintenance/extract-tags-all",
    summary="Force tag re-extraction for ALL listings",
)
async def trigger_extract_all():
    """Re-extracts tags for ALL listings in the database and returns results."""
    from app.reco.tag_extractor import batch_reextract_all_listings
    result = batch_reextract_all_listings()
    return {
        "status": "success",
        "job": "extract-tags-all",
        "results": result
    }


@app.post(
    "/api/recommendations/maintenance/extract-tags-listing",
    summary="Re-extract tags for a specific listing",
)
async def trigger_extract_listing(body: SingleExtractionRequest):
    """Re-extracts tags for a specific listing by ID and type and returns results."""
    from app.reco.tag_extractor import extract_tags_for_listing
    result = extract_tags_for_listing(body.listing_id, body.listing_type)
    return {
        "status": "success",
        "listing_id": body.listing_id,
        "listing_type": body.listing_type,
        "results": result
    }
