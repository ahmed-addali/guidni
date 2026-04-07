"""Geo tools — distance calculation and geocoding.

Tools:
- get_distance: Haversine formula (pure math, no API)
- geocode_address: Nominatim API (free, no key required)
"""

import math
import logging
from langchain_core.tools import tool
import httpx

logger = logging.getLogger(__name__)


@tool
async def get_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> dict:
    """Calculate distance between two points using the Haversine formula.
    No API call needed — pure math calculation.

    Args:
        lat1: Latitude of first point
        lon1: Longitude of first point
        lat2: Latitude of second point
        lon2: Longitude of second point
    """
    R = 6371  # Earth's radius in km

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c

    return {
        "distance_km": round(distance, 2),
        "distance_display": f"{distance:.1f} km" if distance >= 1 else f"{distance * 1000:.0f} m",
        "estimated_drive_minutes": round(distance / 0.6),  # ~36 km/h average in Djerba
    }


@tool
async def geocode_address(address: str, city: str = "", region: str = "Djerba") -> dict:
    """Convert an address to GPS coordinates using Nominatim (free, no API key needed).

    Args:
        address: The address or place name to geocode
        city: City name for more precise results
        region: Region name (default: Djerba)
    """
    query = f"{address}, {city}, {region}, Tunisia"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": query, "format": "json", "limit": 1},
                headers={"User-Agent": "Guidni-Planner/1.0"},
                timeout=10.0,
            )
            data = response.json()

        if not data:
            return {"error": f"Could not geocode: {query}"}

        result = data[0]
        return {
            "latitude": float(result["lat"]),
            "longitude": float(result["lon"]),
            "display_name": result.get("display_name", ""),
        }

    except Exception as e:
        logger.warning("Geocoding failed: %s", e)
        return {"error": f"Geocoding failed: {str(e)}"}
