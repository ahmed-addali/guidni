"""
Search endpoints — per-collection RAG search with metadata pre-filtering.
"""

from fastapi import APIRouter

from models.preferences import SearchRequest
from models.plan_item import ScoredPlanItem
from qdrant.search import (
    search_activities,
    search_attractions,
    search_rentals,
    search_restaurants,
    search_stays,
    search_transfers,
)
from scoring.hybrid import apply_hybrid_scoring, apply_restaurant_hybrid_scoring

router = APIRouter()


@router.post("/activities", response_model=list[ScoredPlanItem])
async def search_activities_endpoint(req: SearchRequest):
    """Search activities with metadata pre-filtering + hybrid scoring."""
    items = search_activities(
        prefs=req.preferences,
        query=req.query,
        limit=req.limit,
        exclude_ids=req.exclude_ids,
    )
    return apply_hybrid_scoring(items, req.preferences)


@router.post("/attractions", response_model=list[ScoredPlanItem])
async def search_attractions_endpoint(req: SearchRequest):
    """Search attractions with metadata pre-filtering + hybrid scoring."""
    items = search_attractions(
        prefs=req.preferences,
        query=req.query,
        limit=req.limit,
        exclude_ids=req.exclude_ids,
    )
    return apply_hybrid_scoring(items, req.preferences)


@router.post("/restaurants", response_model=list[ScoredPlanItem])
async def search_restaurants_endpoint(req: SearchRequest):
    """Search restaurants with metadata pre-filtering + hybrid scoring."""
    slot = req.slot or "lunch"
    items = search_restaurants(
        prefs=req.preferences,
        slot=slot,
        query=req.query,
        limit=req.limit,
        exclude_ids=req.exclude_ids,
    )
    return apply_restaurant_hybrid_scoring(items, req.preferences, slot)


@router.post("/stays", response_model=list[ScoredPlanItem])
async def search_stays_endpoint(req: SearchRequest):
    """Search stays with metadata pre-filtering + hybrid scoring."""
    items = search_stays(
        prefs=req.preferences,
        query=req.query,
        limit=req.limit,
    )
    return apply_hybrid_scoring(items, req.preferences)


@router.post("/transfers", response_model=list[ScoredPlanItem])
async def search_transfers_endpoint(req: SearchRequest):
    """Search transfers with metadata pre-filtering + hybrid scoring."""
    items = search_transfers(
        prefs=req.preferences,
        query=req.query,
        limit=req.limit,
    )
    return apply_hybrid_scoring(items, req.preferences)


@router.post("/rentals", response_model=list[ScoredPlanItem])
async def search_rentals_endpoint(req: SearchRequest):
    """Search rentals with metadata pre-filtering + hybrid scoring."""
    items = search_rentals(
        prefs=req.preferences,
        query=req.query,
        limit=req.limit,
    )
    return apply_hybrid_scoring(items, req.preferences)
