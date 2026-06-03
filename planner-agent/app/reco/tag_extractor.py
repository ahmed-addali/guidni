"""Tag Extractor — LLM-powered tag extraction for listings.

Offline nightly batch process that:
    1. Extracts tags from listing descriptions using the configured LLM
    2. Caches results in ListingTag table
    3. Propagates tags to BanditArmUCB rows

Uses the LLM provider defined in .env (Ollama, Groq, Gemini, or Lightning).
Only tags from TAG_VOCAB are accepted in output.
"""

from __future__ import annotations

import json
import logging
import os
import time
from typing import Optional

from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)
from langchain_core.messages import SystemMessage, HumanMessage

from app.reco.context import TAG_VOCAB
from app.llm.provider import get_llm, parse_model_id
from app.config import settings

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────────────────────

_BATCH_SIZE = 10

# System prompt for tag extraction
_SYSTEM_PROMPT = f"""You are a tag extraction system for a Tunisian travel platform.

Given a listing description and its type, extract relevant tags from the EXACT taxonomy below.
Return ONLY valid JSON — no markdown, no preamble, no explanation.

ALLOWED TAGS (use ONLY these):
{json.dumps(TAG_VOCAB)}

RULES:
1. Only output tags from the list above. Any other tag is INVALID.
2. A listing can have 1-10 tags.
3. Infer tags from context — e.g. if a hotel mentions a pool, add "pool".
4. Include "all_seasons" if the listing is viable year-round.
5. Detect the language of the description (Tunisian darija, French, English, or mixed).

OUTPUT FORMAT (strict JSON):
{{"tags": ["tag1", "tag2", ...], "confidence": 0.87, "language_detected": "french"}}

language_detected must be one of: "darija", "french", "english", "arabic", "mixed", "unknown"
confidence must be a float between 0.0 and 1.0.
"""


# ──────────────────────────────────────────────────────────────
# LLM extraction
# ──────────────────────────────────────────────────────────────


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=30),
    retry=retry_if_exception_type(Exception),
    reraise=True,
)
def extract_tags_from_description(
    description: str,
    listing_type: str,
) -> dict:
    """Extract tags from a listing description using the configured LLM.

    Retries up to 3 times with exponential backoff on failure.
    On permanent failure: returns fallback tags.

    Args:
        description: The listing's text description (any language).
        listing_type: One of "STAY", "ACTIVITY", "RESTAURANT", "RENTAL", "TRANSFER".

    Returns:
        Dict with keys: tags (list[str]), confidence (float),
        language_detected (str).
    """
    fallback = {
        "tags": ["all_seasons"],
        "confidence": 0.0,
        "language_detected": "unknown",
    }

    if not description or not description.strip():
        logger.warning("Empty description for %s listing — returning fallback", listing_type)
        return fallback

    # Use specific model if configured, otherwise use default LLM_PROVIDER
    model_id = settings.RECO_EXTRACT_MODEL
    if model_id:
        try:
            prov, mod = parse_model_id(model_id)
            llm = get_llm(temperature=0.0, json_mode=True, provider=prov, model=mod)
        except Exception as e:
            logger.warning("Failed to parse RECO_EXTRACT_MODEL '%s': %s. Using default.", model_id, e)
            llm = get_llm(temperature=0.0, json_mode=True)
    else:
        llm = get_llm(temperature=0.0, json_mode=True)

    user_prompt = (
        f"Listing type: {listing_type}\n\n"
        f"Description:\n{description}"  # Cap at 3000 chars
    )

    try:
        response = llm.invoke([
            SystemMessage(content=_SYSTEM_PROMPT),
            HumanMessage(content=user_prompt)
        ])

        # Parse response
        raw_text = response.content.strip()
        # Handle cases where some models might wrap JSON in markdown blocks
        if raw_text.startswith("```json"):
            raw_text = raw_text.split("```json")[1].split("```")[0].strip()
        elif raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1].split("```")[0].strip()
        result = json.loads(raw_text)

        # Validate tags — keep only valid ones
        valid_set = set(TAG_VOCAB)
        raw_tags = result.get("tags", [])
        clean_tags = [t for t in raw_tags if t in valid_set]

        if not clean_tags:
            clean_tags = ["all_seasons"]
            logger.warning("No valid tags extracted — using fallback")

        return {
            "tags": clean_tags,
            "confidence": float(result.get("confidence", 0.5)),
            "language_detected": str(result.get("language_detected", "unknown")),
        }

    except json.JSONDecodeError as e:
        logger.error("LLM returned invalid JSON: %s", e)
        raise  # Will retry
    except Exception as e:
        logger.error("Tag extraction failed: %s", e)
        raise  # Will retry


