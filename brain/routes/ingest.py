"""
Ingestion endpoints — manual full re-ingestion + auto-trigger single-item ops.
"""

import logging
from fastapi import APIRouter, BackgroundTasks

from models.preferences import SingleIngestRequest
from ingest.pipeline import run_full_ingestion, upsert_single_item, delete_single_item

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/full")
async def trigger_full_ingestion(background_tasks: BackgroundTasks):
    """
    Trigger a full re-ingestion of all collections.
    Runs in background to avoid timeout.
    """
    background_tasks.add_task(_run_ingestion)
    return {"status": "started", "message": "Full ingestion started in background"}


def _run_ingestion():
    try:
        results = run_full_ingestion(recreate=True)
        logger.info("Background ingestion completed: %s", results)
    except Exception as e:
        logger.error("Background ingestion failed: %s", e)


@router.post("/single")
async def trigger_single_ingest(req: SingleIngestRequest):
    """
    Auto-trigger: re-ingest or delete a single item.
    Called by Next.js server actions when a partner creates/updates/deletes a listing.
    
    Example payload:
    {
        "item_type": "activity",
        "item_id": "clx1234abc",
        "action": "upsert"
    }
    """
    if req.action == "delete":
        success = delete_single_item(req.item_type, req.item_id)
        return {
            "status": "ok" if success else "error",
            "action": "delete",
            "item_type": req.item_type,
            "item_id": req.item_id,
        }
    else:
        success = upsert_single_item(req.item_type, req.item_id)
        return {
            "status": "ok" if success else "error",
            "action": "upsert",
            "item_type": req.item_type,
            "item_id": req.item_id,
        }
