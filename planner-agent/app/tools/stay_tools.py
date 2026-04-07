"""Stay tools — search accommodation options.

Description for the agent:
"Search for accommodation options. Returns stays sorted by rating."
"""

from langchain_core.tools import tool
from app.db.connection import async_session
from app.db import queries


@tool
async def search_stays(
    region: str,
    max_price: int = None,
    min_rating: float = None,
) -> list[dict]:
    """Search for accommodation options in a region. Returns stays sorted by rating.
    Can filter by maximum price per night and minimum rating.

    Args:
        region: Region to search (e.g. "Djerba")
        max_price: Optional max price per night in TND
        min_rating: Optional minimum average rating (0-5)
    """
    async with async_session() as session:
        stays = await queries.get_stays_by_region(
            session, region, max_price=max_price, min_rating=min_rating, limit=10
        )
    return stays