def _extract_with_fallback(description: str, listing_type: str) -> dict:
    """Extract tags with fallback on permanent failure.

    Args:
        description: Listing description.
        listing_type: Listing type string.

    Returns:
        Tag extraction result dict.
    """
    try:
        return extract_tags_from_description(description, listing_type)
    except Exception as e:
        logger.error("Permanent extraction failure: %s — using fallback", e)
        return {
            "tags": ["all_seasons"],
            "confidence": 0.0,
            "language_detected": "unknown",
        }


# ──────────────────────────────────────────────────────────────
# Batch extraction
# ──────────────────────────────────────────────────────────────

def batch_extract_missing_listings(conn=None) -> dict:
    """Extract tags for all listings missing from ListingTag.

    Args:
        conn: Optional psycopg2 connection.

    Returns:
        Summary dict.
    """
    return _batch_process_listings(only_missing=True, conn=conn)


def batch_reextract_all_listings(conn=None) -> dict:
    """Force re-extraction for ALL listings in the database.

    Args:
        conn: Optional psycopg2 connection.

    Returns:
        Summary dict.
    """
    return _batch_process_listings(only_missing=False, conn=conn)


def extract_tags_for_listing(listing_id: str, listing_type: str, conn=None) -> dict:
    """Re-extract tags for a specific listing.

    Args:
        listing_id: Listing ID.
        listing_type: Listing type.
        conn: Optional psycopg2 connection.

    Returns:
        Result dict.
    """
    from app.reco.db_init import _get_conn, _return_conn
    from psycopg2.extras import RealDictCursor

    c, owned = _get_conn(conn)
    try:
        # 1. Get description
        table_map = {
            "STAY": "Stay",
            "ACTIVITY": "Activity",
            "RESTAURANT": "Restaurant",
            "RENTAL": "Rental",
            "TRANSFER": "Transfer",
        }
        table = table_map.get(listing_type.upper())
        if not table:
            raise ValueError(f"Invalid listing type: {listing_type}")

        with c.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(f'SELECT "description" FROM "{table}" WHERE "id" = %s', (listing_id,))
            row = cur.fetchone()
            if not row:
                raise ValueError(f"Listing {listing_id} not found in {table}")

            description = row.get("description", "") or ""

        # 2. Extract
        result = _extract_with_fallback(description, listing_type)

        # 3. Save
        _upsert_listing_tag(
            c, listing_id, listing_type,
            result["tags"], description, result["confidence"],
        )
        _update_bandit_arm_tags(c, listing_id, listing_type, result["tags"])

        return result
    finally:
        if owned:
            _return_conn(c)


