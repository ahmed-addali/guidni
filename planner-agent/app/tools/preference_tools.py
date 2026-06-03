"""Preference Tools — LLM-driven preference management.

The LLM calls update_preferences to set/modify trip parameters
as it understands the user's needs from conversation.
This is the core of the agentic workflow: preferences are the
persistent mutable state, and the LLM is the orchestrator that
decides when and how to update them.
"""

import logging
from langchain_core.tools import tool
from app.db.connection import async_session
from app.db.models import Destination
from sqlalchemy import select

logger = logging.getLogger(__name__)

# Valid values for constrained fields
_ALLOWED_INTERESTS = {
    "adventures", "water_sports", "culture", "food_drink",
    "nature_wildlife", "attractions", "sightseeing", "workshops",
    "wellness", "shopping", "family_friendly", "events", "trips",
}
_ALLOWED_STYLES = {"relaxed", "balanced", "active"}
_ALLOWED_BUDGETS = {1, 2, 3}
_ALLOWED_GROUPS = {"solo", "couple", "family", "friends"}
_ALLOWED_ACCOMMODATIONS = {"hotel", "riad", "apartment", "hostel"}


@tool
async def update_preferences(
    destination: str | None = None,
    duration: int | None = None,
    start_date: str | None = None,
    travel_style: str | None = None,
    budget: int | None = None,
    group_type: str | None = None,
    interests: list[str] | None = None,
    accommodation_type: str | None = None,
    needs_airport_pickup: bool | None = None,
    needs_return_transfer: bool | None = None,
    needs_rental: bool | None = None,
    rental_type: str | None = None,
) -> dict:
    """Update the user's trip preferences. Call this WHENEVER you learn
    new information about the user's trip from the conversation.

    Only provide the fields you want to UPDATE — omit fields you don't
    want to change. The system merges your updates into the existing prefs.

    You MUST call this before any rag_search_for_plan
    to ensure the filters match the user's actual needs.

    Args:
        destination: City name (e.g. "Djerba") — resolved to DB ID automatically
        duration: Number of days (1-14)
        start_date: Trip start date in YYYY-MM-DD format
        travel_style: "relaxed", "balanced", or "active"
        budget: 1 (budget), 2 (mid-range), or 3 (luxury)
        group_type: "solo", "couple", "family", or "friends"
        interests: List like ["culture", "food_drink", "adventures"]
        accommodation_type: "hotel", "riad", "apartment", or "hostel"
        needs_airport_pickup: True if airport pickup is requested
        needs_return_transfer: True if return transfer to airport is requested
        needs_rental: True if a rental vehicle is requested
        rental_type: The type of rental requested (e.g., "car", "scooter")

    Returns:
        The preference updates dict with resolved destination_id.
    """
    updates = {}

    # Resolve destination name → DB ID
    if destination:
        async with async_session() as session:
            result = await session.execute(
                select(Destination).where(
                    Destination.city.ilike(f"%{destination}%")
                )
            )
            dest = result.scalars().first()
            if not dest:
                result = await session.execute(
                    select(Destination).where(
                        Destination.region.ilike(f"%{destination}%")
                    )
                )
                dest = result.scalars().first()
            if not dest:
                result = await session.execute(
                    select(Destination).where(Destination.active.is_(True))
                )
                dest = result.scalars().first()

            if dest:
                updates["destination_id"] = dest.id
                updates["destination_name"] = dest.city
                updates["destination_city"] = dest.city
                logger.info("Resolved destination '%s' → %s (%s)", destination, dest.id, dest.city)
            else:
                logger.warning("Could not resolve destination '%s'", destination)
                return {"error": f"Destination '{destination}' not found in database"}

    # Validate and set other fields
    if duration is not None:
        updates["duration"] = max(1, min(14, duration))

    if start_date:
        updates["start_date"] = start_date

    if travel_style and travel_style in _ALLOWED_STYLES:
        updates["travel_style"] = travel_style

    if budget is not None and budget in _ALLOWED_BUDGETS:
        updates["budget"] = budget

    if group_type and group_type in _ALLOWED_GROUPS:
        updates["group_type"] = group_type

    if interests is not None:
        updates["interests"] = [i for i in interests if i in _ALLOWED_INTERESTS]

    if accommodation_type and accommodation_type in _ALLOWED_ACCOMMODATIONS:
        updates["accommodation_type"] = accommodation_type

    if needs_airport_pickup is not None:
        updates["needs_airport_pickup"] = needs_airport_pickup

    if needs_return_transfer is not None:
        updates["needs_return_transfer"] = needs_return_transfer

    if needs_rental is not None:
        updates["needs_rental"] = needs_rental

    if rental_type is not None:
        updates["rental_type"] = rental_type

    logger.info("Preference updates: %s", updates)
    return {"preference_updates": updates, "status": "updated"}
