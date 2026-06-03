"""Nightly Job — scheduled batch processing for the LinUCB system.

Runs at 3am daily via cron or APScheduler:
    1. run_profile_update_job()  — rebuild user tag affinities
    2. run_concept_drift_check() — partial reset every 90 days
    3. run_tag_refresh()         — re-extract stale tags

All jobs are self-contained and idempotent.
"""

from __future__ import annotations

import hashlib
import json
import logging
import math
import time
from datetime import datetime, timezone
from typing import Optional

from app.reco.context import TAG_VOCAB
from app.reco.linucb import (
    partial_reset,
    load_global_matrices,
    save_global_matrices,
)
from app.reco.tag_extractor import (
    extract_tags_from_description,
    _extract_with_fallback,
)

logger = logging.getLogger(__name__)

# Half-life for tag affinity recency decay (30 days)
_LAMBDA_DECAY = math.log(2) / 30.0


# ──────────────────────────────────────────────────────────────
# Job 1: Profile update
# ──────────────────────────────────────────────────────────────

def run_profile_update_job(conn=None) -> dict:
    """Update UserProfile tag affinities from recent events.

    For each user with events in the last 24 hours:
    1. Load all RecommendationEventsUCB with reward > 0
    2. Load listing tags for each event
    3. Compute tag affinity with recency decay:
       λ = ln(2)/30, affinity[tag] += reward × exp(-λ × days_since)
    4. Normalize to [0,1]
    5. Compute avg_booking_price, price_std_dev from reservation events
    6. Determine dominant_trip_type from last 10 reservations
    7. Upsert into UserProfile

    Args:
        conn: Optional psycopg2 connection.

    Returns:
        Dict: {"updated": N, "created": M, "errors": K}
    """
    from app.reco.db_init import _get_conn, _return_conn
    from psycopg2.extras import RealDictCursor

    c, owned = _get_conn(conn)
    updated = 0
    created = 0
    errors = 0

    try:
        now = datetime.now(timezone.utc)

        # Find users with events in last 24h
        with c.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT DISTINCT "user_id"
                FROM "RecommendationEventUCB"
                WHERE "user_id" IS NOT NULL
                  AND "created_at" >= now() - interval '24 hours'
            """)
            user_rows = cur.fetchall()

        user_ids = [r["user_id"] for r in user_rows]
        logger.info("Profile update: %d users with recent events", len(user_ids))

        for user_id in user_ids:
            try:
                _update_single_profile(c, user_id, now)
                # Check if this was an update or create
                with c.cursor() as cur:
                    cur.execute(
                        'SELECT "total_bookings" FROM "UserProfile" WHERE "user_id" = %s',
                        (user_id,),
                    )
                    row = cur.fetchone()
                    if row:
                        updated += 1
                    else:
                        created += 1

            except Exception as e:
                logger.error("Profile update failed for user %s: %s", user_id, e)
                c.rollback()
                errors += 1

        summary = {"updated": updated, "created": created, "errors": errors}
        logger.info("Profile update complete: %s", summary)
        return summary

    except Exception as e:
        logger.error("run_profile_update_job error: %s", e, exc_info=True)
        return {"updated": updated, "created": created, "errors": errors}
    finally:
        if owned:
            _return_conn(c)


def _update_single_profile(conn, user_id: str, now: datetime) -> None:
    """Update a single user's profile based on their event history.

    Args:
        conn: psycopg2 connection.
        user_id: User ID.
        now: Current UTC datetime.
    """
    from psycopg2.extras import RealDictCursor

    # Load all events with reward > 0
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT re."listing_id", re."listing_type", re."reward",
                   re."event_type", re."price", re."created_at"
            FROM "RecommendationEventUCB" re
            WHERE re."user_id" = %s AND re."reward" > 0
            ORDER BY re."created_at" DESC
        """, (user_id,))
        events = cur.fetchall()

    if not events:
        return

    # Compute tag affinity with recency decay
    tag_affinity: dict[str, float] = {}
    reservation_prices: list[float] = []
    trip_type_counts: dict[str, int] = {"family": 0, "couple": 0, "solo": 0}

    for event in events:
        # Days since event
        event_time = event["created_at"]
        if event_time.tzinfo is None:
            event_time = event_time.replace(tzinfo=timezone.utc)
        days_since = max(0, (now - event_time).total_seconds() / 86400.0)

        reward = float(event["reward"])
        decay = math.exp(-_LAMBDA_DECAY * days_since)

        # Load listing tags
        listing_id = event["listing_id"]
        listing_type = event["listing_type"]

        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                'SELECT "tags" FROM "ListingTag" '
                'WHERE "listing_id" = %s AND "listing_type" = %s',
                (listing_id, listing_type),
            )
            tag_row = cur.fetchone()

        if tag_row:
            tags = tag_row["tags"]
            if isinstance(tags, str):
                tags = json.loads(tags)

            for tag in tags:
                if tag in tag_affinity:
                    tag_affinity[tag] += reward * decay
                else:
                    tag_affinity[tag] = reward * decay

        # Track reservation data
        if event["event_type"] == "reservation" and event.get("price"):
            reservation_prices.append(float(event["price"]))

            # Infer trip type from listing tags
            if tag_row:
                listing_tags = set(tags if isinstance(tags, list) else [])
                if "family" in listing_tags:
                    trip_type_counts["family"] += 1
                elif "romantic" in listing_tags:
                    trip_type_counts["couple"] += 1
                elif "solo" in listing_tags:
                    trip_type_counts["solo"] += 1

    # Normalize affinity to [0, 1]
    # if tag_affinity:
    #     max_val = max(tag_affinity.values())
    #     if max_val > 0:
    #         tag_affinity = {k: v / max_val for k, v in tag_affinity.items()}

    # Compute booking stats
    avg_price = 0.0
    price_std = 0.0
    if reservation_prices:
        avg_price = sum(reservation_prices) / len(reservation_prices)
        if len(reservation_prices) > 1:
            variance = sum((p - avg_price) ** 2 for p in reservation_prices) / (len(reservation_prices) - 1)
            price_std = math.sqrt(variance)

    # Dominant trip type (from last 10 reservations)
    total_trips = sum(trip_type_counts.values())
    if total_trips > 0:
        dominant = max(trip_type_counts, key=trip_type_counts.get)
        if trip_type_counts[dominant] == 0:
            dominant = "unknown"
    else:
        dominant = "unknown"

    total_bookings = len(reservation_prices)

    # Upsert UserProfile
    sql = """
        INSERT INTO "UserProfile" (
            "user_id", "tag_affinity", "avg_booking_price",
            "price_std_dev", "dominant_trip_type", "total_bookings",
            "updated_at"
        ) VALUES (%s, %s::jsonb, %s, %s, %s, %s, now())
        ON CONFLICT ("user_id") DO UPDATE SET
            "tag_affinity" = EXCLUDED."tag_affinity",
            "avg_booking_price" = EXCLUDED."avg_booking_price",
            "price_std_dev" = EXCLUDED."price_std_dev",
            "dominant_trip_type" = EXCLUDED."dominant_trip_type",
            "total_bookings" = EXCLUDED."total_bookings",
            "updated_at" = now()
    """
    with conn.cursor() as cur:
        cur.execute(sql, (
            user_id,
            json.dumps(tag_affinity),
            avg_price,
            price_std,
            dominant,
            total_bookings,
        ))
    conn.commit()

    logger.debug(
        "Updated profile for user %s: %d tags, avg_price=%.0f, type=%s",
        user_id, len(tag_affinity), avg_price, dominant,
    )


