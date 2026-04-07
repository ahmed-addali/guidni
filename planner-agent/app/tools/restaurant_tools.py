"""Restaurant tools — search restaurants and cafes.

Description for the agent:
"Search for restaurants and cafes in the area."
"""

from langchain_core.tools import tool
from app.db.connection import async_session
from app.db import queries


@tool
async def search_restaurants(
    region: str = None,
    cuisine_type: str = None,
) -> list[dict]:
    """Search for restaurants and cafes in the area. Can filter by cuisine type.
    Returns restaurant names, types, categories, opening hours, and images.

    Args:
        region: Region or city to search (e.g. "Djerba", "Houmt Souk")
        cuisine_type: Optional cuisine type filter (e.g. "SEAFOOD", "ITALIAN")
    """
    async with async_session() as session:
        restaurants = await queries.get_restaurants_by_region(
            session, region=region, cuisine_type=cuisine_type, limit=10
        )
    return restaurants
