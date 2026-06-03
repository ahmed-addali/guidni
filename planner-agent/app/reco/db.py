"""Recommendation DB — runtime database operations for LinUCB.

Handles:
    - Module-level matrix cache (A, b in RAM — never DB on hot path)
    - Arm loading with price JOINs across entity tables
    - Event logging and arm counter upserts
    - Batch event processing with in-memory matrix updates
    - Session management and merge for login transitions
    - Per-session rate limiting

Uses psycopg2 ThreadedConnectionPool from db_init.py.
"""

from __future__ import annotations

import json
import logging
import threading
import time
from typing import Optional

import numpy as np
import psycopg2
from psycopg2.extras import RealDictCursor

from app.reco.context import D_PHI, build_phi
from app.reco.linucb import (
    ArmState,
    compute_reward,
    load_global_matrices,
    save_global_matrices,
    update,
)
from app.reco.tag_extractor import get_tags_for_listing

from app.reco.logger import reco_logger as logger

# ──────────────────────────────────────────────────────────────
# Module-level matrix cache
# ──────────────────────────────────────────────────────────────

_GLOBAL_A = None  # type: np.ndarray | None
_GLOBAL_B = None  # type: np.ndarray | None
_matrix_lock = threading.Lock()


def init_matrix_cache() -> None:
    """Load global A and b matrices from DB into RAM.

    Called once at FastAPI startup. All subsequent scoring/update
    operations use the in-RAM copy — never the DB.
    """
    global _GLOBAL_A, _GLOBAL_B
    with _matrix_lock:
        _GLOBAL_A, _GLOBAL_B = load_global_matrices()
    logger.info("Matrix cache initialized: d=%d", _GLOBAL_A.shape[0])


def get_cached_matrices() -> tuple[np.ndarray, np.ndarray]:
    """Return copies of the in-RAM A and b matrices.

    Never reads from DB. Returns copies to prevent mutation.

    Returns:
        Tuple of (A_copy, b_copy).
    """
    with _matrix_lock:
        if _GLOBAL_A is None or _GLOBAL_B is None:
            logger.warning("Matrix cache not initialized — returning fresh")
            return np.eye(D_PHI), np.zeros(D_PHI)
        return _GLOBAL_A.copy(), _GLOBAL_B.copy()


def persist_matrices_to_db() -> None:
    """Persist the in-RAM matrices to DB.

    Called by the background scheduler every 2 minutes.
    Takes a snapshot under lock, then writes outside the lock.
    """
    with _matrix_lock:
        if _GLOBAL_A is None or _GLOBAL_B is None:
            logger.warning("No matrices to persist — cache not initialized")
            return
        A_snap = _GLOBAL_A.copy()
        b_snap = _GLOBAL_B.copy()

    try:
        save_global_matrices(A_snap, b_snap)
        logger.info("Matrices persisted to DB")
    except Exception as e:
        logger.error("persist_matrices_to_db failed: %s", e)


# ──────────────────────────────────────────────────────────────
# DB connection helpers (delegate to db_init pool)
# ──────────────────────────────────────────────────────────────

def get_connection():
    """Get a connection from the pool.

    Returns:
        psycopg2 connection object.
    """
    from app.reco.db_init import _get_pool
    return _get_pool().getconn()


def release_connection(conn) -> None:
    """Return a connection to the pool.

    Args:
        conn: psycopg2 connection to return.
    """
    from app.reco.db_init import _get_pool
    try:
        _get_pool().putconn(conn)
    except Exception as e:
        logger.warning("Failed to return connection: %s", e)


def _with_conn(conn=None):
    """Helper: use provided conn or get from pool.

    Returns:
        Tuple of (conn, owned) where owned=True means caller must release.
    """
    if conn is not None:
        return conn, False
    return get_connection(), True


# ──────────────────────────────────────────────────────────────
# Arm operations
# ──────────────────────────────────────────────────────────────

