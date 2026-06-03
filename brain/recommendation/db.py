"""
Database operations for the recommendation system.
CRUD for BanditArm + RecommendationEvent tables via psycopg2.
"""

import logging
from datetime import datetime

from ingest.db import get_connection
from recommendation.thompson import ArmState, compute_reward, get_counter_field

import psycopg2.extras

logger = logging.getLogger(__name__)


# ── Read arms ─────────────────────────────────────────────────


def get_arms_for_segment(
    listing_type: str,
    segment: str,
) -> list[ArmState]:
    """
    Fetch all BanditArm rows for a given listing type + segment.
    Returns ArmState objects for Thompson Sampling.
    """
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT "listingId", "listingType", segment, alpha, beta,
                       impressions, clicks, wishlists, conversions, "totalRevenue"
                FROM "BanditArm"
                WHERE "listingType" = %s AND segment = %s
                """,
                (listing_type, segment),
            )
            rows = cur.fetchall()

        return [
            ArmState(
                listing_id=row["listingId"],
                listing_type=row["listingType"],
                segment=row["segment"],
                alpha=row["alpha"],
                beta=row["beta"],
                impressions=row["impressions"],
                clicks=row["clicks"],
                wishlists=row["wishlists"],
                conversions=row["conversions"],
                total_revenue=row["totalRevenue"],
            )
            for row in rows
        ]
    finally:
        conn.close()


def get_arms_for_segment_multi(
    listing_types: list[str],
    segment: str,
) -> list[ArmState]:
    """
    Fetch arms for multiple listing types in one query (for homepage).
    """
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT "listingId", "listingType", segment, alpha, beta,
                       impressions, clicks, wishlists, conversions, "totalRevenue"
                FROM "BanditArm"
                WHERE "listingType" = ANY(%s) AND segment = %s
                """,
                (listing_types, segment),
            )
            rows = cur.fetchall()

        return [
            ArmState(
                listing_id=row["listingId"],
                listing_type=row["listingType"],
                segment=row["segment"],
                alpha=row["alpha"],
                beta=row["beta"],
                impressions=row["impressions"],
                clicks=row["clicks"],
                wishlists=row["wishlists"],
                conversions=row["conversions"],
                total_revenue=row["totalRevenue"],
            )
            for row in rows
        ]
    finally:
        conn.close()


# ── Update arms ───────────────────────────────────────────────


def update_arm(
    listing_id: str,
    listing_type: str,
    segment: str,
    event_type: str,
    price: float = 0.0,
) -> None:
    """
    Update (or create) a BanditArm row based on an event.
    Uses UPSERT to handle the first impression of a new arm.
    """
    alpha_delta, beta_delta = compute_reward(event_type, price)
    counter_field = get_counter_field(event_type)

    # Build the SET clause dynamically
    set_parts = ['alpha = "BanditArm".alpha + %s', 'beta = "BanditArm".beta + %s']
    set_params = [alpha_delta, beta_delta]

    if counter_field:
        set_parts.append(f'"{_to_camel(counter_field)}" = "BanditArm"."{_to_camel(counter_field)}" + 1')

    if event_type == "reservation" and price > 0:
        set_parts.append('"totalRevenue" = "BanditArm"."totalRevenue" + %s')
        set_params.append(price)

    set_parts.append('"updatedAt" = NOW()')
    set_clause = ", ".join(set_parts)

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"""
                INSERT INTO "BanditArm" (id, "listingId", "listingType", segment, alpha, beta, "updatedAt")
                VALUES (gen_random_uuid()::text, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT ("listingId", "listingType", segment)
                DO UPDATE SET {set_clause}
                """,
                (
                    listing_id, listing_type, segment,
                    1.0 + alpha_delta,    # initial alpha + this event's delta
                    1.0 + beta_delta,     # initial beta + this event's delta
                    *set_params,
                ),
            )
        conn.commit()
        logger.info(
            "  ✅ ARM updated: %s/%s [seg=%s] [%s] — α+%.2f β+%.2f",
            listing_type, listing_id[:16], segment[:20], event_type, alpha_delta, beta_delta,
        )
    except Exception as e:
        conn.rollback()
        logger.error(
            "  ❌ ARM update FAILED: %s/%s [%s] — %s",
            listing_type, listing_id[:16], event_type, e,
        )
    finally:
        conn.close()


def _to_camel(snake: str) -> str:
    """Convert snake_case to camelCase for Prisma column names."""
    parts = snake.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


# ── Log events ────────────────────────────────────────────────


