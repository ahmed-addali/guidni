"""Availability tools — check booking capacity.

Description for the agent:
"Check if an activity has available spots on a specific date."
"""

from langchain_core.tools import tool
from app.db.connection import async_session
from app.db import queries
from datetime import date


@tool
async def check_availability(activity_id: str, check_date: str) -> dict:
    """Check if an activity has available spots on a specific date.
    Returns availability status, spots left, and total capacity.

    Args:
        activity_id: The activity's unique ID
        check_date: Date to check in ISO format (YYYY-MM-DD)
    """
    try:
        target_date = date.fromisoformat(check_date)
    except ValueError:
        return {"error": f"Invalid date format: {check_date}. Use YYYY-MM-DD"}

    async with async_session() as session:
        result = await queries.check_activity_availability(
            session, activity_id, target_date
        )
    return result