def get_arms_for_zone(
    location_zone: str,
    listing_types: list[str],
    conn=None,
) -> list[ArmState]:
    """Fetch all arms for a zone with prices from entity tables.

    JOINs with ListingTag for tags and with entity tables
    (Stay, Activity, Restaurant, Rental, Transfer) for prices.

    Args:
        location_zone: City or region name.
        listing_types: List of types to include.
        conn: Optional psycopg2 connection.

    Returns:
        List of ArmState with tags and prices populated.
    """
    c, owned = _with_conn(conn)
    try:
        sql = """
            SELECT
                ba."id",
                ba."listing_id",
                ba."listing_type",
                ba."location_zone",
                ba."impressions",
                ba."clicks",
                ba."wishlists",
                ba."conversions",
                ba."total_revenue",
                ba."commission_rate",
                ba."n_updates",
                COALESCE(lt."tags", ba."tags", '[]'::jsonb) AS tags,
                COALESCE(lt."confidence", 1.0) AS tag_confidence,
                COALESCE(
                    s."price",
                    ac."price",
                    re."pricePerDay",
                    t."pricePerTrip",
                    0
                )::float AS price
            FROM "BanditArmUCB" ba
            LEFT JOIN "ListingTag" lt
                ON ba."listing_id" = lt."listing_id"
                AND ba."listing_type" = lt."listing_type"
            LEFT JOIN "Stay" s
                ON ba."listing_id" = s."id" AND ba."listing_type" = 'STAY'
            LEFT JOIN "Activity" ac
                ON ba."listing_id" = ac."id" AND ba."listing_type" = 'ACTIVITY'
            LEFT JOIN "Rental" re
                ON ba."listing_id" = re."id" AND ba."listing_type" = 'RENTAL'
            LEFT JOIN "Transfer" t
                ON ba."listing_id" = t."id" AND ba."listing_type" = 'TRANSFER'
            WHERE ba."location_zone" = %s
              AND ba."listing_type" = ANY(%s)
        """
        with c.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, (location_zone, listing_types))
            rows = cur.fetchall()

        arms: list[ArmState] = []
        for row in rows:
            tags = row["tags"]
            if isinstance(tags, str):
                tags = json.loads(tags)

            arms.append(ArmState(
                listing_id=row["listing_id"],
                listing_type=row["listing_type"],
                location_zone=row["location_zone"],
                tags=tags if isinstance(tags, list) else [],
                impressions=int(row["impressions"]),
                clicks=int(row["clicks"]),
                wishlists=int(row["wishlists"]),
                conversions=int(row["conversions"]),
                total_revenue=float(row["total_revenue"]),
                price=float(row["price"] or 0),
                commission_rate=float(row["commission_rate"]),
                is_underexposed=(int(row["impressions"]) < 50),
            ))

        logger.debug(
            "get_arms_for_zone: zone=%s, types=%s → %d arms loaded from DB",
            location_zone, listing_types, len(arms),
        )
        return arms

    except Exception as e:
        logger.error("get_arms_for_zone error: %s", e)
        return []
    finally:
        if owned:
            release_connection(c)


# ──────────────────────────────────────────────────────────────
# User operations
# ──────────────────────────────────────────────────────────────

def get_user_profile(user_id: str, conn=None) -> dict | None:
    """Fetch a user's recommendation profile.

    Args:
        user_id: The user's ID.
        conn: Optional psycopg2 connection.

    Returns:
        Dict with profile fields, or None for anonymous/new users.
    """
    c, owned = _with_conn(conn)
    try:
        with c.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                'SELECT * FROM "UserProfile" WHERE "user_id" = %s',
                (user_id,),
            )
            row = cur.fetchone()

        if row is None:
            return None

        result = dict(row)
        # Parse JSONB fields
        if isinstance(result.get("tag_affinity"), str):
            result["tag_affinity"] = json.loads(result["tag_affinity"])

        return result

    except Exception as e:
        logger.error("get_user_profile error for %s: %s", user_id, e)
        return None
    finally:
        if owned:
            release_connection(c)


# ──────────────────────────────────────────────────────────────
# Event logging
# ──────────────────────────────────────────────────────────────

def log_event(
    event_type: str,
    listing_id: str,
    listing_type: str,
    location_zone: str,
    session_id: str,
    user_id: str | None,
    reward: float,
    rank_shown: int | None = None,
    price: float | None = None,
    metadata: dict | None = None,
    conn=None,
) -> None:
    """Insert a RecommendationEventUCB row.

    Never raises — all exceptions are caught and logged.

    Args:
        event_type: Event type string.
        listing_id: Listing ID.
        listing_type: Listing type.
        location_zone: Zone name.
        session_id: Session ID.
        user_id: User ID or None.
        reward: Computed reward value.
        rank_shown: 1-based position shown (for IPS correction).
        price: Event price if applicable.
        metadata: Additional event metadata.
        conn: Optional psycopg2 connection.
    """
    c, owned = _with_conn(conn)
    try:
        sql = """
            INSERT INTO "RecommendationEventUCB" (
                "id", "event_type", "listing_id", "listing_type",
                "user_id", "session_id", "location_zone",
                "reward", "rank_shown", "price", "metadata", "created_at"
            ) VALUES (
                gen_random_uuid()::text, %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s, %s::jsonb, now()
            )
        """
        with c.cursor() as cur:
            cur.execute(sql, (
                event_type, listing_id, listing_type,
                user_id, session_id, location_zone,
                reward, rank_shown, price,
                json.dumps(metadata) if metadata else None,
            ))
        c.commit()
    except Exception as e:
        try:
            c.rollback()
        except Exception:
            pass
        logger.error("log_event error: %s", e)
    finally:
        if owned:
            release_connection(c)


