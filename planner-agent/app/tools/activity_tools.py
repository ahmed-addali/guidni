"""Activity tools — search, get details, enrich activities with AI.

Tools:
- search_activities: Search activities by region, category, max price
- get_activity_details: Get full details of a specific activity
- enrich_activity: AI-analyze an activity for noise, ambiance, physical level, etc.
"""

import json
import logging
from langchain_core.tools import tool
from app.db.connection import async_session
from app.db import queries

logger = logging.getLogger(__name__)


@tool
async def search_activities(
    region: str,
    category: str = None,
    max_price: int = None,
) -> list[dict]:
    """Search for activities in a region. Can filter by category and max price.

    Args:
        region: Region to search (e.g. "Djerba")
        category: Optional category filter (e.g. "water sports", "cultural")
        max_price: Optional maximum price filter in TND
    """
    async with async_session() as session:
        activities = await queries.get_activities_by_region(
            session, region, category=category, max_price=max_price
        )
    return activities


@tool
async def get_activity_details(activity_id: str) -> dict:
    """Get full details of a specific activity including images, includes/excludes,
    capacity, and available times.

    Args:
        activity_id: The activity's unique ID
    """
    async with async_session() as session:
        details = await queries.get_activity_details(session, activity_id)
    if not details:
        return {"error": "Activity not found"}
    return details


@tool
async def enrich_activity(activity_id: str) -> dict:
    """Analyze an activity to determine its noise level, ambiance, physical intensity,
    best time of day, and other characteristics. Results are cached — calling this
    multiple times for the same activity is efficient.

    Args:
        activity_id: The activity's unique ID to enrich
    """
    async with async_session() as session:
        # Check cache first
        cached = await queries.get_activity_intelligence(session, activity_id)
        if cached:
            return cached

        # Get activity details for analysis
        activity = await queries.get_activity_details(session, activity_id)
        if not activity:
            return {"error": "Activity not found"}

    # Use LLM to analyze the activity
    try:
        from app.llm.provider import get_llm
        llm = get_llm(temperature=0.3, json_mode=True)

        prompt = f"""Analyze this tourism activity and return a JSON object with enrichment metadata.

Activity: {activity['title']}
Category: {activity['category']}
Description: {activity['description']}
Duration: {activity.get('duration', 'unknown')}
Price: {activity['price']} TND
Location: {activity.get('city', '')} {activity.get('region', '')}

Return JSON with these exact fields:
{{
    "noise_level": "quiet" | "moderate" | "loud",
    "ambiance": "romantic" | "family" | "adventure" | "cultural" | "relaxing" | "social",
    "physical_intensity": "low" | "moderate" | "high",
    "best_time_of_day": "morning" | "afternoon" | "evening" | "any",
    "ideal_weather": "sunny" | "any" | "cloudy_ok",
    "ideal_group_type": ["solo", "couple", "family", "friends"],
    "age_friendly": "all_ages" | "adults" | "young_adults",
    "indoor_outdoor": "indoor" | "outdoor" | "both",
    "tags": ["list", "of", "relevant", "tags"],
    "summary": "One sentence summary of what makes this activity special"
}}"""

        from langchain_core.messages import HumanMessage
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        enrichment = json.loads(response.content)

    except Exception as e:
        logger.warning("Failed to enrich activity %s: %s", activity_id, e)
        # Provide basic enrichment from category/description analysis
        enrichment = {
            "noise_level": "moderate",
            "ambiance": "cultural",
            "physical_intensity": "moderate",
            "best_time_of_day": "any",
            "ideal_weather": "any",
            "ideal_group_type": ["solo", "couple", "family", "friends"],
            "age_friendly": "all_ages",
            "indoor_outdoor": "outdoor",
            "tags": [activity.get("category", "")],
            "summary": activity["description"][:100],
        }

    # Cache the result
    async with async_session() as session:
        await queries.save_activity_intelligence(session, activity_id, enrichment)

    return enrichment
