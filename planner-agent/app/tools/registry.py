"""Tool registry — all tools available to the agent.

Each tool is a LangChain @tool decorated function.
The registry collects them all for binding to the LLM.
"""

from app.tools.user_tools import get_user_profile
from app.tools.activity_tools import search_activities, get_activity_details, enrich_activity
from app.tools.weather_tools import get_weather
from app.tools.geo_tools import get_distance, geocode_address
from app.tools.stay_tools import search_stays
from app.tools.restaurant_tools import search_restaurants
from app.tools.availability_tools import check_availability
from app.tools.budget_tools import estimate_daily_budget, estimate_trip_budget
from app.tools.plan_tools import create_plan_structure, modify_plan, save_plan_tool
from app.tools.communication_tools import ask_user
from app.tools.rag_tools import rag_search, rag_search_for_plan, rag_get_similar


def get_all_tools() -> list:
    """Return all tools for binding to the LLM."""
    return [
        get_user_profile,
        search_activities,
        get_activity_details,
        enrich_activity,
        get_weather,
        get_distance,
        geocode_address,
        search_stays,
        search_restaurants,
        check_availability,
        estimate_daily_budget,
        estimate_trip_budget,
        create_plan_structure,
        modify_plan,
        save_plan_tool,
        # RAG tools — semantic search
        rag_search,
        rag_search_for_plan,
        rag_get_similar,
    ]