def log_event(
    event_type: str,
    listing_id: str,
    listing_type: str,
    segment: str,
    session_id: str,
    user_id: str | None = None,
    price: float | None = None,
    metadata: dict | None = None,
) -> None:
    """Insert a row into RecommendationEvent for analytics."""
    alpha_delta, _ = compute_reward(event_type, price or 0.0)

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO "RecommendationEvent"
                    (id, "eventType", "listingId", "listingType", "userId",
                     "sessionId", segment, reward, price, metadata, "createdAt")
                VALUES (gen_random_uuid()::text, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                """,
                (
                    event_type, listing_id, listing_type, user_id,
                    session_id, segment, alpha_delta, price,
                    psycopg2.extras.Json(metadata) if metadata else None,
                ),
            )
        conn.commit()
        logger.info(
            "  ✅ EVENT logged: %s  %s/%s  reward=%.2f",
            event_type, listing_type, listing_id[:16], alpha_delta,
        )
    except Exception as e:
        conn.rollback()
        logger.error(
            "  ❌ EVENT log FAILED: %s  %s/%s — %s",
            event_type, listing_type, listing_id[:16], e,
        )
    finally:
        conn.close()


# ── Count user events (for blending weight) ──────────────────


def count_user_events(user_id: str) -> int:
    """
    Count total RecommendationEvent rows for a user.
    Used to determine blending weight (cold-start handling).
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                'SELECT COUNT(*) FROM "RecommendationEvent" WHERE "userId" = %s',
                (user_id,),
            )
            return cur.fetchone()[0]
    finally:
        conn.close()


# ── Batch event processing ────────────────────────────────────


def process_event_batch(
    events: list[dict],
    session_id: str,
    global_segment: str,
    user_segment: str | None = None,
    user_id: str | None = None,
) -> int:
    """
    Process a batch of events from the frontend tracker.
    Logs events + updates arms in a single pass.

    Updates arms in BOTH:
      - Global segment (always)
      - User segment (if user_id is provided)
    """
    logger.info(
        "📥 Received batch: %d events, session=%s, global_seg=%s, user_seg=%s",
        len(events), session_id[:20], global_segment, user_segment or "(none)",
    )

    count = 0
    for i, evt in enumerate(events):
        event_type = evt.get("event", "")
        listing_id = evt.get("listing_id", "")
        listing_type = evt.get("listing_type", "")
        price = evt.get("meta", {}).get("price", 0.0) if evt.get("meta") else 0.0
        meta = evt.get("meta")

        logger.info(
            "  [%d/%d] event=%s  listing=%s  type=%s  price=%.2f",
            i + 1, len(events), event_type or "(empty)", listing_id[:16] or "(empty)", listing_type or "(empty)", price,
        )

        if not event_type or not listing_id or not listing_type:
            logger.warning("  ⚠️  SKIPPED: missing event/listing data")
            continue

        # Log the event (once, with global segment)
        log_event(event_type, listing_id, listing_type, global_segment, session_id, user_id, price, meta)

        # Update global arm
        update_arm(listing_id, listing_type, global_segment, event_type, price)

        # Update user-specific arm (if logged in)
        if user_segment:
            update_arm(listing_id, listing_type, user_segment, event_type, price)

        count += 1

    logger.info("📊 Processed %d/%d events (global=%s, user=%s)", count, len(events), global_segment, user_segment or "none")
    return count


# ── Initialize arms for existing listings ─────────────────────


def initialize_arms_for_segment(segment: str) -> int:
    """
    Create BanditArm rows for all listings that don't have one yet in this segment.
    Used during first deployment or when a new segment is needed.
    Returns the number of arms created.
    """
    listing_queries = {
        "ACTIVITY":   'SELECT id FROM "Activity"',
        "STAY":       'SELECT id FROM "Stay"',
        "RESTAURANT": 'SELECT id FROM "Restaurant"',
        "RENTAL":     'SELECT id FROM "Rental"',
        "TRANSFER":   'SELECT id FROM "Transfer"',
        "SHOP":       'SELECT id FROM "Shop"',
        "PRODUCT":    'SELECT id FROM "Product"',
    }

    conn = get_connection()
    total = 0
    try:
        with conn.cursor() as cur:
            for listing_type, query in listing_queries.items():
                try:
                    cur.execute(query)
                    rows = cur.fetchall()
                    for (lid,) in rows:
                        cur.execute(
                            """
                            INSERT INTO "BanditArm" (id, "listingId", "listingType", segment, alpha, beta, "updatedAt")
                            VALUES (gen_random_uuid()::text, %s, %s, %s, 1.0, 1.0, NOW())
                            ON CONFLICT ("listingId", "listingType", segment) DO NOTHING
                            """,
                            (lid, listing_type, segment),
                        )
                    total += len(rows)
                except Exception as e:
                    logger.warning("  ⚠️  Could not init arms for %s: %s", listing_type, e)
                    conn.rollback()
        conn.commit()
        logger.info("Initialized %d arms for segment: %s", total, segment)
    finally:
        conn.close()

    return total