# ──────────────────────────────────────────────────────────────
# Job 2: Concept drift check
# ──────────────────────────────────────────────────────────────

def run_concept_drift_check(conn=None) -> bool:
    """Check and apply partial reset if 90+ days since last reset.

    Uses SystemConfig key 'last_drift_reset' to track timing.
    Applies partial_reset(A, b, λ=0.7) to LinUCBGlobal.

    Args:
        conn: Optional psycopg2 connection.

    Returns:
        True if reset was applied, False otherwise.
    """
    from app.reco.db_init import _get_conn, _return_conn, get_system_config
    from psycopg2.extras import RealDictCursor

    c, owned = _get_conn(conn)
    try:
        # Check n_updates
        with c.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                'SELECT "n_updates" FROM "LinUCBGlobal" WHERE "id" = %s',
                ("global",),
            )
            row = cur.fetchone()

        if not row or row["n_updates"] == 0:
            logger.info("Concept drift check: n_updates=0, skipping")
            return False

        # Check last reset date
        last_reset_str = get_system_config("last_drift_reset", default="", conn=c)
        now = datetime.now(timezone.utc)

        if last_reset_str:
            try:
                last_reset = datetime.fromisoformat(last_reset_str)
                if last_reset.tzinfo is None:
                    last_reset = last_reset.replace(tzinfo=timezone.utc)
                days_since = (now - last_reset).days
            except ValueError:
                days_since = 999  # Force reset if date is invalid
        else:
            days_since = 999  # First time — apply reset

        if days_since < 90:
            logger.info(
                "Concept drift check: %d days since last reset (< 90), skipping",
                days_since,
            )
            return False

        # Apply partial reset
        logger.info("Applying partial reset — %d days since last reset", days_since)
        A, b_vec = load_global_matrices(conn=c)
        A_new, b_new = partial_reset(A, b_vec, lambda_decay=0.7)
        save_global_matrices(A_new, b_new, conn=c)

        # Record reset timestamp
        from app.reco.db_init import seed_system_config
        upsert_sql = """
            INSERT INTO "SystemConfig" ("key", "value", "updated_at")
            VALUES ('last_drift_reset', %s, now())
            ON CONFLICT ("key")
            DO UPDATE SET "value" = EXCLUDED."value", "updated_at" = now()
        """
        with c.cursor() as cur:
            cur.execute(upsert_sql, (now.isoformat(),))
        c.commit()

        logger.info("Partial reset applied, λ=0.7")
        return True

    except Exception as e:
        logger.error("run_concept_drift_check error: %s", e, exc_info=True)
        return False
    finally:
        if owned:
            _return_conn(c)


