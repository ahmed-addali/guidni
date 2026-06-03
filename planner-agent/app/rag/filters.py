"""
Qdrant metadata filter builders — convert UserPreferences into Qdrant Filter objects.
Each builder produces a Filter with must / should / must_not conditions
that are applied BEFORE vector similarity search (pre-filtering).
"""

import logging

from qdrant_client.models import (
    Filter,
    FieldCondition,
    MatchValue,
    MatchAny,
    Range,
    MinShould,
)

from app.schemas.requests import UserPreferences

logger = logging.getLogger(__name__)


# ── Budget thresholds (max price per level) ───────────────────
BUDGET_THRESHOLDS = {1: 50, 2: 150, 3: 500}

# ── Stay budget per night ─────────────────────────────────────
STAY_BUDGET_PER_NIGHT = {1: 100, 2: 300, 3: 800}

# ── Group size map ────────────────────────────────────────────
GROUP_SIZE = {"solo": 1, "couple": 2, "family": 4, "friends": 3}

# ── Property type mapping (user selection → DB values) ────────
ACCOMMODATION_TYPE_MAP = {
    "hotel": ["Hotel", "hotel", "HOTEL"],
    "riad": ["Riad", "riad", "RIAD", "Dar", "dar"],
    "apartment": ["Apartment", "apartment", "APARTMENT", "Studio", "studio"],
    "hostel": ["Hostel", "hostel", "HOSTEL"],
}


def _log_filter(collection: str, must: list, should: list, must_not: list) -> None:
    """Log a human-readable summary of the Qdrant filter."""
    parts = []
    for f in must:
        if f.match:
            if isinstance(f.match, MatchValue):
                parts.append(f"  MUST  {f.key} == {f.match.value}")
            elif isinstance(f.match, MatchAny):
                parts.append(f"  MUST  {f.key} IN {f.match.any}")
        elif f.range:
            r = f.range
            conds = []
            if r.gte is not None: conds.append(f">= {r.gte}")
            if r.lte is not None: conds.append(f"<= {r.lte}")
            parts.append(f"  MUST  {f.key} {', '.join(conds)}")
    for f in should:
        if f.match:
            if isinstance(f.match, MatchValue):
                parts.append(f"  SHOULD {f.key} == {f.match.value}")
            elif isinstance(f.match, MatchAny):
                parts.append(f"  SHOULD {f.key} IN {f.match.any}")
    for f in must_not:
        if f.match:
            if isinstance(f.match, MatchValue):
                parts.append(f"  MUST NOT {f.key} == {f.match.value}")
    
    logger.info("┌── FILTERS for [%s] ──", collection)
    for p in parts:
        logger.info("│ %s", p)
    logger.info("└── %d must, %d should, %d must_not", len(must), len(should), len(must_not))


# ── ACTIVITY ──────────────────────────────────────────────────
# Payload: category, price, features(includes+allowed), tags, destination_id, id

def build_activity_filters(prefs: UserPreferences, exclude_ids: list[str] | None = None) -> Filter:
    """Build Qdrant pre-filters for activity search."""
    must: list[FieldCondition] = [
        FieldCondition(key="destination_id", match=MatchValue(value=prefs.destination_id)),
        FieldCondition(key="status", match=MatchValue(value="ACTIVE")),
    ]
    should: list[FieldCondition] = []
    must_not: list[FieldCondition] = []

    # Price within budget (30% tolerance)
    threshold = BUDGET_THRESHOLDS.get(prefs.budget, 150)
    must.append(
        FieldCondition(key="price", range=Range(lte=int(threshold * 1.3)))
    )

    # Interest tags — boost matches
    if prefs.interests:
        should.append(
            FieldCondition(key="tags", match=MatchAny(any=list(prefs.interests)))
        )

    # Exclude already-used items
    if exclude_ids:
        for eid in exclude_ids:
            must_not.append(
                FieldCondition(key="id", match=MatchValue(value=eid))
            )

    _log_filter("ACTIVITIES", must, should, must_not)
    return Filter(must=must, should=None if should else None, must_not=must_not if must_not else None,min_should=MinShould(conditions=should, min_count=0) if should else None)


# ── ATTRACTION ────────────────────────────────────────────────
# Payload: destination_id, price (hasFee/feeAmount), category

def build_attraction_filters(
    prefs: UserPreferences, exclude_ids: list[str] | None = None
) -> Filter:
    """Build Qdrant pre-filters for attraction search."""
    must: list[FieldCondition] = [
        FieldCondition(key="destination_id", match=MatchValue(value=prefs.destination_id)),
    ]
    must_not: list[FieldCondition] = []

    # Budget=1: prefer free attractions
    if prefs.budget == 1:
        must.append(
            FieldCondition(key="price", match=MatchValue(value=0))
        )

    if exclude_ids:
        for eid in exclude_ids:
            must_not.append(FieldCondition(key="id", match=MatchValue(value=eid)))

    _log_filter("ATTRACTIONS", must, [], must_not)
    return Filter(must=must, must_not=must_not if must_not else None)


# ── RENTAL ────────────────────────────────────────────────────
# Payload: destination_id, price_per_day, type, capacity, min_days

