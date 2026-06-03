"""
Transformers — convert raw database rows into:
  1. embedding_text  (for BGE-M3 vectorization)
  2. payload dict    (metadata stored in Qdrant for filtering)
"""

from typing import Any


# ── Helpers ───────────────────────────────────────────────────

def _clean(text: str | None) -> str:
    """Strip and normalize whitespace."""
    if not text:
        return ""
    return " ".join(text.split())


def _parse_rating(note: str | None) -> float | None:
    if not note:
        return None
    try:
        return float(note)
    except (ValueError, TypeError):
        return None


def _parse_array(val: Any) -> list[str]:
    """Handle PostgreSQL array columns (returned as Python lists or None)."""
    if isinstance(val, list):
        return [str(v) for v in val if v]
    if isinstance(val, str) and val.startswith("{") and val.endswith("}"):
        return [v.strip('"') for v in val[1:-1].split(",") if v.strip()]
    return []


def _parse_features_text(raw: str | None) -> str:
    """Parse a features string like 'item1, item2, item3' into readable text."""
    if not raw:
        return ""
    return raw.replace(",", " ").replace(";", " ").replace("\n", " ").strip()


# ── ACTIVITY ──────────────────────────────────────────────────
# PAYLOAD: category, price, features(includes+allowed), tags, destination_id, id
# SEMANTIC: title(ar,fr), description(ar,fr), features(includes+excludes+allowed combined)

def transform_activity(row: dict) -> tuple[str, dict]:
    """Transform an activity DB row → (embedding_text, payload)."""
    tags = _parse_array(row.get("tags", []))

    includes_raw = row.get("includes") or ""
    excludes_raw = row.get("excludes") or ""
    allowed_raw = row.get("allowed") or ""

    # Features text for payload (includes + allowed)
    features_payload = []
    if includes_raw:
        features_payload.extend([f.strip() for f in includes_raw.split(",") if f.strip()])
    if allowed_raw:
        features_payload.extend([f.strip() for f in allowed_raw.split(",") if f.strip()])

    # Features text for embedding (includes + excludes + allowed combined)
    features_embed = _clean(
        f"Includes: {_parse_features_text(includes_raw)} "
        f"Excludes: {_parse_features_text(excludes_raw)} "
        f"Allowed: {_parse_features_text(allowed_raw)}"
    )

    # SEMANTIC: title(ar,fr) + description(ar,fr) + features combined
    embedding_text = _clean(
        f"{row.get('title', '')} {row.get('arabicTitle', '') or row.get('arabic_title', '') or ''} "
        f"{row.get('description', '')} {row.get('arabicDescription', '') or row.get('arabic_description', '') or ''} "
        f"{features_embed}"
    )

    # PAYLOAD
    payload = {
        "id": row["id"],
        "slug": row.get("slug", ""),
        "destination_id": row.get("destinationId") or row.get("destination_id", ""),
        "category": row.get("category", ""),
        "price": row.get("price", 0),
        "features": features_payload,
        "tags": tags,
    }

    return embedding_text, payload


# ── ATTRACTION ────────────────────────────────────────────────
# PAYLOAD: destination_id, price (hasFee/feeAmount), category
# SEMANTIC: title(ar,fr), description(ar,fr), overview

def transform_attraction(row: dict) -> tuple[str, dict]:
    """Transform an attraction DB row → (embedding_text, payload)."""
    # Get Arabic translations if available (from joined data)
    arabic_title = row.get("arabic_title") or ""
    arabic_description = row.get("arabic_description") or ""
    arabic_overview = row.get("arabic_overview") or ""

    # SEMANTIC: title + description + overview (both languages)
    embedding_text = _clean(
        f"{row.get('title', '')} {arabic_title} "
        f"{row.get('description', '')} {arabic_description} "
        f"{row.get('overview', '') or ''} {arabic_overview}"
    )

    has_fee = row.get("hasFee") or row.get("has_fee", False)
    fee_amount = row.get("feeAmount") or row.get("fee_amount") or 0

    # PAYLOAD
    payload = {
        "id": row["id"],
        "slug": row.get("slug", ""),
        "destination_id": row.get("destinationId") or row.get("destination_id", ""),
        "category": row.get("category", ""),
        "price": fee_amount if has_fee else 0,
    }

    return embedding_text, payload


# ── RENTAL ────────────────────────────────────────────────────
# PAYLOAD ONLY (no semantic search): destination_id, price_per_day, type, capacity, min_days
# SEMANTIC: NO

