"""
Ingestion pipeline — reads all data from PostgreSQL, generates embeddings,
and upserts into Qdrant collections with metadata payloads.

Supports:
  - Full re-ingestion (all collections)
  - Single-item upsert/delete (for auto-trigger on partner actions)
"""

import logging
import uuid
from typing import Callable

from qdrant_client.models import PointStruct

from config import get_settings
from qdrant.client import get_qdrant_client
from qdrant.collections import collection_name, create_collections, get_collection_stats
from embeddings.bge_m3 import EmbeddingService
from ingest.db import fetch_all, fetch_one
from ingest.transformers import (
    transform_activity,
    transform_attraction,
    transform_rental,
    transform_restaurant,
    transform_stay,
    transform_transfer,
)

logger = logging.getLogger(__name__)


# ── SQL queries to fetch all items with first image ───────────

QUERIES = {
    "activities": """
        SELECT a.*,
               (SELECT i.url FROM "Images" i WHERE i."activityId" = a.id LIMIT 1) as image_url
        FROM "Activity" a
    """,
    "stays": """
        SELECT s.*,
               (SELECT i.url FROM "Images" i WHERE i."stayId" = s.id LIMIT 1) as image_url
        FROM "Stay" s
    """,
    "restaurants": """
        SELECT r.*,
               (SELECT i.url FROM "Images" i WHERE i."restaurantId" = r.id LIMIT 1) as image_url
        FROM "Restaurant" r
    """,
    "transfers": """
        SELECT t.*,
               (SELECT i.url FROM "Images" i WHERE i."transferId" = t.id LIMIT 1) as image_url
        FROM "Transfer" t
    """,
    "rentals": """
        SELECT r.*,
               (SELECT i.url FROM "Images" i WHERE i."rentalId" = r.id LIMIT 1) as image_url
        FROM "Rental" r
    """,
    "attractions": """
        SELECT a.*,
               (SELECT i.url FROM "Images" i WHERE i."attractionId" = a.id LIMIT 1) as image_url
        FROM "Attraction" a
    """,
}

# Single-item queries
SINGLE_QUERIES = {
    "activity": ('SELECT a.*, (SELECT i.url FROM "Images" i WHERE i."activityId" = a.id LIMIT 1) as image_url FROM "Activity" a WHERE a.id = %s', "activities"),
    "stay": ('SELECT s.*, (SELECT i.url FROM "Images" i WHERE i."stayId" = s.id LIMIT 1) as image_url FROM "Stay" s WHERE s.id = %s', "stays"),
    "restaurant": ('SELECT r.*, (SELECT i.url FROM "Images" i WHERE i."restaurantId" = r.id LIMIT 1) as image_url FROM "Restaurant" r WHERE r.id = %s', "restaurants"),
    "transfer": ('SELECT t.*, (SELECT i.url FROM "Images" i WHERE i."transferId" = t.id LIMIT 1) as image_url FROM "Transfer" t WHERE t.id = %s', "transfers"),
    "rental": ('SELECT r.*, (SELECT i.url FROM "Images" i WHERE i."rentalId" = r.id LIMIT 1) as image_url FROM "Rental" r WHERE r.id = %s', "rentals"),
    "attraction": ('SELECT a.*, (SELECT i.url FROM "Images" i WHERE i."attractionId" = a.id LIMIT 1) as image_url FROM "Attraction" a WHERE a.id = %s', "attractions"),
}

TRANSFORMERS: dict[str, Callable] = {
    "activities": transform_activity,
    "stays": transform_stay,
    "restaurants": transform_restaurant,
    "transfers": transform_transfer,
    "rentals": transform_rental,
    "attractions": transform_attraction,
}


def _generate_point_id(item_id: str) -> str:
    """Convert a cuid/uuid string to a UUID for Qdrant point IDs."""
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, item_id))


# ── Full ingestion ────────────────────────────────────────────