def update_arm_counters(
    listing_id: str,
    listing_type: str,
    location_zone: str,
    event_type: str,
    price: float = 0.0,
    conn=None,
) -> None:
    """Upsert BanditArmUCB counters based on event type.

    Increments the appropriate counter and updates is_underexposed.

    Args:
        listing_id: Listing ID.
        listing_type: Listing type.
        location_zone: Zone name.
        event_type: Event type for counter selection.
        price: Price for revenue tracking (reservation events).
        conn: Optional psycopg2 connection.
    """
    c, owned = _with_conn(conn)
    try:
        # Build dynamic SET clause
        counter_updates = ['"n_updates" = "BanditArmUCB"."n_updates" + 1']
        if event_type == "impression":
            counter_updates.append('"impressions" = "BanditArmUCB"."impressions" + 1')
        elif event_type in ("click", "dwell_exit"):
            counter_updates.append('"clicks" = "BanditArmUCB"."clicks" + 1')
        elif event_type == "wishlist":
            counter_updates.append('"wishlists" = "BanditArmUCB"."wishlists" + 1')
        elif event_type == "reservation":
            counter_updates.append('"conversions" = "BanditArmUCB"."conversions" + 1')
            counter_updates.append(
                f'"total_revenue" = "BanditArmUCB"."total_revenue" + {float(price)}'
            )

        counter_updates.append(
            '"is_underexposed" = ("BanditArmUCB"."impressions" < 50)'
        )
        counter_updates.append('"updated_at" = now()')

        set_clause = ", ".join(counter_updates)

        sql = f"""
            INSERT INTO "BanditArmUCB" (
                "id", "listing_id", "listing_type", "location_zone",
                "tags", "impressions", "clicks", "wishlists",
                "conversions", "total_revenue", "n_updates",
                "is_underexposed", "updated_at"
            ) VALUES (
                gen_random_uuid()::text, %s, %s, %s,
                '[]'::jsonb, 0, 0, 0, 0, 0.0, 0, true, now()
            )
            ON CONFLICT ("listing_id", "listing_type", "location_zone")
            DO UPDATE SET {set_clause}
        """
        with c.cursor() as cur:
            cur.execute(sql, (listing_id, listing_type, location_zone))
        c.commit()

    except Exception as e:
        try:
            c.rollback()
        except Exception:
            pass
        logger.error("update_arm_counters error: %s", e)
    finally:
        if owned:
            release_connection(c)


# ──────────────────────────────────────────────────────────────
# Batch event processing
# ──────────────────────────────────────────────────────────────

