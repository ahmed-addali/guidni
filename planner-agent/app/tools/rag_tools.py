"""RAG Tools — LlamaIndex-powered semantic search tools for the agent.

Tools:
- rag_search: General semantic search across all entity types
- rag_search_for_plan: Targeted search for plan-building (activities + restaurants + stays)
- rag_get_similar: Find similar entities to a known entity

All results are source-attributed — every item maps to a real DB entity by ID.
The agent MUST NOT suggest places not returned by these tools.
"""

import logging
from langchain_core.tools import tool

logger = logging.getLogger(__name__)


@tool
async def rag_search(
    query: str,
    entity_type: str = None,
    region: str = None,
    top_k: int = 5,
) -> list[dict]:
    """Semantic search across activities, restaurants, stays, and attractions.
    Use natural language queries like "romantic sunset activities near the beach"
    or "family-friendly restaurants with local cuisine".

    Returns real entities from the database with IDs, scores, and metadata.
    ONLY suggest places returned by this tool — never invent locations.

    Args:
        query: Natural language search query describing what you're looking for
        entity_type: Optional filter to one type: "activity", "restaurant", "stay", "attraction"
        region: Optional region filter (e.g. "Djerba", "Houmt Souk")
        top_k: Number of results to return (default: 5, max: 10)
    """
    from app.rag.query_engine import rag_query

    # Clamp top_k
    top_k = min(max(1, top_k), 10)

    entity_types = [entity_type] if entity_type else None

    try:
        results = await rag_query(
            query=query,
            entity_types=entity_types,
            region=region,
            top_k=top_k,
        )
        if not results:
            return [{"message": f"No results found for '{query}'. Try a different query or broaden the search."}]
        return results
    except Exception as e:
        logger.error("rag_search failed: %s", e)
        return [{"error": f"RAG search failed: {str(e)}"}]


@tool
async def rag_search_for_plan(
    query: str,
    num_days: int = 1,
    day_theme: str = "",
    budget_max: int = None,
    region: str = None,
) -> dict:
    """Search for activities, restaurants, and stays that match a day theme for plan-building.
    Groups results by entity type for easy plan slot filling.

    CRITICAL RULES:
    - "activities" are daytime things to DO (tours, sports, sightseeing). Use for plan time slots.
    - "stays" are ACCOMMODATION (hotels, villas). Use ONLY for overnight stay suggestions. NEVER put a stay as a daytime activity.
    - "restaurants" are for MEALS. Use for lunch/dinner slots.
    - "attractions" are free sightseeing spots. Use for plan time slots.

    Args:
        query: What the traveler is looking for (e.g. "cultural exploration and local food")
        num_days: Number of days in the trip (e.g. 3 for a 3-day trip). Results scale automatically.
        day_theme: Theme for the day (e.g. "Beach & Relaxation", "Heritage Discovery")
        budget_max: Optional maximum price filter per activity/meal in TND
        region: Optional region filter (e.g. "Djerba")
    """
    from app.rag.query_engine import rag_query

    # Combine query with theme for better semantic matching
    full_query = f"{query} {day_theme}".strip()

    # Scale search depth by trip duration (at least 3-4 activities per day)
    num_days = max(1, min(num_days, 14))  # clamp 1-14
    activities_k = min(num_days * 4, 20)
    restaurants_k = min(num_days * 2, 10)
    stays_k = min(num_days, 5)
    attractions_k = min(num_days * 2, 10)

    try:
        # Search activities (daytime things to DO) — uses user's query
        activities = await rag_query(
            query=full_query,
            entity_types=["activity"],
            region=region,
            max_price=budget_max,
            top_k=activities_k,
        )
        for a in activities:
            a["usage"] = "DAYTIME_ACTIVITY — use in plan time slots"

        # Search restaurants (for meal slots)
        # Use a FOOD-SPECIFIC query — the user's trip theme ("family adventure")
        # doesn't match restaurant descriptions, so we query for dining explicitly.
        restaurant_query = f"restaurant dining food cuisine local {region or 'Djerba'}"
        restaurants = await rag_query(
            query=restaurant_query,
            entity_types=["restaurant"],
            # NOTE: no region filter — Yummy table uses city, not region
            top_k=restaurants_k,
        )
        # Fallback: if no restaurants found, try an even broader query
        if not restaurants:
            logger.info("No restaurants found with dining query, retrying with broader query...")
            restaurants = await rag_query(
                query=f"restaurant cafe {region or 'Djerba'}",
                entity_types=["restaurant"],
                top_k=restaurants_k,
            )
        for r in restaurants:
            r["usage"] = "MEAL — use for lunch/dinner slots only"

        # Search stays (accommodation ONLY — NOT daytime activities)
        stays = await rag_query(
            query=full_query,
            entity_types=["stay"],
            region=region,
            max_price=budget_max,
            top_k=stays_k,
        )
        for s in stays:
            s["usage"] = "ACCOMMODATION — suggest as overnight stay ONLY, NEVER as a daytime activity"

        # Search attractions (free sightseeing) — use sightseeing-specific query
        attraction_query = f"sightseeing landmark museum heritage culture {region or 'Djerba'}"
        attractions = await rag_query(
            query=attraction_query,
            entity_types=["attraction"],
            top_k=attractions_k,
        )
        for a in attractions:
            a["usage"] = "ATTRACTION — use in plan time slots (usually free)"

        result = {
            "theme": day_theme or "General",
            "num_days": num_days,
            "WARNING": "stays are ACCOMMODATION (hotels/villas). NEVER place them as daytime activities in the plan.",
            "activities_for_time_slots": activities,
            "restaurants_for_meals": restaurants,
            "stays_for_overnight_only": stays,
            "attractions_for_time_slots": attractions,
            "total_results": len(activities) + len(restaurants) + len(stays) + len(attractions),
        }

        if result["total_results"] == 0:
            result["message"] = f"No results found for theme '{day_theme}'. Try a broader search."

        return result

    except Exception as e:
        logger.error("rag_search_for_plan failed: %s", e)
        return {"error": f"Plan search failed: {str(e)}"}


@tool
async def rag_get_similar(
    entity_id: str,
    entity_type: str,
    top_k: int = 3,
) -> list[dict]:
    """Find entities similar to a known entity. Useful for suggesting alternatives
    when an activity is unavailable, or for offering variety.

    Args:
        entity_id: The ID of the entity to find similar items for
        entity_type: Type of entity: "activity", "restaurant", "stay", "attraction"
        top_k: Number of similar items to return (default: 3)
    """
    from app.rag.query_engine import rag_find_similar

    try:
        results = await rag_find_similar(
            entity_type=entity_type,
            entity_id=entity_id,
            top_k=min(max(1, top_k), 5),
        )
        if not results:
            return [{"message": f"No similar {entity_type}s found for ID {entity_id}."}]
        return results
    except Exception as e:
        logger.error("rag_get_similar failed: %s", e)
        return [{"error": f"Similar search failed: {str(e)}"}]
