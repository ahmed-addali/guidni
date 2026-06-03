"""
Qdrant search — performs metadata pre-filtered vector searches (or filter-only scroll)
against each collection and returns scored PlanItems.

Rentals and Transfers use filter-only (no semantic search).
All other entities use vector search + pre-filtering.
"""

import logging
from typing import Any

from qdrant_client.models import Filter

from qdrant.client import get_qdrant_client
from qdrant.collections import collection_name
from qdrant.filters import (
    build_activity_filters,
    build_attraction_filters,
    build_rental_filters,
    build_restaurant_filters,
    build_stay_filters,
    build_transfer_filters,
)
from qdrant.query_builder import (
    build_activity_query,
    build_attraction_query,
    build_restaurant_query,
    build_stay_query,
)
from embeddings.bge_m3 import EmbeddingService
from models.preferences import UserPreferences
from models.plan_item import PlanItem, ScoredPlanItem

logger = logging.getLogger(__name__)


# ── Payload → PlanItem converters ─────────────────────────────


def _payload_to_activity(payload: dict[str, Any], score: float) -> ScoredPlanItem:
    return ScoredPlanItem(
        id=payload.get("id", ""),
        type="ACTIVITY",
        slug=payload.get("slug", ""),
        name=payload.get("title", ""),
        arabicName=payload.get("arabic_title"),
        imageUrl=payload.get("image_url"),
        location=payload.get("location"),
        price=payload.get("price", 0),
        priceLabel="per person",
        durationMinutes=payload.get("duration_minutes"),
        intensity=payload.get("intensity", "medium"),
        tags=payload.get("tags", []),
        idealTime=payload.get("best_time_of_day", "any"),
        bookingUrl=payload.get("booking_url"),
        nbReviews=payload.get("nb_reviews", 0),
        rating=payload.get("rating"),
        score=score,
        ragScore=score,
    )


def _payload_to_attraction(payload: dict[str, Any], score: float) -> ScoredPlanItem:
    has_fee = payload.get("has_fee", False)
    price = payload.get("price", 0)
    return ScoredPlanItem(
        id=payload.get("id", ""),
        type="ATTRACTION",
        slug=payload.get("slug", ""),
        name=payload.get("title", ""),
        imageUrl=payload.get("image_url"),
        location=payload.get("location"),
        price=price,
        priceLabel="entry fee" if has_fee else "free",
        durationMinutes=90,
        intensity="low",
        tags=[payload.get("category", "")],
        idealTime="morning",
        bookingUrl=payload.get("booking_url"),
        score=score,
        ragScore=score,
    )


def _payload_to_restaurant(payload: dict[str, Any], score: float) -> ScoredPlanItem:
    return ScoredPlanItem(
        id=payload.get("id", ""),
        type="RESTAURANT",
        slug=payload.get("slug", ""),
        name=payload.get("name", ""),
        arabicName=payload.get("arabic_name"),
        imageUrl=payload.get("image_url"),
        location=payload.get("city"),
        price=0,
        priceLabel="estimated per person",
        durationMinutes=90,
        intensity="low",
        tags=payload.get("tags", []),  # attributes stored as tags
        idealTime="any",
        bookingUrl=payload.get("booking_url"),
        nbReviews=payload.get("nb_reviews", 0),
        rating=payload.get("rating"),
        score=score,
        ragScore=score,
    )


def _payload_to_transfer(payload: dict[str, Any], score: float) -> ScoredPlanItem:
    return ScoredPlanItem(
        id=payload.get("id", ""),
        type="TRANSFER",
        slug=payload.get("slug", ""),
        name=payload.get("title", ""),
        arabicName=payload.get("arabic_title"),
        imageUrl=payload.get("image_url"),
        price=payload.get("price", 0),
        priceLabel="per trip",
        durationMinutes=30,
        intensity="low",
        tags=[],
        idealTime="any",
        bookingUrl=payload.get("booking_url"),
        transferType=payload.get("transfer_type"),
        capacity=payload.get("capacity"),
        isAC=payload.get("is_ac"),
        isChildSeat=payload.get("is_child_seat"),
        nbReviews=payload.get("nb_reviews", 0),
        rating=payload.get("rating"),
        score=score,
        ragScore=score,
    )


