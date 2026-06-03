"""
PostgreSQL connection helper — reads the same DATABASE_URL
as the Next.js app to access the Guidni database.
"""

import psycopg2
import psycopg2.extras
import logging
from config import get_settings

logger = logging.getLogger(__name__)


def get_connection():
    """Create a new psycopg2 connection using DATABASE_URL."""
    settings = get_settings()
    conn = psycopg2.connect(settings.database_url)
    conn.autocommit = True
    logger.info("Connected to PostgreSQL: %s", settings.database_url.split("@")[-1])
    return conn


def fetch_all(query: str, params: tuple = ()) -> list[dict]:
    """Execute a query and return all rows as dicts."""
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(query, params)
            return [dict(row) for row in cur.fetchall()]
    finally:
        conn.close()


def fetch_one(query: str, params: tuple = ()) -> dict | None:
    """Execute a query and return one row as dict or None."""
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(query, params)
            row = cur.fetchone()
            return dict(row) if row else None
    finally:
        conn.close()
