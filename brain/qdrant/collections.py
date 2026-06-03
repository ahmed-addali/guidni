"""
Qdrant collection definitions — schema, creation, and payload indexes
for each entity type: activities, stays, restaurants, transfers, rentals, attractions.
"""

import logging

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PayloadSchemaType,
)

from config import get_settings

logger = logging.getLogger(__name__)

# ── Collection name helpers ───────────────────────────────────

COLLECTION_TYPES = [
    "activities",
    "stays",
    "restaurants",
    "transfers",
    "rentals",
    "attractions",
]


def collection_name(entity_type: str) -> str:
    """Returns the full collection name, e.g. 'guidni_activities'."""
    settings = get_settings()
    return f"{settings.qdrant_collection_prefix}{entity_type}"


# ── Payload index definitions per collection ──────────────────

PAYLOAD_INDEXES: dict[str, list[tuple[str, PayloadSchemaType]]] = {
    "activities": [
        ("destination_id", PayloadSchemaType.KEYWORD),
        ("id", PayloadSchemaType.KEYWORD),
        ("category", PayloadSchemaType.KEYWORD),
        ("price", PayloadSchemaType.INTEGER),
        ("features", PayloadSchemaType.KEYWORD),
        ("tags", PayloadSchemaType.KEYWORD),
    ],
    "stays": [
        ("destination_id", PayloadSchemaType.KEYWORD),
        ("id", PayloadSchemaType.KEYWORD),
        ("property_type", PayloadSchemaType.KEYWORD),
        ("category", PayloadSchemaType.KEYWORD),
        ("price", PayloadSchemaType.INTEGER),
        ("tags", PayloadSchemaType.KEYWORD),
        ("guest_count", PayloadSchemaType.INTEGER),
        ("min_stay_nights", PayloadSchemaType.INTEGER),
    ],
    "restaurants": [
        ("destination_id", PayloadSchemaType.KEYWORD),
        ("id", PayloadSchemaType.KEYWORD),
        ("type", PayloadSchemaType.KEYWORD),
        ("tags", PayloadSchemaType.KEYWORD),
    ],
    "transfers": [
        ("destination_id", PayloadSchemaType.KEYWORD),
        ("capacity", PayloadSchemaType.INTEGER),
        ("price", PayloadSchemaType.INTEGER),
    ],
    "rentals": [
        ("destination_id", PayloadSchemaType.KEYWORD),
        ("rental_type", PayloadSchemaType.KEYWORD),
        ("price_per_day", PayloadSchemaType.INTEGER),
        ("capacity", PayloadSchemaType.INTEGER),
        ("min_days", PayloadSchemaType.INTEGER),
    ],
    "attractions": [
        ("destination_id", PayloadSchemaType.KEYWORD),
        ("category", PayloadSchemaType.KEYWORD),
        ("price", PayloadSchemaType.INTEGER),
    ],
}


# ── Collection lifecycle ──────────────────────────────────────


def create_collections(client: QdrantClient, recreate: bool = False) -> None:
    """
    Create all 6 Qdrant collections with proper vector params and payload indexes.
    If recreate=True, existing collections are deleted first.
    """
    settings = get_settings()

    for entity_type in COLLECTION_TYPES:
        name = collection_name(entity_type)

        if recreate:
            if client.collection_exists(name):
                client.delete_collection(name)
                logger.info("Deleted collection: %s", name)

        if not client.collection_exists(name):
            client.create_collection(
                collection_name=name,
                vectors_config=VectorParams(
                    size=settings.embedding_dimension,
                    distance=Distance.COSINE,
                ),
            )
            logger.info("Created collection: %s (dim=%d)", name, settings.embedding_dimension)

            # Create payload indexes for fast filtering
            for field_name, field_type in PAYLOAD_INDEXES.get(entity_type, []):
                client.create_payload_index(
                    collection_name=name,
                    field_name=field_name,
                    field_schema=field_type,
                )
            logger.info(
                "  → Created %d payload indexes",
                len(PAYLOAD_INDEXES.get(entity_type, [])),
            )
        else:
            logger.info("Collection already exists: %s", name)


def get_collection_stats(client: QdrantClient) -> dict[str, int]:
    """Return point counts for each collection."""
    stats = {}
    for entity_type in COLLECTION_TYPES:
        name = collection_name(entity_type)
        if client.collection_exists(name):
            info = client.get_collection(name)
            stats[entity_type] = info.points_count or 0
        else:
            stats[entity_type] = -1
    return stats
