"""
CLI script — Run full ingestion from PostgreSQL → Qdrant.

Usage:
    cd brain
    python -m scripts.ingest          # Full re-ingestion (recreates collections)
    python -m scripts.ingest --append  # Upsert without recreating collections
"""

import sys
import os
import logging
import time

# Ensure brain/ is the root for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


def main():
    recreate = "--append" not in sys.argv

    logger.info("=" * 60)
    logger.info("  GUIDNI RAG INGESTION PIPELINE")
    logger.info("  Mode: %s", "RECREATE" if recreate else "APPEND")
    logger.info("=" * 60)

    start = time.time()

    from ingest.pipeline import run_full_ingestion
    results = run_full_ingestion(recreate=recreate)

    elapsed = time.time() - start

    logger.info("")
    logger.info("SUMMARY:")
    logger.info("-" * 40)
    total = 0
    for entity_type, count in results.items():
        logger.info("  %-15s %d points", entity_type, count)
        total += count
    logger.info("-" * 40)
    logger.info("  %-15s %d points", "TOTAL", total)
    logger.info("  Completed in %.1f seconds", elapsed)
    logger.info("")


if __name__ == "__main__":
    main()