def _payload_to_rental(payload: dict[str, Any], score: float) -> ScoredPlanItem:
    return ScoredPlanItem(
        id=payload.get("id", ""),
        type="RENTAL",
        slug=payload.get("slug", ""),
        name=payload.get("title", ""),
        arabicName=payload.get("arabic_title"),
        imageUrl=payload.get("image_url"),
        price=payload.get("price_per_day", 0),
        priceLabel="per day",
        durationMinutes=0,
        intensity="low",
        tags=[],
        idealTime="any",
        bookingUrl=payload.get("booking_url"),
        capacity=payload.get("capacity"),
        score=score,
        ragScore=score,
    )


def _payload_to_stay(payload: dict[str, Any], score: float) -> ScoredPlanItem:
    return ScoredPlanItem(
        id=payload.get("id", ""),
        type="STAY",
        slug=payload.get("slug", ""),
        name=payload.get("title", ""),
        arabicName=payload.get("arabic_title"),
        imageUrl=payload.get("image_url"),
        location=payload.get("city"),
        price=payload.get("price", 0),
        priceLabel="per night",
        intensity="low",
        tags=payload.get("tags", []),  # boolean fields stored as tags
        idealTime="any",
        bookingUrl=payload.get("booking_url"),
        propertyType=payload.get("property_type"),
        guestCount=payload.get("guest_count"),
        averageRating=payload.get("average_rating"),
        nbReviews=payload.get("nb_reviews", 0),
        rating=payload.get("average_rating"),
        score=score,
        ragScore=score,
    )


# ── Converters map ────────────────────────────────────────────

_CONVERTERS = {
    "activities": _payload_to_activity,
    "attractions": _payload_to_attraction,
    "restaurants": _payload_to_restaurant,
    "transfers": _payload_to_transfer,
    "rentals": _payload_to_rental,
    "stays": _payload_to_stay,
}


# ── Vector search function (semantic + pre-filtering) ─────────


def _search_collection(
    entity_type: str,
    query_vector: list[float],
    filters: Filter,
    limit: int = 20,
    search_query_text: str = "",
) -> list[ScoredPlanItem]:
    """
    Execute a filtered vector search against a collection and convert results.
    Uses query_points (qdrant-client >= 1.12 API).
    """
    client = get_qdrant_client()
    name = collection_name(entity_type)
    converter = _CONVERTERS[entity_type]

    if not client.collection_exists(name):
        logger.warning("Collection %s does not exist — returning empty results", name)
        return []

    logger.info("")
    logger.info("=" * 70)
    logger.info("🔍 VECTOR SEARCH [%s] — limit=%d", name, limit)
    if search_query_text:
        logger.info("📝 Semantic query: \"%s\"", search_query_text[:120])
    logger.info("=" * 70)

    results = client.query_points(
        collection_name=name,
        query=query_vector,
        query_filter=filters,
        limit=limit,
        with_payload=True,
        score_threshold=0.0,
    )

    items = []
    for point in results.points:
        payload = point.payload or {}
        item = converter(payload, point.score)
        items.append(item)

    _log_results_table(entity_type, items)
    return items


# ── Filter-only search (no semantic — for Rentals & Transfers) ──


def _scroll_collection(
    entity_type: str,
    filters: Filter,
    limit: int = 20,
) -> list[ScoredPlanItem]:
    """
    Filter-only retrieval (no vector search).
    Used for Rentals and Transfers which don't have semantic embeddings.
    Uses scroll to get matching points by metadata only.
    """
    client = get_qdrant_client()
    name = collection_name(entity_type)
    converter = _CONVERTERS[entity_type]

    if not client.collection_exists(name):
        logger.warning("Collection %s does not exist — returning empty results", name)
        return []

    logger.info("")
    logger.info("=" * 70)
    logger.info("📋 FILTER-ONLY SCROLL [%s] — limit=%d (no semantic search)", name, limit)
    logger.info("=" * 70)

    points, _next = client.scroll(
        collection_name=name,
        scroll_filter=filters,
        limit=limit,
        with_payload=True,
        with_vectors=False,
    )

    items = []
    for point in points:
        payload = point.payload or {}
        # No vector score — use 1.0 as base score (all filtered results are equally relevant)
        item = converter(payload, 1.0)
        items.append(item)

    _log_results_table(entity_type, items)
    return items


