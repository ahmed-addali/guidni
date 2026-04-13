"""DB Events — SQLAlchemy event listeners for incremental RAG index updates.

Listens to after_insert, after_update, after_delete events on the
Activity, Stay, Restaurant, and Attraction models. When data changes,
automatically triggers re-indexing of only the affected entity.

Uses asyncio background tasks to avoid blocking DB commits.
"""

import asyncio
import logging
from sqlalchemy import event

from app.db.models import Activity, Stay, Restaurant, Attraction

logger = logging.getLogger(__name__)

# Map model classes to their entity type names
_MODEL_TYPE_MAP = {
    Activity: "activity",
    Stay: "stay",
    Restaurant: "restaurant",
    Attraction: "attraction",
}


def _schedule_upsert(entity_type: str, entity_id: str) -> None:
    """Schedule an async upsert in the background."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        # No event loop running — can't schedule
        logger.debug("No event loop — skipping RAG upsert for %s/%s", entity_type, entity_id)
        return

    async def _do_upsert():
        try:
            from app.rag.index_builder import upsert_entity
            await upsert_entity(entity_type, entity_id)
        except Exception as e:
            logger.error("Background RAG upsert failed for %s/%s: %s", entity_type, entity_id, e)

    loop.create_task(_do_upsert())


def _schedule_delete(entity_type: str, entity_id: str) -> None:
    """Schedule an async delete in the background."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        logger.debug("No event loop — skipping RAG delete for %s/%s", entity_type, entity_id)
        return

    async def _do_delete():
        try:
            from app.rag.index_builder import delete_entity
            await delete_entity(entity_type, entity_id)
        except Exception as e:
            logger.error("Background RAG delete failed for %s/%s: %s", entity_type, entity_id, e)

    loop.create_task(_do_delete())


def _after_insert_or_update(mapper, connection, target):
    """Handle insert/update — re-index the entity."""
    model_class = type(target)
    entity_type = _MODEL_TYPE_MAP.get(model_class)
    if entity_type and hasattr(target, "id"):
        logger.info("DB %s changed: %s/%s — scheduling RAG upsert", 
                     model_class.__name__, entity_type, target.id)
        _schedule_upsert(entity_type, target.id)


def _after_delete(mapper, connection, target):
    """Handle delete — remove from index."""
    model_class = type(target)
    entity_type = _MODEL_TYPE_MAP.get(model_class)
    if entity_type and hasattr(target, "id"):
        logger.info("DB %s deleted: %s/%s — scheduling RAG delete",
                     model_class.__name__, entity_type, target.id)
        _schedule_delete(entity_type, target.id)


def register_db_events() -> None:
    """Register SQLAlchemy event listeners for all tracked models.

    Call this once at application startup after the DB engine is ready.
    """
    for model_class in _MODEL_TYPE_MAP:
        event.listen(model_class, "after_insert", _after_insert_or_update)
        event.listen(model_class, "after_update", _after_insert_or_update)
        event.listen(model_class, "after_delete", _after_delete)
        logger.info("Registered RAG event listeners for %s", model_class.__name__)

    logger.info("All RAG DB event listeners registered")
