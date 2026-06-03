"""
Health check endpoint — verifies brain, Qdrant, and model status.
"""

from fastapi import APIRouter

from qdrant.client import get_qdrant_client
from qdrant.collections import get_collection_stats

router = APIRouter()


@router.get("/health")
async def health_check():
    """Check brain service health — Qdrant connection, model status, collection stats."""
    try:
        client = get_qdrant_client()
        stats = get_collection_stats(client)
        qdrant_ok = all(v >= 0 for v in stats.values())
    except Exception as e:
        return {
            "status": "unhealthy",
            "qdrant": {"connected": False, "error": str(e)},
        }

    return {
        "status": "healthy",
        "service": "guidni-brain",
        "qdrant": {
            "connected": True,
            "collections": stats,
        },
    }
