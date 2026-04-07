"""Test the tools — verify tool registration and basic functionality."""

import pytest
from app.tools.registry import get_all_tools
from app.tools.budget_tools import estimate_daily_budget, estimate_trip_budget
from app.tools.geo_tools import get_distance


def test_all_tools_registered():
    """Verify all tools are registered."""
    tools = get_all_tools()
    assert len(tools) == 19  # 16 original + 3 RAG tools

    tool_names = [t.name for t in tools]
    assert "get_user_profile" in tool_names
    assert "search_activities" in tool_names
    assert "get_weather" in tool_names
    assert "search_stays" in tool_names
    assert "search_restaurants" in tool_names
    assert "check_availability" in tool_names
    assert "estimate_daily_budget" in tool_names
    assert "estimate_trip_budget" in tool_names
    assert "create_plan_structure" in tool_names
    assert "ask_user" in tool_names
    # RAG tools
    assert "rag_search" in tool_names
    assert "rag_search_for_plan" in tool_names
    assert "rag_get_similar" in tool_names


def test_tools_have_descriptions():
    """Verify all tools have descriptions (needed for LLM to choose them)."""
    tools = get_all_tools()
    for tool in tools:
        assert tool.description, f"Tool {tool.name} has no description"
        assert len(tool.description) > 10, f"Tool {tool.name} description too short"


@pytest.mark.asyncio
async def test_distance_calculation():
    """Test Haversine distance (pure math, no DB needed)."""
    result = await get_distance.ainvoke({
        "lat1": 33.8076, "lon1": 10.8451,  # Djerba
        "lat2": 36.8065, "lon2": 10.1815,  # Tunis
    })
    assert "distance_km" in result
    assert result["distance_km"] > 300  # Djerba to Tunis ~340km
    assert result["distance_km"] < 400


@pytest.mark.asyncio
async def test_budget_estimation():
    """Test budget calculation (pure math, no DB needed)."""
    result = await estimate_daily_budget.ainvoke({
        "activities_cost": 100,
        "meals_count": 3,
        "transport_type": "taxi",
        "budget_level": "moderate",
    })
    assert "total" in result
    assert result["total"] > 100  # Should be activities + food + transport


@pytest.mark.asyncio
async def test_trip_budget():
    """Test full trip budget calculation."""
    result = await estimate_trip_budget.ainvoke({
        "days": 5,
        "activities_per_day_cost": 80,
        "stay_per_night": 120,
        "meals_per_day": 3,
        "transport_type": "taxi",
        "budget_level": "moderate",
    })
    assert "total_budget" in result
    assert "budget_breakdown" in result
    assert result["nights"] == 4  # 5 days = 4 nights
    assert result["total_budget"] > 0