def ingest_collection(entity_type: str, recreate: bool = False) -> int:
    """
    Ingest a single collection:
    1. Fetch all rows from PostgreSQL
    2. Transform each row → (embedding_text, payload)
    3. Generate embeddings via BGE-M3
    4. Upsert points into Qdrant
    """
    client = get_qdrant_client()
    embed = EmbeddingService.get_instance()
    settings = get_settings()

    name = collection_name(entity_type)
    query = QUERIES[entity_type]
    transformer = TRANSFORMERS[entity_type]

    logger.info("Fetching %s from PostgreSQL...", entity_type)
    rows = fetch_all(query)
    logger.info("  → %d rows fetched", len(rows))

    if not rows:
        return 0

    # Transform rows
    items = []
    for row in rows:
        try:
            emb_text, payload = transformer(row)
            items.append((row["id"], emb_text, payload))
        except Exception as e:
            logger.error("Error transforming %s row %s: %s", entity_type, row.get("id"), e)

    # Generate embeddings in batches
    logger.info("  → Generating embeddings for %d items...", len(items))
    texts = [item[1] for item in items]
    vectors = embed.embed_texts(texts)

    # Build Qdrant points
    points = []
    for (item_id, _, payload), vector in zip(items, vectors):
        points.append(
            PointStruct(
                id=_generate_point_id(item_id),
                vector=vector,
                payload=payload,
            )
        )

    # Upsert in batches of 64
    batch_size = 64
    for i in range(0, len(points), batch_size):
        batch = points[i : i + batch_size]
        client.upsert(collection_name=name, points=batch)

    logger.info("  → Upserted %d points into %s", len(points), name)
    return len(points)


def run_full_ingestion(recreate: bool = True) -> dict[str, int]:
    """
    Run full ingestion for all 6 collections.
    If recreate=True, collections are dropped and recreated.
    """
    client = get_qdrant_client()

    logger.info("=" * 60)
    logger.info("STARTING FULL INGESTION")
    logger.info("=" * 60)

    # Create/recreate collections with payload indexes
    create_collections(client, recreate=recreate)

    results = {}
    total = 0
    for entity_type in TRANSFORMERS:
        count = ingest_collection(entity_type, recreate=recreate)
        results[entity_type] = count
        total += count

    logger.info("=" * 60)
    logger.info("INGESTION COMPLETE — %d total points across %d collections", total, len(results))
    logger.info("=" * 60)

    # Print summary
    stats = get_collection_stats(client)
    for name, count in stats.items():
        logger.info("  %s: %d points", name, count)

    return results


# ── Single-item operations (for auto-trigger) ────────────────


def upsert_single_item(item_type: str, item_id: str) -> bool:
    """
    Re-ingest a single item (e.g., after a partner updates a listing).
    Called by the auto-trigger endpoint.
    """
    if item_type not in SINGLE_QUERIES:
        logger.error("Unknown item type: %s", item_type)
        return False

    query_template, coll_type = SINGLE_QUERIES[item_type]
    transformer = TRANSFORMERS[coll_type]

    row = fetch_one(query_template, (item_id,))
    if not row:
        logger.warning("Item not found: %s/%s", item_type, item_id)
        return False

    try:
        emb_text, payload = transformer(row)
    except Exception as e:
        logger.error("Transform error for %s/%s: %s", item_type, item_id, e)
        return False

    embed = EmbeddingService.get_instance()
    vector = embed.embed_query(emb_text)

    client = get_qdrant_client()
    name = collection_name(coll_type)

    point = PointStruct(
        id=_generate_point_id(item_id),
        vector=vector,
        payload=payload,
    )

    client.upsert(collection_name=name, points=[point])
    logger.info("Upserted single item: %s/%s → %s", item_type, item_id, name)
    return True


def delete_single_item(item_type: str, item_id: str) -> bool:
    """
    Delete a single item from Qdrant (e.g., after a partner deletes a listing).
    """
    if item_type not in SINGLE_QUERIES:
        logger.error("Unknown item type: %s", item_type)
        return False

    _, coll_type = SINGLE_QUERIES[item_type]
    client = get_qdrant_client()
    name = collection_name(coll_type)

    point_id = _generate_point_id(item_id)
    client.delete(collection_name=name, points_selector=[point_id])

    logger.info("Deleted single item: %s/%s from %s", item_type, item_id, name)
    return True
