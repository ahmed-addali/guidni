"""Index Builder — stateless Qdrant ingestion from DB entities.

This module intentionally avoids local persistence files. Qdrant is the single
source of truth for vectors and payloads.

Design rules implemented:
1) Stateless vector DB (no docstore.json, no hash files)
2) Narrative vs Payload split
3) Rule-based deterministic tags (anti-schema bloat)
4) No synchronous LLM or web enrichment in ingestion path
"""

import asyncio
import json
import logging
import uuid
from typing import Any, Optional

from llama_index.core import Settings as LlamaSettings
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from qdrant_client import AsyncQdrantClient
from qdrant_client.http import models as qmodels
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.config import settings
from app.db.connection import async_session
from app.db.models import Activity, Attraction, Stay, Yummy

logger = logging.getLogger(__name__)

_qdrant: Optional[AsyncQdrantClient] = None
_collection_name = settings.RAG_QDRANT_COLLECTION or "guidni_entities"


def _canonical_entity_type(entity_type: str) -> str:
    """Normalize aliases so point IDs remain stable across all call paths."""
    normalized = (entity_type or "").strip().lower()
    if normalized in ("yummy", "restaurant"):
        return "restaurant"
    return normalized


def _point_uuid(entity_type: str, entity_id: str) -> str:
    """Build deterministic UUID expected by Qdrant point id validator."""
    canonical_type = _canonical_entity_type(entity_type)
    seed = f"guidni:{canonical_type}:{entity_id}"
    return str(uuid.uuid5(uuid.NAMESPACE_URL, seed))


def _to_string_list(value: Any) -> list[str]:
    """Normalize DB values to a list of lowercase strings."""
    if value is None:
        return []
    if isinstance(value, list):
        raw_items = value
    elif isinstance(value, str):
        stripped = value.strip()
        if not stripped:
            return []
        if stripped.startswith("[") and stripped.endswith("]"):
            try:
                parsed = json.loads(stripped)
                if isinstance(parsed, list):
                    raw_items = parsed
                else:
                    raw_items = [stripped]
            except Exception:
                raw_items = [part.strip() for part in stripped.split(",")]
        else:
            raw_items = [part.strip() for part in stripped.split(",")]
    else:
        raw_items = [value]

    normalized: list[str] = []
    for item in raw_items:
        txt = str(item).strip().lower().replace(" ", "_")
        if txt:
            normalized.append(txt)
    return normalized


