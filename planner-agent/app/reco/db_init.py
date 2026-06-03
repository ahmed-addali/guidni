"""Recommendation DB Init — LinUCB database initialization and startup checks.

Uses psycopg2 with ThreadedConnectionPool for synchronous DB operations.
All functions accept an optional `conn` parameter — if None, a connection
is acquired from the pool and returned after use.

Designed to run at FastAPI startup via run_startup_checks(), which MUST
block startup if any verification fails.
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
from typing import Optional

import numpy as np
import psycopg2
from psycopg2.pool import ThreadedConnectionPool
from psycopg2.extras import RealDictCursor

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────
# Connection Pool
# ──────────────────────────────────────────────────────────────

_pool: Optional[ThreadedConnectionPool] = None


def _get_database_url() -> str:
    """Get the PostgreSQL DSN from the environment variable.

    Strips the asyncpg driver prefix if present (the main app uses
    postgresql+asyncpg://, but psycopg2 needs plain postgresql://).

    Returns:
        A psycopg2-compatible PostgreSQL connection string.

    Raises:
        RuntimeError: If DATABASE_URL is not set.
    """
    url = os.environ.get("DATABASE_URL", "")
    if not url:
        raise RuntimeError(
            "DATABASE_URL environment variable is not set. "
            "Cannot initialize recommendation DB."
        )
    # Convert asyncpg URL to psycopg2-compatible URL
    url = url.replace("postgresql+asyncpg://", "postgresql://")
    return url


def _get_pool() -> ThreadedConnectionPool:
    """Get or create the global ThreadedConnectionPool.

    Returns:
        The shared ThreadedConnectionPool instance.

    Raises:
        RuntimeError: If the pool cannot be created.
    """
    global _pool
    if _pool is None or _pool.closed:
        try:
            dsn = _get_database_url()
            _pool = ThreadedConnectionPool(minconn=2, maxconn=10, dsn=dsn)
            logger.info("psycopg2 ThreadedConnectionPool created (min=2, max=10)")
        except psycopg2.Error as e:
            logger.error("Failed to create connection pool: %s", e)
            raise RuntimeError(f"Cannot create DB connection pool: {e}") from e
    return _pool


def _get_conn(conn: Optional[psycopg2.extensions.connection] = None):
    """Get a connection — use provided or acquire from pool.

    Args:
        conn: An existing psycopg2 connection, or None.

    Returns:
        A tuple of (connection, owned) where owned=True means
        the caller must return the connection to the pool.
    """
    if conn is not None:
        return conn, False
    pool = _get_pool()
    return pool.getconn(), True


def _return_conn(conn: psycopg2.extensions.connection) -> None:
    """Return a connection to the pool."""
    try:
        pool = _get_pool()
        pool.putconn(conn)
    except Exception as e:
        logger.warning("Failed to return connection to pool: %s", e)


# ──────────────────────────────────────────────────────────────
# Helper: compute vocab hash
# ──────────────────────────────────────────────────────────────

def _compute_vocab_hash(vocab: list[str]) -> str:
    """Compute the SHA-256 hash of a sorted tag vocabulary.

    Args:
        vocab: The list of tag strings.

    Returns:
        Hex digest of sha256(json.dumps(sorted(vocab))).
    """
    return hashlib.sha256(
        json.dumps(sorted(vocab)).encode("utf-8")
    ).hexdigest()


# ──────────────────────────────────────────────────────────────
# Function 1: verify_vocab_hash
# ──────────────────────────────────────────────────────────────

def verify_vocab_hash(
    vocab: list[str],
    conn: Optional[psycopg2.extensions.connection] = None,
) -> bool:
    """Verify that the TAG_VOCAB hash matches the stored SystemConfig value.

    If the stored vocab_hash is empty (first deploy), calls
    seed_system_config() to initialize it.

    Args:
        vocab: The canonical TAG_VOCAB list.
        conn: Optional existing DB connection.

    Returns:
        True if the hashes match, False if mismatch.

    Raises:
        psycopg2.Error: On database errors (logged, not swallowed).
    """
    c, owned = _get_conn(conn)
    try:
        with c.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                'SELECT "value" FROM "SystemConfig" WHERE "key" = %s',
                ("vocab_hash",),
            )
            row = cur.fetchone()

        stored_hash = row["value"] if row else ""

        if stored_hash == "":
            logger.info("SystemConfig vocab_hash is empty — seeding now")
            seed_system_config(vocab, conn=c)
            return True

        computed = _compute_vocab_hash(vocab)
        if stored_hash == computed:
            logger.info("vocab_hash verified OK: %s...", computed[:12])
            return True
        else:
            logger.error(
                "vocab_hash MISMATCH! stored=%s... computed=%s...",
                stored_hash[:12],
                computed[:12],
            )
            return False

    except psycopg2.Error as e:
        logger.error("verify_vocab_hash DB error: %s", e)
        raise
    finally:
        if owned:
            _return_conn(c)


# ──────────────────────────────────────────────────────────────
# Function 2: seed_system_config
# ──────────────────────────────────────────────────────────────

def seed_system_config(
    vocab: list[str],
    d: int | None = None,
    conn: Optional[psycopg2.extensions.connection] = None,
) -> None:
    """Upsert SystemConfig with vocab_hash, d, and schema_version.

    Args:
        vocab: The canonical TAG_VOCAB list.
        d: Feature dimension (default 306).
        conn: Optional existing DB connection.

    Raises:
        psycopg2.Error: On database errors (logged, not swallowed).
    """
    if d is None:
        from app.reco.context import D_PHI
        d = D_PHI
    c, owned = _get_conn(conn)
    try:
        vocab_hash = _compute_vocab_hash(vocab)
        upsert_sql = """
            INSERT INTO "SystemConfig" ("key", "value", "updated_at")
            VALUES (%s, %s, now())
            ON CONFLICT ("key")
            DO UPDATE SET "value" = EXCLUDED."value", "updated_at" = now()
        """
        with c.cursor() as cur:
            cur.execute(upsert_sql, ("vocab_hash", vocab_hash))
            cur.execute(upsert_sql, ("d", str(d)))
            cur.execute(upsert_sql, ("schema_version", "1"))
        c.commit()
        logger.info(
            "SystemConfig seeded: d=%d, hash=%s...",
            d,
            vocab_hash[:12],
        )
    except psycopg2.Error as e:
        c.rollback()
        logger.error("seed_system_config DB error: %s", e)
        raise
    finally:
        if owned:
            _return_conn(c)


# ──────────────────────────────────────────────────────────────
# Function 3: initialize_arm
# ──────────────────────────────────────────────────────────────

def initialize_arm(
    listing_id: str,
    listing_type: str,
    location_zone: str,
    tags: list[str],
    commission_rate: float = 0.10,
    conn: Optional[psycopg2.extensions.connection] = None,
) -> None:
    """Insert a new BanditArmUCB row with default counters.

    Uses ON CONFLICT DO NOTHING to be idempotent.
    No A/b matrix operations — global matrices live only in LinUCBGlobal.

    Args:
        listing_id: The listing's unique identifier.
        listing_type: One of "STAY", "ACTIVITY", "RESTAURANT", "RENTAL", "TRANSFER".
        location_zone: City or region name.
        tags: List of tag strings from TAG_VOCAB.
        commission_rate: Platform commission rate (default 0.10).
        conn: Optional existing DB connection.

    Raises:
        psycopg2.Error: On database errors (logged, not swallowed).
    """
    c, owned = _get_conn(conn)
    try:
        sql = """
            INSERT INTO "BanditArmUCB" (
                "id", "listing_id", "listing_type", "location_zone",
                "tags", "tag_source", "commission_rate",
                "impressions", "clicks", "wishlists", "conversions",
                "total_revenue", "n_updates", "is_underexposed", "updated_at"
            ) VALUES (
                gen_random_uuid()::text, %s, %s, %s,
                %s::jsonb, 'llm', %s,
                0, 0, 0, 0,
                0.0, 0, true, now()
            )
            ON CONFLICT ("listing_id", "listing_type", "location_zone")
            DO NOTHING
        """
        with c.cursor() as cur:
            cur.execute(sql, (
                listing_id,
                listing_type,
                location_zone,
                json.dumps(tags),
                commission_rate,
            ))
        c.commit()
        logger.debug(
            "initialize_arm: %s/%s @ %s (tags=%d)",
            listing_type, listing_id, location_zone, len(tags),
        )
    except psycopg2.Error as e:
        c.rollback()
        logger.error("initialize_arm DB error: %s", e)
        raise
    finally:
        if owned:
            _return_conn(c)


# ──────────────────────────────────────────────────────────────
# Function 4: initialize_global_matrices_in_db
# ──────────────────────────────────────────────────────────────

def initialize_global_matrices_in_db(
    d: int | None = None,
    vocab_hash: str = "",
    conn: Optional[psycopg2.extensions.connection] = None,
) -> None:
    """Initialize the global LinUCB A matrix and b vector if not present.

    Only inserts if the LinUCBGlobal table is empty.
    - A = identity matrix (d×d)
    - b = zero vector (d,)

    Args:
        d: Feature dimension (default 306).
        vocab_hash: SHA-256 hash of the TAG_VOCAB.
        conn: Optional existing DB connection.

    Raises:
        psycopg2.Error: On database errors (logged, not swallowed).
    """
    if d is None:
        from app.reco.context import D_PHI
        d = D_PHI
    c, owned = _get_conn(conn)
    try:
        # Check if already initialized
        with c.cursor() as cur:
            cur.execute('SELECT COUNT(*) FROM "LinUCBGlobal"')
            count = cur.fetchone()[0]

        if count > 0:
            logger.info("LinUCBGlobal already initialized — skipping")
            return

        # Create identity matrix A and zero vector b
        a_matrix = np.eye(d).tolist()
        b_vector = np.zeros(d).tolist()

        sql = """
            INSERT INTO "LinUCBGlobal" (
                "id", "a_matrix", "b_vector", "d",
                "vocab_hash", "n_updates", "updated_at"
            ) VALUES (
                'global', %s::jsonb, %s::jsonb, %s,
                %s, 0, now()
            )
            ON CONFLICT ("id") DO NOTHING
        """
        with c.cursor() as cur:
            cur.execute(sql, (
                json.dumps(a_matrix),
                json.dumps(b_vector),
                d,
                vocab_hash,
            ))
        c.commit()
        logger.info(
            "LinUCBGlobal initialized: A=%dx%d (identity), b=%d (zeros), hash=%s...",
            d, d, d, vocab_hash[:12] if vocab_hash else "<empty>",
        )
    except psycopg2.Error as e:
        c.rollback()
        logger.error("initialize_global_matrices_in_db DB error: %s", e)
        raise
    finally:
        if owned:
            _return_conn(c)


# ──────────────────────────────────────────────────────────────
# Function 5: get_system_config
# ──────────────────────────────────────────────────────────────

def get_system_config(
    key: str,
    default: str = "",
    conn: Optional[psycopg2.extensions.connection] = None,
) -> str:
    """Read a value from the SystemConfig table.

    Args:
        key: The config key to look up.
        default: Value to return if key is not found.
        conn: Optional existing DB connection.

    Returns:
        The config value string, or default if not found.

    Raises:
        psycopg2.Error: On database errors (logged, not swallowed).
    """
    c, owned = _get_conn(conn)
    try:
        with c.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                'SELECT "value" FROM "SystemConfig" WHERE "key" = %s',
                (key,),
            )
            row = cur.fetchone()
        return row["value"] if row else default
    except psycopg2.Error as e:
        logger.error("get_system_config DB error for key=%s: %s", key, e)
        raise
    finally:
        if owned:
            _return_conn(c)


# ──────────────────────────────────────────────────────────────
# Function 6: run_startup_checks
# ──────────────────────────────────────────────────────────────

def run_startup_checks() -> None:
    """Run all LinUCB startup verification checks.

    Called at FastAPI startup. MUST block startup if any check fails.

    Steps:
        1. Verify vocab_hash matches TAG_VOCAB
        2. Initialize global A/b matrices if LinUCBGlobal is empty
        3. Log system state summary

    Raises:
        RuntimeError: If any check fails — blocks FastAPI startup.
    """
    from app.reco.context import TAG_VOCAB

    logger.info("=" * 60)
    logger.info("LinUCB Startup Checks — BEGIN")
    logger.info("=" * 60)

    conn, owned = _get_conn()
    try:
        # 1. Verify vocab hash
        if not verify_vocab_hash(TAG_VOCAB, conn=conn):
            raise RuntimeError(
                "TAG_VOCAB hash mismatch! The deployed TAG_VOCAB does not match "
                "the stored vocab_hash in SystemConfig. This likely means the "
                "vocabulary was changed without re-initializing the global "
                "matrices. Aborting startup."
            )
        logger.info("✅ vocab_hash verified")

        # 2. Initialize global matrices if empty
        vocab_hash = _compute_vocab_hash(TAG_VOCAB)
        initialize_global_matrices_in_db(
            d=len(TAG_VOCAB) * 9,  # D_PHI = D_USER * D_TAGS
            vocab_hash=vocab_hash,
            conn=conn,
        )
        logger.info("✅ LinUCBGlobal matrices checked")

        # 3. Log system state
        d_val = get_system_config("d", default="?", conn=conn)
        schema_ver = get_system_config("schema_version", default="?", conn=conn)
        stored_hash = get_system_config("vocab_hash", default="?", conn=conn)

        with conn.cursor() as cur:
            cur.execute('SELECT "n_updates" FROM "LinUCBGlobal" WHERE "id" = %s', ("global",))
            row = cur.fetchone()
            n_updates = row[0] if row else 0

        logger.info("┌─────────────────────────────────────┐")
        logger.info("│ LinUCB System State                 │")
        logger.info("├─────────────────────────────────────┤")
        logger.info("│ d (phi dim)    : %-19s │", d_val)
        logger.info("│ n_updates      : %-19d │", n_updates)
        logger.info("│ vocab_hash     : %-19s │", stored_hash[:16] + "...")
        logger.info("│ schema_version : %-19s │", schema_ver)
        logger.info("│ TAG_VOCAB size : %-19d │", len(TAG_VOCAB))
        logger.info("└─────────────────────────────────────┘")

        logger.info("=" * 60)
        logger.info("LinUCB Startup Checks — ALL PASSED")
        logger.info("=" * 60)

    except RuntimeError:
        raise
    except Exception as e:
        logger.error("LinUCB startup check failed: %s", e, exc_info=True)
        raise RuntimeError(f"LinUCB startup check failed: {e}") from e
    finally:
        if owned:
            _return_conn(conn)


# ──────────────────────────────────────────────────────────────
# Main: standalone execution
# ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    from dotenv import load_dotenv

    load_dotenv()

    # Configure logging for standalone
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(name)s] %(levelname)s — %(message)s",
    )

    print("\n" + "=" * 60)
    print(" LinUCB DB Init — Standalone Mode")
    print("=" * 60 + "\n")

    # Run startup checks
    run_startup_checks()

    # Print summary table of all table row counts
    conn, _ = _get_conn()
    try:
        tables = [
            "BanditArmUCB",
            "LinUCBGlobal",
            "SystemConfig",
            "ListingTag",
            "UserProfile",
            "UserSession",
            "RecommendationEventUCB",
        ]

        print("\n┌─────────────────────────────┬──────────┐")
        print("│ Table                       │ Row Count│")
        print("├─────────────────────────────┼──────────┤")

        with conn.cursor() as cur:
            for table in tables:
                try:
                    cur.execute(f'SELECT COUNT(*) FROM "{table}"')
                    count = cur.fetchone()[0]
                    print(f"│ {table:<27} │ {count:>8} │")
                except psycopg2.Error as e:
                    print(f"│ {table:<27} │ {'ERROR':>8} │")
                    conn.rollback()

        print("└─────────────────────────────┴──────────┘\n")

    finally:
        _return_conn(conn)

    print("✅ All checks passed. Database is ready.\n")