def process_event_batch(
    events: list[dict],
    session_id: str,
    location_zone: str,
    x_user: np.ndarray,
    user_id: str | None = None,
    session_rewards: dict[str, float] | None = None,
) -> tuple[int, dict[str, float]]:
    """Process a batch of events: update matrices in RAM, log to DB.

    CRITICAL: Matrix updates happen ONLY in RAM (_GLOBAL_A, _GLOBAL_B).
    DB writes are for event logging and arm counters only.

    Args:
        events: List of event dicts from the client.
        session_id: Current session ID.
        location_zone: Zone for all events.
        x_user: Pre-built user feature vector (9,).
        user_id: User ID or None for anonymous.
        session_rewards: Mutable session reward tracker (synced with client).

    Returns:
        Tuple of (count_processed, session_rewards).
    """
    global _GLOBAL_A, _GLOBAL_B

    if session_rewards is None:
        session_rewards = {}

    count = 0

    for evt in events:
        listing_id = evt.get("listing_id", "")
        listing_type = evt.get("listing_type", "")
        event_type = evt.get("event", "")
        meta = evt.get("meta", {})
        dwell_secs = int(meta.get("dwell_seconds", 0))
        rank_shown = meta.get("rank")
        price = float(meta.get("price", 0.0))

        if not listing_id or not event_type:
            continue

        # Rate limit check
        if not _check_rate_limit(session_id, listing_id):
            continue

        # Get tags for phi construction
        tags = get_tags_for_listing(listing_id, listing_type or "ACTIVITY")

        # Compute reward with session-level dedup
        reward = compute_reward(
            event_type, dwell_secs, session_rewards, listing_id
        )

        # Update matrices in RAM only (never DB)
        if reward != 0.0:
            phi = build_phi(x_user, tags)
            with _matrix_lock:
                if _GLOBAL_A is not None and _GLOBAL_B is not None:
                    _GLOBAL_A, _GLOBAL_B = update(
                        phi, reward, _GLOBAL_A, _GLOBAL_B
                    )
                    logger.debug("Matrix update [RAM]: listing=%s, reward=%.2f", listing_id, reward)

        # Log event to DB (fire-and-forget, never raises)
        log_event(
            event_type, listing_id, listing_type or "ACTIVITY",
            location_zone, session_id, user_id, reward,
            rank_shown=rank_shown, price=price if price > 0 else None,
            metadata=meta if meta else None,
        )

        # Update arm counters in DB
        update_arm_counters(
            listing_id, listing_type or "ACTIVITY",
            location_zone, event_type, price,
        )

        count += 1

    return count, session_rewards


# ──────────────────────────────────────────────────────────────
# Session operations
# ──────────────────────────────────────────────────────────────

def merge_anonymous_session(
    session_id: str,
    user_id: str,
    conn=None,
) -> int:
    """Merge anonymous session events with a user account after login.

    Args:
        session_id: The anonymous session ID.
        user_id: The authenticated user ID.
        conn: Optional psycopg2 connection.

    Returns:
        Number of events merged.
    """
    c, owned = _with_conn(conn)
    try:
        sql = """
            UPDATE "RecommendationEventUCB"
            SET "user_id" = %s
            WHERE "session_id" = %s AND "user_id" IS NULL
        """
        with c.cursor() as cur:
            cur.execute(sql, (user_id, session_id))
            rowcount = cur.rowcount
        c.commit()
        logger.info(
            "Merged %d anonymous events: session=%s → user=%s",
            rowcount, session_id, user_id,
        )
        return rowcount
    except Exception as e:
        try:
            c.rollback()
        except Exception:
            pass
        logger.error("merge_anonymous_session error: %s", e)
        return 0
    finally:
        if owned:
            release_connection(c)


def upsert_user_session(
    session_id: str,
    session_state: dict,
    user_id: str | None = None,
    conn=None,
) -> None:
    """Upsert session state into UserSession table.

    Args:
        session_id: Session ID.
        session_state: Dict with session fields.
        user_id: User ID or None.
        conn: Optional psycopg2 connection.
    """
    c, owned = _with_conn(conn)
    try:
        price_range = session_state.get("price_range_viewed", {"min": 0, "max": 0})
        if isinstance(price_range, str):
            price_range = json.loads(price_range)

        click_seq = session_state.get("click_sequence", [])
        if isinstance(click_seq, str):
            click_seq = json.loads(click_seq)

        sql = """
            INSERT INTO "UserSession" (
                "id", "session_id", "user_id",
                "location_lat", "location_lon", "device_type",
                "entry_hour", "entry_month",
                "scroll_depth_max", "dwell_seconds",
                "click_sequence", "price_range_viewed",
                "budget_segment", "created_at", "updated_at"
            ) VALUES (
                gen_random_uuid()::text, %s, %s,
                %s, %s, %s,
                %s, %s,
                %s, %s,
                %s::jsonb, %s::jsonb,
                %s, now(), now()
            )
            ON CONFLICT ("session_id") DO UPDATE SET
                "user_id" = COALESCE(EXCLUDED."user_id", "UserSession"."user_id"),
                "scroll_depth_max" = GREATEST("UserSession"."scroll_depth_max", EXCLUDED."scroll_depth_max"),
                "dwell_seconds" = GREATEST("UserSession"."dwell_seconds", EXCLUDED."dwell_seconds"),
                "click_sequence" = EXCLUDED."click_sequence",
                "price_range_viewed" = EXCLUDED."price_range_viewed",
                "budget_segment" = EXCLUDED."budget_segment",
                "updated_at" = now()
        """
        with c.cursor() as cur:
            cur.execute(sql, (
                session_id, user_id,
                session_state.get("lat"), session_state.get("lon"),
                session_state.get("device_type", "mobile"),
                int(session_state.get("hour", 0)),
                int(session_state.get("month", 1)),
                float(session_state.get("scroll_depth", 0.0)),
                int(session_state.get("dwell_seconds", 0)),
                json.dumps(click_seq),
                json.dumps(price_range),
                session_state.get("budget_segment", "unknown"),
            ))
        c.commit()
    except Exception as e:
        try:
            c.rollback()
        except Exception:
            pass
        logger.error("upsert_user_session error: %s", e)
    finally:
        if owned:
            release_connection(c)