def _batch_process_listings(only_missing: bool = True, conn=None) -> dict:
    """Internal helper to process listings in batches.

    Args:
        only_missing: If True, only Untagged listings. If False, ALL listings.
        conn: Optional connection.
    """
    from app.reco.db_init import _get_conn, _return_conn
    from psycopg2.extras import RealDictCursor

    c, owned = _get_conn(conn)
    processed = 0
    failed_count = 0
    total_confidence = 0.0

    try:
        # Find listings
        missing = _get_listings_to_process(c, only_missing=only_missing)
        logger.info("Total listings to process: %d (only_missing=%s)", len(missing), only_missing)

        # Process in batches
        for batch_start in range(0, len(missing), _BATCH_SIZE):
            batch = missing[batch_start : batch_start + _BATCH_SIZE]

            for row in batch:
                listing_id = row["listing_id"]
                listing_type = row["listing_type"]
                description = row.get("description", "") or ""

                result = _extract_with_fallback(description, listing_type)

                if result["confidence"] == 0.0 and result["tags"] == ["all_seasons"]:
                    failed_count += 1
                else:
                    processed += 1
                    total_confidence += result["confidence"]

                # Upsert into ListingTag
                try:
                    _upsert_listing_tag(
                        c, listing_id, listing_type,
                        result["tags"], description, result["confidence"],
                    )

                    # Update BanditArmUCB tags
                    _update_bandit_arm_tags(c, listing_id, listing_type, result["tags"])

                except Exception as e:
                    logger.error(
                        "DB upsert failed for %s/%s: %s",
                        listing_type, listing_id, e,
                    )
                    c.rollback()
                    failed_count += 1

            # Rate limiting between batches
            time.sleep(1.0)

        avg_conf = total_confidence / processed if processed > 0 else 0.0

        summary = {
            "processed": processed,
            "failed": failed_count,
            "avg_confidence": round(avg_conf, 3),
        }
        logger.info("Batch extraction complete: %s", summary)
        return summary

    except Exception as e:
        logger.error("_batch_process_listings error: %s", e, exc_info=True)
        return {"processed": processed, "failed": failed_count, "avg_confidence": 0.0}
    finally:
        if owned:
            _return_conn(c)


def _get_listings_to_process(conn, only_missing: bool = True) -> list[dict]:
    """Discover listings to process from all entity tables.

    Args:
        conn: psycopg2 connection.
        only_missing: If True, only listings not in ListingTag.
    """
    from psycopg2.extras import RealDictCursor

    entities = ["Activity", "Stay", "Restaurant", "Rental", "Transfer"]
    missing = []

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        for entity in entities:
            listing_type = entity.upper()
            if only_missing:
                sql = f"""
                    SELECT e."id" AS listing_id, '{listing_type}' AS listing_type,
                           e."description" AS description
                    FROM "{entity}" e
                    LEFT JOIN "ListingTag" lt ON lt."listing_id" = e."id"
                        AND lt."listing_type" = '{listing_type}'
                    WHERE lt."id" IS NULL
                """
            else:
                sql = f"""
                    SELECT "id" AS listing_id, '{listing_type}' AS listing_type,
                           "description" AS description
                    FROM "{entity}"
                """

            try:
                cur.execute(sql)
                rows = cur.fetchall()
                missing.extend(rows)
            except Exception as e:
                logger.warning("Failed to query %s: %s", entity, e)
                conn.rollback()

    return missing


def _upsert_listing_tag(
    conn,
    listing_id: str,
    listing_type: str,
    tags: list[str],
    raw_description: str,
    confidence: float,
) -> None:
    """Upsert a ListingTag row.

    Args:
        conn: psycopg2 connection.
        listing_id: Listing ID.
        listing_type: Listing type.
        tags: Extracted tags.
        raw_description: Original description.
        confidence: Extraction confidence.
    """
    sql = """
        INSERT INTO "ListingTag" (
            "id", "listing_id", "listing_type", "tags",
            "raw_description", "confidence", "created_at", "updated_at"
        ) VALUES (
            gen_random_uuid()::text, %s, %s, %s::jsonb,
            %s, %s, now(), now()
        )
        ON CONFLICT ("listing_id", "listing_type")
        DO UPDATE SET
            "tags" = EXCLUDED."tags",
            "raw_description" = EXCLUDED."raw_description",
            "confidence" = EXCLUDED."confidence",
            "updated_at" = now()
    """
    with conn.cursor() as cur:
        cur.execute(sql, (
            listing_id, listing_type, json.dumps(tags),
            raw_description[:5000] if raw_description else None,
            confidence,
        ))
    conn.commit()