# ──────────────────────────────────────────────────────────────
# Job 3: Tag refresh
# ──────────────────────────────────────────────────────────────

def run_tag_refresh(conn=None) -> dict:
    """Re-extract tags for stale listings.

    Finds listings where:
    - ListingTag.updatedAt < 30 days ago
    - AND description has changed (hash mismatch)

    Args:
        conn: Optional psycopg2 connection.

    Returns:
        Dict: {"refreshed": N, "unchanged": M, "errors": K}
    """
    from app.reco.db_init import _get_conn, _return_conn
    from psycopg2.extras import RealDictCursor
    from app.reco.tag_extractor import _upsert_listing_tag, _update_bandit_arm_tags

    c, owned = _get_conn(conn)
    refreshed = 0
    unchanged = 0
    errors_count = 0

    try:
        # Find stale ListingTags (>30 days old)
        with c.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT lt."listing_id", lt."listing_type",
                       lt."raw_description", lt."updated_at"
                FROM "ListingTag" lt
                WHERE lt."updated_at" < now() - interval '30 days'
            """)
            stale = cur.fetchall()

        logger.info("Tag refresh: found %d stale listings", len(stale))

        # Entity table name mapping
        table_map = {
            "ACTIVITY": "Activity",
            "STAY": "Stay",
            "RESTAURANT": "Restaurant",
            "RENTAL": "Rental",
            "TRANSFER": "Transfer",
        }

        for row in stale:
            listing_id = row["listing_id"]
            listing_type = row["listing_type"]
            old_description = row.get("raw_description") or ""

            # Fetch current description
            table_name = table_map.get(listing_type)
            if not table_name:
                continue

            try:
                with c.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(
                        f'SELECT "description" FROM "{table_name}" WHERE "id" = %s',
                        (listing_id,),
                    )
                    current_row = cur.fetchone()

                if not current_row:
                    continue

                current_desc = current_row.get("description") or ""

                # Compare hashes
                old_hash = hashlib.md5(old_description.encode()).hexdigest()
                new_hash = hashlib.md5(current_desc.encode()).hexdigest()

                if old_hash == new_hash:
                    unchanged += 1
                    # Touch updated_at to avoid re-checking
                    with c.cursor() as cur:
                        cur.execute(
                            'UPDATE "ListingTag" SET "updated_at" = now() '
                            'WHERE "listing_id" = %s AND "listing_type" = %s',
                            (listing_id, listing_type),
                        )
                    c.commit()
                    continue

                # Description changed — re-extract
                result = _extract_with_fallback(current_desc, listing_type)
                _upsert_listing_tag(
                    c, listing_id, listing_type,
                    result["tags"], current_desc, result["confidence"],
                )
                _update_bandit_arm_tags(c, listing_id, listing_type, result["tags"])
                refreshed += 1

                logger.debug(
                    "Refreshed tags for %s/%s: %s",
                    listing_type, listing_id, result["tags"][:5],
                )

            except Exception as e:
                logger.error(
                    "Tag refresh failed for %s/%s: %s",
                    listing_type, listing_id, e,
                )
                c.rollback()
                errors_count += 1

        summary = {
            "refreshed": refreshed,
            "unchanged": unchanged,
            "errors": errors_count,
        }
        logger.info("Tag refresh complete: %s", summary)
        return summary

    except Exception as e:
        logger.error("run_tag_refresh error: %s", e, exc_info=True)
        return {"refreshed": refreshed, "unchanged": unchanged, "errors": errors_count}
    finally:
        if owned:
            _return_conn(c)


# ──────────────────────────────────────────────────────────────
# Main: standalone execution
# ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    from dotenv import load_dotenv

    load_dotenv()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(name)s] %(levelname)s — %(message)s",
    )

    print("\n" + "=" * 60)
    print(" LinUCB Nightly Jobs — Manual Run")
    print("=" * 60 + "\n")

    results = {}

    # Job 1: Profile update
    print("┌────────────────────────────────────────┐")
    print("│ Job 1: Profile Update                  │")
    print("└────────────────────────────────────────┘")
    t0 = time.time()
    try:
        results["profile_update"] = run_profile_update_job()
    except Exception as e:
        results["profile_update"] = {"error": str(e)}
    dt1 = time.time() - t0

    # Job 2: Concept drift check
    print("\n┌────────────────────────────────────────┐")
    print("│ Job 2: Concept Drift Check             │")
    print("└────────────────────────────────────────┘")
    t0 = time.time()
    try:
        drift_applied = run_concept_drift_check()
        results["concept_drift"] = {"applied": drift_applied}
    except Exception as e:
        results["concept_drift"] = {"error": str(e)}
    dt2 = time.time() - t0

    # Job 3: Tag refresh
    print("\n┌────────────────────────────────────────┐")
    print("│ Job 3: Tag Refresh                     │")
    print("└────────────────────────────────────────┘")
    t0 = time.time()
    try:
        results["tag_refresh"] = run_tag_refresh()
    except Exception as e:
        results["tag_refresh"] = {"error": str(e)}
    dt3 = time.time() - t0

    # Summary table
    print("\n" + "=" * 60)
    print(" Summary")
    print("=" * 60)
    print(f"\n┌─────────────────────┬────────────┬──────────────────────────┐")
    print(f"│ Job                 │ Duration   │ Result                   │")
    print(f"├─────────────────────┼────────────┼──────────────────────────┤")
    print(f"│ Profile Update      │ {dt1:>8.2f}s  │ {str(results.get('profile_update', {}))[:24]:<24} │")
    print(f"│ Concept Drift       │ {dt2:>8.2f}s  │ {str(results.get('concept_drift', {}))[:24]:<24} │")
    print(f"│ Tag Refresh         │ {dt3:>8.2f}s  │ {str(results.get('tag_refresh', {}))[:24]:<24} │")
    print(f"└─────────────────────┴────────────┴──────────────────────────┘")
    print(f"\n✅ All nightly jobs completed.\n")