# ──────────────────────────────────────────────────────────────
# Rate limiting (in-memory)
# ──────────────────────────────────────────────────────────────

_rate_store: dict[str, dict] = {}
_rate_lock = threading.Lock()
MAX_PER_LISTING = 10
MAX_PER_SESSION = 100
_RATE_TTL = 7200  # 2 hours in seconds


def _check_rate_limit(session_id: str, listing_id: str) -> bool:
    """Check and increment per-session rate limits.

    Limits:
        - MAX_PER_LISTING (10) events per listing per session
        - MAX_PER_SESSION (100) total events per session

    Lazy cleanup: removes sessions older than 2 hours.

    Args:
        session_id: Session ID.
        listing_id: Listing ID.

    Returns:
        True if within limits, False if exceeded.
    """
    now = time.time()

    with _rate_lock:
        # Lazy cleanup of old sessions
        expired = [
            sid for sid, data in _rate_store.items()
            if now - data.get("_ts", 0) > _RATE_TTL
        ]
        for sid in expired:
            del _rate_store[sid]

        # Get or create session entry
        if session_id not in _rate_store:
            _rate_store[session_id] = {"_total": 0, "_ts": now}

        session = _rate_store[session_id]
        session["_ts"] = now

        # Check total session limit
        total = session.get("_total", 0)
        if total >= MAX_PER_SESSION:
            logger.debug("Rate limit: session %s hit MAX_PER_SESSION", session_id)
            return False

        # Check per-listing limit
        listing_count = session.get(listing_id, 0)
        if listing_count >= MAX_PER_LISTING:
            logger.debug(
                "Rate limit: session %s hit MAX_PER_LISTING for %s",
                session_id, listing_id,
            )
            return False

        # Increment
        session[listing_id] = listing_count + 1
        session["_total"] = total + 1
        return True


# ──────────────────────────────────────────────────────────────
# Self-tests
# ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    logging.basicConfig(level=logging.INFO)
    passed = 0
    failed = 0

    def _test(name: str, cond: bool) -> None:
        global passed, failed
        if cond:
            print(f"  ✅ {name}")
            passed += 1
        else:
            print(f"  ❌ {name}")
            failed += 1

    print("\n" + "=" * 50)
    print(" db.py — Unit Tests (no DB required)")
    print("=" * 50)

    # --- Rate limiting ---
    print("\n🚦 Rate limiting")
    _rate_store.clear()

    for i in range(MAX_PER_LISTING):
        assert _check_rate_limit("s1", "L1") is True
    _test("listing limit reached", _check_rate_limit("s1", "L1") is False)
    _test("other listing OK", _check_rate_limit("s1", "L2") is True)

    # Session limit
    _rate_store.clear()
    for i in range(MAX_PER_SESSION):
        _check_rate_limit("s2", f"L{i}")
    _test("session limit reached", _check_rate_limit("s2", "Lnew") is False)

    # TTL cleanup
    _rate_store["old_session"] = {"_total": 5, "_ts": time.time() - 8000}
    _check_rate_limit("trigger_cleanup", "L1")
    _test("old sessions cleaned", "old_session" not in _rate_store)

    # --- Matrix cache ---
    print("\n🧮 Matrix cache")
    import app.reco.db as _db_mod
    _db_mod._GLOBAL_A = np.eye(D_PHI)
    _db_mod._GLOBAL_B = np.zeros(D_PHI)
    A, b = get_cached_matrices()
    _test("cached A shape", A.shape == (D_PHI, D_PHI))
    _test("cached b shape", b.shape == (D_PHI,))
    _test("returns copies", A is not _db_mod._GLOBAL_A)

    # --- Summary ---
    total = passed + failed
    print(f"\n{'=' * 50}")
    print(f" Results: {passed}/{total} passed")
    print(f"{'=' * 50}\n")
    sys.exit(1 if failed > 0 else 0)