def _unique(items: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for item in items:
        if item and item not in seen:
            seen.add(item)
            out.append(item)
    return out


def _tags_from_bool_map(bool_map: dict[str, Any]) -> list[str]:
    tags: list[str] = []
    for tag, enabled in bool_map.items():
        if bool(enabled):
            tags.append(tag)
    return tags


def _tags_from_list_fields(*fields: Any) -> list[str]:
    tags: list[str] = []
    for field in fields:
        tags.extend(_to_string_list(field))
    return tags


def _activity_tags(a: Activity) -> list[str]:
    tags = []
    tags.extend(_tags_from_list_fields(a.category, a.includes, a.excludes, a.allowed, a.forbidden, a.guide))
    tags.extend(_tags_from_bool_map({
        "cancelation_supported": a.cancelation,
        "pay_now": a.paynow,
    }))
    return _unique(tags)


def _stay_tags(s: Stay) -> list[str]:
    tags = []
    tags.extend(_tags_from_list_fields(s.propertyType, s.category, s.hostLanguages))
    tags.extend(_tags_from_bool_map({
        "wifi": s.hasWifi,
        "kitchen": s.hasKitchen,
        "air_conditioning": s.hasAirConditioning,
        "heating": s.hasHeating,
        "pool": s.hasPool,
        "garden": s.hasGarden,
        "balcony": s.hasBalcony,
        "parking": s.hasParking,
        "security": s.hasSecurity,
        "concierge": s.hasConcierge,
        "wheelchair_accessible": s.wheelchairAccessible,
        "elevator": s.elevatorAvailable,
        "pet_friendly": s.isPetFriendly,
        "smoke_free": s.isSmokeFree,
    }))
    if s.cancelationPolicy:
        tags.append(str(s.cancelationPolicy).strip().lower())
    return _unique(tags)


def _yummy_tags(y: Yummy) -> list[str]:
    tags = []
    tags.extend(_tags_from_list_fields(y.type, y.category, y.meals))
    tags.extend(_tags_from_bool_map({
        "reservations_enabled": y.reservationsEnabled,
    }))
    return _unique(tags)


def _activity_narrative(a: Activity) -> str:
    categories = ", ".join(_to_string_list(a.category)) or "experience"
    includes = ", ".join(_to_string_list(a.includes)[:3])
    core = f"{a.title} is a {categories} activity"
    location = f" in {a.city}, {a.region}" if a.city else f" in {a.region}"
    pricing = f" priced at {a.price} TND" if a.price is not None else ""
    duration = f" with a duration of {a.duration}" if a.duration else ""
    capacity = f" for up to {a.capacity} guests" if a.capacity else ""
    description = f". {a.description}" if a.description else ""
    includes_text = f" It includes {includes}." if includes else ""
    return (core + location + pricing + duration + capacity + description + includes_text).strip()


def _stay_narrative(s: Stay) -> str:
    property_type = ", ".join(_to_string_list(s.propertyType)) or "accommodation"
    location = f" in {s.city}, {s.region}" if s.city else f" in {s.region}"
    pricing = f" at {s.price} TND per night"
    capacity = (
        f" for {s.guestCount} guests, with {s.bedroomCount} bedrooms and "
        f"{s.bathroomCount} bathrooms"
    )
    amenities = ", ".join(_stay_tags(s)[:6])
    amenities_text = f" Highlights include {amenities}." if amenities else ""
    description = f" {s.description}" if s.description else ""
    return (
        f"{s.title} is a {property_type}{location}{pricing}{capacity}.{description}{amenities_text}"
    ).strip()


def _yummy_narrative(y: Yummy) -> str:
    venue_type = str(y.type or "venue").lower().replace("_", " ")
    cuisine = ", ".join(_to_string_list(y.category))
    meals = ", ".join(_to_string_list(y.meals))
    cuisine_text = f" focused on {cuisine}" if cuisine else ""
    meals_text = f" serving {meals}" if meals else ""
    reservation_text = " accepts reservations" if y.reservationsEnabled else " does not require reservations"
    description = f". {y.description}" if y.description else ""
    location = f" in {y.city}" if y.city else ""
    return (
        f"{y.name} is a {venue_type}{cuisine_text}{location}{meals_text} and{reservation_text}{description}"
    ).strip()


def _thumbnail_url(entity: Any) -> str:
    if hasattr(entity, "coverPhoto") and entity.coverPhoto:
        return str(entity.coverPhoto)
    if hasattr(entity, "logo") and entity.logo:
        return str(entity.logo)
    if hasattr(entity, "images") and entity.images:
        first = entity.images[0]
        if getattr(first, "url", None):
            return str(first.url)
    return ""


def _activity_payload(a: Activity) -> dict[str, Any]:
    return {
        "entity_type": "activity",
        "entity_id": str(a.id),
        "title": a.title,
        "description": (a.description or "")[:280],
        "category": _to_string_list(a.category),
        "price": int(a.price or 0),
        "country": a.country or "",
        "region": a.region or "",
        "city": a.city or "",
        "location": a.location or "",
        "thumbnail_url": _thumbnail_url(a),
        "tags": _activity_tags(a),
        "is_enriched": False,
    }


def _stay_payload(s: Stay) -> dict[str, Any]:
    return {
        "entity_type": "stay",
        "entity_id": str(s.id),
        "title": s.title,
        "description": (s.description or "")[:280],
        "property_type": _to_string_list(s.propertyType),
        "category": _to_string_list(s.category),
        "price": int(s.price or 0),
        "country": s.country or "",
        "region": s.region or "",
        "city": s.city or "",
        "location": s.location or "",
        "latitude": float(s.latitude) if s.latitude is not None else None,
        "longitude": float(s.longitude) if s.longitude is not None else None,
        "thumbnail_url": _thumbnail_url(s),
        "tags": _stay_tags(s),
        "is_enriched": False,
    }


def _yummy_payload(y: Yummy) -> dict[str, Any]:
    return {
        "entity_type": "restaurant",
        "entity_id": str(y.id),
        "title": y.name,
        "description": (y.description or "")[:280],
        "venue_type": str(y.type or ""),
        "category": _to_string_list(y.category),
        "country": y.country or "",
        "region": y.city or "",
        "city": y.city or "",
        "location": y.location or "",
        "thumbnail_url": _thumbnail_url(y),
        "tags": _yummy_tags(y),
        "is_enriched": False,
    }


def _attraction_payload(a: Attraction) -> dict[str, Any]:
    return {
        "entity_type": "attraction",
        "entity_id": str(a.id),
        "title": a.title,
        "description": (a.description or "")[:280],
        "category": _to_string_list(a.category),
        "region": a.location or "",
        "location": a.location or "",
        "coordinates": a.coordinates or {},
        "thumbnail_url": "",
        "tags": _unique(_tags_from_list_fields(a.category)),
        "is_enriched": False,
    }


def _get_embed_model() -> Any:
    model = LlamaSettings.embed_model
    if model is not None:
        return model

    embed_model = HuggingFaceEmbedding(
        model_name=settings.RAG_EMBEDDING_MODEL,
        trust_remote_code=True,
        device="cpu",
    )
    LlamaSettings.embed_model = embed_model
    return embed_model


async def _embed_text(text: str) -> list[float]:
    model = _get_embed_model()
    return await asyncio.to_thread(model.get_text_embedding, text)


async def _activity_to_qdrant_point(a: Activity) -> qmodels.PointStruct:
    text = _activity_narrative(a)
    payload = _activity_payload(a)
    vector = await _embed_text(text)
    return qmodels.PointStruct(id=_point_uuid("activity", str(a.id)), vector=vector, payload=payload)


async def _stay_to_qdrant_point(s: Stay) -> qmodels.PointStruct:
    text = _stay_narrative(s)
    payload = _stay_payload(s)
    vector = await _embed_text(text)
    return qmodels.PointStruct(id=_point_uuid("stay", str(s.id)), vector=vector, payload=payload)


async def _yummy_to_qdrant_point(y: Yummy) -> qmodels.PointStruct:
    text = _yummy_narrative(y)
    payload = _yummy_payload(y)
    vector = await _embed_text(text)
    return qmodels.PointStruct(id=_point_uuid("restaurant", str(y.id)), vector=vector, payload=payload)


async def _attraction_to_qdrant_point(a: Attraction) -> qmodels.PointStruct:
    text_parts = [a.title, a.description or "", a.overview or "", a.category or ""]
    text = ". ".join([part for part in text_parts if part])
    payload = _attraction_payload(a)
    vector = await _embed_text(text)
    return qmodels.PointStruct(id=_point_uuid("attraction", str(a.id)), vector=vector, payload=payload)


async def _get_qdrant_client() -> AsyncQdrantClient:
    global _qdrant
    if _qdrant is not None:
        return _qdrant

    timeout = float(settings.RAG_QDRANT_TIMEOUT or 10)
    _qdrant = AsyncQdrantClient(
        url=settings.RAG_QDRANT_URL or "http://localhost:6333",
        api_key=settings.RAG_QDRANT_API_KEY or None,
        timeout=timeout,
    )
    return _qdrant


async def _ensure_collection() -> None:
    client = await _get_qdrant_client()
    exists = await client.collection_exists(collection_name=_collection_name)
    if exists:
        return

    sample_vector = await _embed_text("guidni-rag-collection-bootstrap")
    vector_size = len(sample_vector)

    await client.create_collection(
        collection_name=_collection_name,
        vectors_config=qmodels.VectorParams(size=vector_size, distance=qmodels.Distance.COSINE),
    )


async def _upsert_points(points: list[qmodels.PointStruct], wait: bool) -> None:
    if not points:
        return
    client = await _get_qdrant_client()
    await client.upsert(collection_name=_collection_name, points=points, wait=wait)


async def build_full_index() -> AsyncQdrantClient:
    """Rebuild the full Qdrant collection from DB.

    Stateless behavior: no local files, no hash tracking.
    """
    client = await _get_qdrant_client()
    await _ensure_collection()

    # Recreate for deterministic full rebuild.
    await client.recreate_collection(
        collection_name=_collection_name,
        vectors_config=qmodels.VectorParams(
            size=len(await _embed_text("guidni-rag-recreate-probe")),
            distance=qmodels.Distance.COSINE,
        ),
    )

    logger.info("Starting full Qdrant index build into collection '%s'", _collection_name)
    all_points: list[qmodels.PointStruct] = []

    async with async_session() as session:
        activity_result = await session.execute(select(Activity).options(selectinload(Activity.images)))
        activities = activity_result.scalars().all()
        for activity in activities:
            all_points.append(await _activity_to_qdrant_point(activity))

        stay_result = await session.execute(
            select(Stay)
            .where(Stay.approvalStatus == "APPROVED")
            .options(selectinload(Stay.images))
        )
        stays = stay_result.scalars().all()
        for stay in stays:
            all_points.append(await _stay_to_qdrant_point(stay))

        yummy_result = await session.execute(
            select(Yummy)
            .options(selectinload(Yummy.images), selectinload(Yummy.hours), selectinload(Yummy.menu))
        )
        yummies = yummy_result.scalars().all()
        for yummy in yummies:
            all_points.append(await _yummy_to_qdrant_point(yummy))

        attraction_result = await session.execute(select(Attraction))
        attractions = attraction_result.scalars().all()
        for attraction in attractions:
            all_points.append(await _attraction_to_qdrant_point(attraction))

    batch_size = 64
    for i in range(0, len(all_points), batch_size):
        await _upsert_points(all_points[i:i + batch_size], wait=True)

    logger.info(
        "Qdrant rebuild complete: %d points (activities=%d, stays=%d, yummies=%d, attractions=%d)",
        len(all_points), len(activities), len(stays), len(yummies), len(attractions),
    )

    # Future async enrichment worker (Celery/RQ):
    # - Fetch points where payload.is_enriched == false
    # - Enrich tags via web + LLM extraction off-peak
    # - Patch payload.tags and set payload.is_enriched = true
    return client


async def upsert_entity(entity_type: str, entity_id: str) -> None:
    """Upsert a single entity point into Qdrant (fast path, no LLM/web calls)."""
    await _ensure_collection()

    point: Optional[qmodels.PointStruct] = None

    async with async_session() as session:
        if entity_type == "activity":
            result = await session.execute(
                select(Activity)
                .where(Activity.id == entity_id)
                .options(selectinload(Activity.images))
            )
            entity = result.scalar_one_or_none()
            if entity:
                point = await _activity_to_qdrant_point(entity)

        elif entity_type == "stay":
            result = await session.execute(
                select(Stay)
                .where(Stay.id == entity_id)
                .options(selectinload(Stay.images))
            )
            entity = result.scalar_one_or_none()
            if entity and entity.approvalStatus == "APPROVED":
                point = await _stay_to_qdrant_point(entity)

        elif entity_type in ("yummy", "restaurant"):
            result = await session.execute(
                select(Yummy)
                .where(Yummy.id == entity_id)
                .options(selectinload(Yummy.images), selectinload(Yummy.hours), selectinload(Yummy.menu))
            )
            entity = result.scalar_one_or_none()
            if entity:
                point = await _yummy_to_qdrant_point(entity)

        elif entity_type == "attraction":
            result = await session.execute(select(Attraction).where(Attraction.id == entity_id))
            entity = result.scalar_one_or_none()
            if entity:
                point = await _attraction_to_qdrant_point(entity)

    if point is None:
        await delete_entity(entity_type, entity_id)
        logger.info("Entity %s/%s not found (or not indexable) — deleted from Qdrant", entity_type, entity_id)
        return

    await _upsert_points([point], wait=False)
    logger.info("Upserted %s/%s into Qdrant collection '%s'", entity_type, entity_id, _collection_name)


async def delete_entity(entity_type: str, entity_id: str) -> None:
    """Delete a single entity point from Qdrant."""
    await _ensure_collection()
    client = await _get_qdrant_client()
    point_id = _point_uuid(entity_type, entity_id)

    await client.delete(
        collection_name=_collection_name,
        points_selector=qmodels.PointIdsList(points=[point_id]),
        wait=False,
    )
    logger.info("Deleted %s from Qdrant collection '%s'", point_id, _collection_name)


async def load_or_build_index() -> AsyncQdrantClient:
    """Ensure Qdrant collection exists and pre-warm with DB data if empty."""
    client = await _get_qdrant_client()
    await _ensure_collection()

    count_result = await client.count(collection_name=_collection_name, exact=False)
    if count_result.count == 0:
        logger.info("Qdrant collection '%s' is empty — bootstrapping from DB", _collection_name)
        return await build_full_index()

    logger.info("Qdrant collection '%s' ready with %d points", _collection_name, count_result.count)
    return client


def get_index() -> Optional[AsyncQdrantClient]:
    """Return the current Qdrant client singleton."""
    return _qdrant
