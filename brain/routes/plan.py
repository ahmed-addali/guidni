"""
Plan generation endpoint — the main entry point called by the Next.js planner.
Fetches all relevant items via RAG, returns pre-ranked PlannerData.
"""

import logging
import time
from fastapi import APIRouter

from models.preferences import UserPreferences, SwapRequest
from models.plan_item import PlannerData, ScoredPlanItem
from qdrant.search import (
    search_activities,
    search_attractions,
    search_rentals,
    search_restaurants,
    search_stays,
    search_transfers,
)
from scoring.hybrid import apply_hybrid_scoring, apply_restaurant_hybrid_scoring

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/generate", response_model=PlannerData)
async def generate_plan_data(prefs: UserPreferences):
    """
    Main endpoint called by the Next.js planner wizard.
    Searches all 6 collections with metadata pre-filtering
    and returns pre-ranked PlannerData.
    """
    start = time.time()

    logger.info("")
    logger.info("🧠" + "=" * 68)
    logger.info("🧠  PLAN GENERATION REQUEST")
    logger.info("🧠" + "=" * 68)
    logger.info("🧠  Destination:  %s (id=%s)", prefs.destination_name or prefs.destination_city, prefs.destination_id)
    logger.info("🧠  Duration:     %d days", prefs.duration)
    logger.info("🧠  Budget:       level %d", prefs.budget)
    logger.info("🧠  Group:        %s", prefs.group_type)
    logger.info("🧠  Style:        %s", prefs.travel_style)
    logger.info("🧠  Interests:    %s", ", ".join(prefs.interests))
    logger.info("🧠  Accommodation:%s", prefs.accommodation_type)
    logger.info("🧠  Needs rental: %s (type=%s)", prefs.needs_rental, prefs.rental_type)
    logger.info("🧠  Airport:      pickup=%s, return=%s", prefs.needs_airport_pickup, prefs.needs_return_transfer)
    logger.info("🧠" + "=" * 68)

    # Activity count depends on duration + travel style
    style_multiplier = {"relaxed": 2, "balanced": 3, "active": 4}
    activity_limit = prefs.duration * style_multiplier.get(prefs.travel_style, 3)

    # ── 1. Activities ─────────────────────────────────────────
    t0 = time.time()
    activities = search_activities(prefs, limit=activity_limit)
    activities = apply_hybrid_scoring(activities, prefs)
    logger.info("⏱  Activities search + scoring: %.2fs", time.time() - t0)

    # ── 2. Attractions ────────────────────────────────────────
    t0 = time.time()
    attractions = search_attractions(prefs, limit=prefs.duration * 2)
    attractions = apply_hybrid_scoring(attractions, prefs)
    logger.info("⏱  Attractions search + scoring: %.2fs", time.time() - t0)

    # ── 3. Restaurants (lunch + evening) ──────────────────────
    t0 = time.time()
    restaurants_lunch = search_restaurants(prefs, slot="lunch", limit=prefs.duration)
    restaurants_lunch = apply_restaurant_hybrid_scoring(restaurants_lunch, prefs, "lunch")

    restaurants_evening = search_restaurants(prefs, slot="evening", limit=prefs.duration)
    restaurants_evening = apply_restaurant_hybrid_scoring(restaurants_evening, prefs, "evening")

    # Merge and deduplicate restaurants (keep highest score)
    seen_ids: set[str] = set()
    merged_restaurants: list[ScoredPlanItem] = []
    for r in sorted(restaurants_lunch + restaurants_evening, key=lambda x: x.score, reverse=True):
        if r.id not in seen_ids:
            seen_ids.add(r.id)
            merged_restaurants.append(r)
    logger.info("⏱  Restaurants search + scoring: %.2fs (merged=%d, deduped from lunch=%d + evening=%d)",
                time.time() - t0, len(merged_restaurants), len(restaurants_lunch), len(restaurants_evening))

    # ── 4. Transfers ──────────────────────────────────────────
    t0 = time.time()
    transfers = search_transfers(prefs, limit=10)
    transfers = apply_hybrid_scoring(transfers, prefs)
    logger.info("⏱  Transfers search + scoring: %.2fs", time.time() - t0)

    # ── 5. Rentals ────────────────────────────────────────────
    t0 = time.time()
    rentals = search_rentals(prefs, limit=10)
    rentals = apply_hybrid_scoring(rentals, prefs)
    logger.info("⏱  Rentals search + scoring: %.2fs", time.time() - t0)

    # ── 6. Stays ──────────────────────────────────────────────
    t0 = time.time()
    stays = search_stays(prefs, limit=5)
    stays = apply_hybrid_scoring(stays, prefs)
    matched_stay = stays[0] if stays else None
    logger.info("⏱  Stays search + scoring: %.2fs", time.time() - t0)

    result = PlannerData(
        activities=activities,
        attractions=attractions,
        restaurants=merged_restaurants,
        transfers=transfers,
        rentals=rentals,
        matchedStay=matched_stay,
    )

    elapsed = time.time() - start

    # ── Final summary ─────────────────────────────────────────
    logger.info("")
    logger.info("✅" + "=" * 68)
    logger.info("✅  PLAN GENERATION COMPLETE in %.2fs", elapsed)
    logger.info("✅" + "=" * 68)
    logger.info("✅  Activities:   %d items  (top: %s — score %.4f)",
                len(activities),
                activities[0].name if activities else "none",
                activities[0].score if activities else 0)
    logger.info("✅  Attractions:  %d items  (top: %s — score %.4f)",
                len(attractions),
                attractions[0].name if attractions else "none",
                attractions[0].score if attractions else 0)
    logger.info("✅  Restaurants:  %d items  (top: %s — score %.4f)",
                len(merged_restaurants),
                merged_restaurants[0].name if merged_restaurants else "none",
                merged_restaurants[0].score if merged_restaurants else 0)
    logger.info("✅  Transfers:    %d items", len(transfers))
    logger.info("✅  Rentals:      %d items", len(rentals))
    logger.info("✅  Matched Stay: %s (score %.4f)",
                matched_stay.name if matched_stay else "NONE",
                matched_stay.score if matched_stay else 0)
    logger.info("✅" + "=" * 68)

    return result