def build_rental_filters(prefs: UserPreferences) -> Filter:
    """Build Qdrant pre-filters for rental search."""
    must: list[FieldCondition] = [
        FieldCondition(key="destination_id", match=MatchValue(value=prefs.destination_id)),
        FieldCondition(key="status", match=MatchValue(value="ACTIVE")),
    ]

    # Rental type
    if prefs.rental_type:
        must.append(
            FieldCondition(key="rental_type", match=MatchValue(value=prefs.rental_type.upper()))
        )

    # Budget-based price per day
    max_per_day = BUDGET_THRESHOLDS.get(prefs.budget, 150)
    must.append(
        FieldCondition(key="price_per_day", range=Range(lte=int(max_per_day * 0.5)))
    )

    # Min days <= duration
    must.append(
        FieldCondition(key="min_days", range=Range(lte=prefs.duration))
    )

    _log_filter("RENTALS", must, [], [])
    return Filter(must=must)


# ── RESTAURANT ────────────────────────────────────────────────
# Payload: type, tags(attributes), destination_id, id

def build_restaurant_filters(
    prefs: UserPreferences,
    slot: str = "lunch",
    exclude_ids: list[str] | None = None,
) -> Filter:
    """Build Qdrant pre-filters for restaurant search."""
    must: list[FieldCondition] = [
        FieldCondition(key="destination_id", match=MatchValue(value=prefs.destination_id)),
        FieldCondition(key="status", match=MatchValue(value="APPROVED")),
    ]
    should: list[FieldCondition] = []
    must_not: list[FieldCondition] = []

    # Group-specific attribute boosts via tags
    if prefs.group_type == "couple":
        should.append(
            FieldCondition(key="tags", match=MatchAny(any=["romantic", "sea_view", "rooftop", "cosy"]))
        )
    elif prefs.group_type == "family":
        should.append(
            FieldCondition(key="tags", match=MatchAny(any=["family_friendly", "kids_menu", "terrace"]))
        )
    elif prefs.group_type == "friends":
        should.append(
            FieldCondition(key="tags", match=MatchAny(any=["live_music", "sports_screen", "terrace"]))
        )

    if exclude_ids:
        for eid in exclude_ids:
            must_not.append(FieldCondition(key="id", match=MatchValue(value=eid)))

    _log_filter(f"RESTAURANTS ({slot})", must, should, must_not)
    return Filter(must=must, should=None, must_not=must_not if must_not else None,min_should=MinShould(conditions=should, min_count=0) if should else None)


# ── STAY ──────────────────────────────────────────────────────
# Payload: property_type + category, price, tags(boolean fields), destination_id, id, guest_count, min_stay_nights

def build_stay_filters(prefs: UserPreferences) -> Filter:
    """Build Qdrant pre-filters for stay/accommodation search."""
    must: list[FieldCondition] = [
        FieldCondition(key="destination_id", match=MatchValue(value=prefs.destination_id)),
        FieldCondition(key="status", match=MatchValue(value="APPROVED")),
    ]
    should: list[FieldCondition] = []

    # Accommodation type → property_type
    type_values = ACCOMMODATION_TYPE_MAP.get(prefs.accommodation_type, [prefs.accommodation_type])
    must.append(
        FieldCondition(key="property_type", match=MatchAny(any=type_values))
    )

    # Budget per night
    max_price = STAY_BUDGET_PER_NIGHT.get(prefs.budget, 300)
    must.append(
        FieldCondition(key="price", range=Range(lte=int(max_price * 1.2)))
    )

    # Guest capacity
    min_guests = GROUP_SIZE.get(prefs.group_type, 2)
    must.append(
        FieldCondition(key="guest_count", range=Range(gte=min_guests))
    )

    # Duration constraint: min_stay_nights <= trip duration
    must.append(
        FieldCondition(key="min_stay_nights", range=Range(lte=prefs.duration))
    )

    # Group-specific tag boosts (from boolean fields stored as tags)
    if prefs.group_type == "family":
        should.append(
            FieldCondition(key="tags", match=MatchAny(any=["pool", "kitchen", "garden", "pet_friendly"]))
        )
    elif prefs.group_type == "couple":
        should.append(
            FieldCondition(key="tags", match=MatchAny(any=["pool", "balcony", "ac"]))
        )

    _log_filter("STAYS", must, should, [])
    return Filter(must=must, should=None,min_should=MinShould(conditions=should, min_count=0) if should else None)


# ── TRANSFER ──────────────────────────────────────────────────
# Payload: capacity, price, destination_id

def build_transfer_filters(prefs: UserPreferences) -> Filter:
    """Build Qdrant pre-filters for transfer search."""
    must: list[FieldCondition] = [
        FieldCondition(key="destination_id", match=MatchValue(value=prefs.destination_id)),
        FieldCondition(key="status", match=MatchValue(value="ACTIVE")),
    ]

    # Capacity
    min_capacity = GROUP_SIZE.get(prefs.group_type, 2)
    must.append(
        FieldCondition(key="capacity", range=Range(gte=min_capacity))
    )

    _log_filter("TRANSFERS", must, [], [])
    return Filter(must=must)