def transform_rental(row: dict) -> tuple[str, dict]:
    """Transform a rental DB row → (embedding_text, payload). No semantic search."""
    # Empty embedding text — rentals use pre-filtering only
    embedding_text = ""

    # PAYLOAD
    payload = {
        "id": row["id"],
        "slug": row.get("slug", ""),
        "destination_id": row.get("destinationId") or row.get("destination_id", ""),
        "rental_type": row.get("type", "CAR"),
        "price_per_day": row.get("pricePerDay") or row.get("price_per_day", 0),
        "capacity": row.get("capacity", 1),
        "min_days": row.get("minDays") or row.get("min_days", 1),
    }

    return embedding_text, payload


# ── RESTAURANT ────────────────────────────────────────────────
# PAYLOAD: type, tags(attributes), destination_id, id
# SEMANTIC: name(ar,fr), description(ar,fr)

def transform_restaurant(row: dict) -> tuple[str, dict]:
    """Transform a restaurant DB row → (embedding_text, payload)."""
    attributes = _parse_array(row.get("attributes", []))

    # SEMANTIC: name + description (both languages)
    embedding_text = _clean(
        f"{row.get('name', '')} {row.get('arabicName', '') or row.get('arabic_name', '') or ''} "
        f"{row.get('description', '')} {row.get('arabicDescription', '') or row.get('arabic_description', '') or ''}"
    )

    # PAYLOAD
    payload = {
        "id": row["id"],
        "slug": row.get("slug", ""),
        "destination_id": row.get("destinationId") or row.get("destination_id", ""),
        "type": row.get("type", "RESTAURANT"),
        "tags": attributes,  # attributes serve as tags
    }

    return embedding_text, payload


# ── STAY ──────────────────────────────────────────────────────
# PAYLOAD: property_type + category, price, tags(all boolean fields), destination_id, id, guest_count, min_stay_nights
# SEMANTIC: title(ar,fr), description(ar,fr)

STAY_BOOLEAN_FIELDS = {
    "hasWifi": "wifi", "hasKitchen": "kitchen", "hasAirConditioning": "ac",
    "hasHeating": "heating", "hasPool": "pool", "hasGarden": "garden",
    "hasBalcony": "balcony", "hasParking": "parking", "hasSecurity": "security",
    "hasConcierge": "concierge", "wheelchairAccessible": "wheelchair_accessible",
    "elevatorAvailable": "elevator", "isPetFriendly": "pet_friendly",
    "isSmokeFree": "smoke_free",
}

def transform_stay(row: dict) -> tuple[str, dict]:
    """Transform a stay DB row → (embedding_text, payload)."""
    # Build tags from ALL boolean fields
    tags = []
    for db_field, tag_name in STAY_BOOLEAN_FIELDS.items():
        if row.get(db_field, False) or row.get(tag_name, False):
            tags.append(tag_name)

    # SEMANTIC: title + description (both languages)
    embedding_text = _clean(
        f"{row.get('title', '')} {row.get('arabicTitle', '') or row.get('arabic_title', '') or ''} "
        f"{row.get('description', '')} {row.get('arabicDescription', '') or row.get('arabic_description', '') or ''}"
    )

    # PAYLOAD
    payload = {
        "id": row["id"],
        "slug": row.get("slug", ""),
        "destination_id": row.get("destinationId") or row.get("destination_id", ""),
        "property_type": row.get("propertyType") or row.get("property_type", ""),
        "category": row.get("category", ""),
        "price": row.get("price", 0),
        "tags": tags,
        "guest_count": row.get("guestCount") or row.get("guest_count", 1),
        "min_stay_nights": row.get("minStayNights") or row.get("min_stay_nights", 1),
    }

    return embedding_text, payload


# ── TRANSFER ──────────────────────────────────────────────────
# PAYLOAD ONLY (no semantic search): capacity, price, destination_id
# SEMANTIC: NO

def transform_transfer(row: dict) -> tuple[str, dict]:
    """Transform a transfer DB row → (embedding_text, payload). No semantic search."""
    # Empty embedding text — transfers use pre-filtering only
    embedding_text = ""

    price = row.get("pricePerTrip") or row.get("price_per_trip") or \
            row.get("pricePerHour") or row.get("price_per_hour") or 0

    # PAYLOAD
    payload = {
        "id": row["id"],
        "slug": row.get("slug", ""),
        "destination_id": row.get("destinationId") or row.get("destination_id", ""),
        "capacity": row.get("capacity", 4),
        "price": price,
    }

    return embedding_text, payload