# ── Shared logging ────────────────────────────────────────────


def _log_results_table(entity_type: str, items: list[ScoredPlanItem]) -> None:
    """Log a results table for debugging."""
    if items:
        logger.info("┌─── RESULTS: %d items from [%s] ───", len(items), entity_type.upper())
        logger.info("│ %-4s  %-35s  %-8s  %-8s  %s", "#", "NAME", "SCORE", "PRICE", "TAGS")
        logger.info("│ %s", "-" * 75)
        for i, item in enumerate(items):
            tags_str = ", ".join((item.tags or [])[:4])
            logger.info(
                "│ %-4d  %-35s  %-8.4f  %-8s  %s",
                i + 1,
                (item.name or "?")[:35],
                item.score,
                f"{item.price} TND",
                tags_str[:40] or "—",
            )
        logger.info("└───")
    else:
        logger.warning("⚠️  No results from [%s] — filters too strict?", entity_type.upper())


# ── Public search functions ───────────────────────────────────


def search_activities(
    prefs: UserPreferences,
    query: str | None = None,
    limit: int = 20,
    exclude_ids: list[str] | None = None,
) -> list[ScoredPlanItem]:
    """Search activities with metadata pre-filtering + semantic ranking."""
    embed = EmbeddingService.get_instance()
    search_query = query or build_activity_query(prefs)
    query_vector = embed.embed_query(search_query)
    filters = build_activity_filters(prefs, exclude_ids)
    return _search_collection("activities", query_vector, filters, limit, search_query)


def search_attractions(
    prefs: UserPreferences,
    query: str | None = None,
    limit: int = 15,
    exclude_ids: list[str] | None = None,
) -> list[ScoredPlanItem]:
    """Search attractions with metadata pre-filtering + semantic ranking."""
    embed = EmbeddingService.get_instance()
    search_query = query or build_attraction_query(prefs)
    query_vector = embed.embed_query(search_query)
    filters = build_attraction_filters(prefs, exclude_ids)
    return _search_collection("attractions", query_vector, filters, limit, search_query)


def search_restaurants(
    prefs: UserPreferences,
    slot: str = "lunch",
    query: str | None = None,
    limit: int = 20,
    exclude_ids: list[str] | None = None,
) -> list[ScoredPlanItem]:
    """Search restaurants with metadata pre-filtering + semantic ranking."""
    embed = EmbeddingService.get_instance()
    search_query = query or build_restaurant_query(prefs, slot)
    query_vector = embed.embed_query(search_query)
    filters = build_restaurant_filters(prefs, slot, exclude_ids)
    return _search_collection("restaurants", query_vector, filters, limit, search_query)


def search_stays(
    prefs: UserPreferences,
    query: str | None = None,
    limit: int = 10,
) -> list[ScoredPlanItem]:
    """Search stays with metadata pre-filtering + semantic ranking."""
    embed = EmbeddingService.get_instance()
    search_query = query or build_stay_query(prefs)
    query_vector = embed.embed_query(search_query)
    filters = build_stay_filters(prefs)
    return _search_collection("stays", query_vector, filters, limit, search_query)


def search_transfers(
    prefs: UserPreferences,
    limit: int = 10,
) -> list[ScoredPlanItem]:
    """Search transfers with FILTER-ONLY (no semantic search)."""
    filters = build_transfer_filters(prefs)
    return _scroll_collection("transfers", filters, limit)


def search_rentals(
    prefs: UserPreferences,
    limit: int = 10,
) -> list[ScoredPlanItem]:
    """Search rentals with FILTER-ONLY (no semantic search)."""
    filters = build_rental_filters(prefs)
    return _scroll_collection("rentals", filters, limit)