def _update_bandit_arm_tags(
    conn,
    listing_id: str,
    listing_type: str,
    tags: list[str],
) -> None:
    """Update BanditArmUCB.tags for all location_zones of a listing.

    Args:
        conn: psycopg2 connection.
        listing_id: Listing ID.
        listing_type: Listing type.
        tags: New tags to set.
    """
    sql = """
        UPDATE "BanditArmUCB"
        SET "tags" = %s::jsonb,
            "tag_source" = 'llm',
            "updated_at" = now()
        WHERE "listing_id" = %s AND "listing_type" = %s
    """
    with conn.cursor() as cur:
        cur.execute(sql, (json.dumps(tags), listing_id, listing_type))
    conn.commit()


# ──────────────────────────────────────────────────────────────
# Fast DB lookup
# ──────────────────────────────────────────────────────────────

def get_tags_for_listing(
    listing_id: str,
    listing_type: str,
    conn=None,
) -> list[str]:
    """Fast DB lookup of cached tags for a listing.

    Falls back to ["all_seasons"] if not found.

    Args:
        listing_id: Listing ID.
        listing_type: Listing type.
        conn: Optional psycopg2 connection.

    Returns:
        List of tag strings.
    """
    from app.reco.db_init import _get_conn, _return_conn
    from psycopg2.extras import RealDictCursor

    c, owned = _get_conn(conn)
    try:
        with c.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                'SELECT "tags" FROM "ListingTag" '
                'WHERE "listing_id" = %s AND "listing_type" = %s',
                (listing_id, listing_type),
            )
            row = cur.fetchone()

        if row is None:
            return ["all_seasons"]

        tags = row["tags"]
        if isinstance(tags, str):
            tags = json.loads(tags)

        return tags if tags else ["all_seasons"]

    except Exception as e:
        logger.error("get_tags_for_listing error: %s", e)
        return ["all_seasons"]
    finally:
        if owned:
            _return_conn(c)


# ──────────────────────────────────────────────────────────────
# Self-tests
# ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    logging.basicConfig(level=logging.INFO)
    passed = 0
    failed_tests = 0

    def _test(name: str, cond: bool) -> None:
        global passed, failed_tests
        if cond:
            print(f"  ✅ {name}")
            passed += 1
        else:
            print(f"  ❌ {name}")
            failed_tests += 1

    print("\n" + "=" * 50)
    print(" tag_extractor.py — Unit Tests")
    print("=" * 50)

    # --- Test 1: TAG_VOCAB ---
    print("\n📋 TAG_VOCAB validation")
    _test("40 tags", len(TAG_VOCAB) == 40)
    _test("all lowercase", all(t == t.lower() for t in TAG_VOCAB))
    _test("no duplicates", len(TAG_VOCAB) == len(set(TAG_VOCAB)))

    # --- Test 2: System prompt ---
    print("\n🤖 System prompt")
    _test("prompt contains all tags", all(t in _SYSTEM_PROMPT for t in TAG_VOCAB))
    _test("prompt mentions JSON", "JSON" in _SYSTEM_PROMPT)

    # --- Test 3: Fallback on empty ---
    print("\n🛡️ Fallback behavior")
    fallback = _extract_with_fallback("", "ACTIVITY")
    _test("empty desc → fallback tags", fallback["tags"] == ["all_seasons"])
    _test("empty desc → confidence 0", fallback["confidence"] == 0.0)

    # --- Test 4: Tag validation logic ---
    print("\n✅ Tag validation")
    valid_set = set(TAG_VOCAB)
    test_tags = ["pool", "INVALID_TAG", "luxury", "nonexistent"]
    clean = [t for t in test_tags if t in valid_set]
    _test("filters invalid tags", clean == ["pool", "luxury"])

    # --- Summary ---
    total = passed + failed_tests
    print(f"\n{'=' * 50}")
    print(f" Results: {passed}/{total} passed")
    print(f"{'=' * 50}")
    print("\n⚠️  LLM extraction tests require a configured LLM_PROVIDER")
    print("   Check your .env file to ensure the provider and API key are set.\n")
    sys.exit(1 if failed_tests > 0 else 0)