@router.post("/swap-alternatives", response_model=list[ScoredPlanItem])
async def get_swap_alternatives(req: SwapRequest):
    """
    Get alternative items for the swap sheet.
    Returns top items of the same type that are NOT in the current plan.
    """
    logger.info("🔄 SWAP REQUEST: type=%s, current=%s, excluding=%d items",
                req.item_type, req.current_item_id, len(req.existing_item_ids))

    exclude = list(set([req.current_item_id] + req.existing_item_ids))

    if req.item_type == "ACTIVITY":
        items = search_activities(req.preferences, limit=req.limit, exclude_ids=exclude)
        return apply_hybrid_scoring(items, req.preferences)

    elif req.item_type == "ATTRACTION":
        items = search_attractions(req.preferences, limit=req.limit, exclude_ids=exclude)
        return apply_hybrid_scoring(items, req.preferences)

    elif req.item_type == "RESTAURANT":
        slot = "lunch" if req.slot_type == "lunch" else "evening"
        items = search_restaurants(req.preferences, slot=slot, limit=req.limit, exclude_ids=exclude)
        return apply_restaurant_hybrid_scoring(items, req.preferences, slot)

    elif req.item_type == "TRANSFER":
        items = search_transfers(req.preferences, limit=req.limit)
        return apply_hybrid_scoring(items, req.preferences)

    elif req.item_type == "RENTAL":
        items = search_rentals(req.preferences, limit=req.limit)
        return apply_hybrid_scoring(items, req.preferences)

    elif req.item_type == "STAY":
        items = search_stays(req.preferences, limit=req.limit)
        return apply_hybrid_scoring(items, req.preferences)

    return []
