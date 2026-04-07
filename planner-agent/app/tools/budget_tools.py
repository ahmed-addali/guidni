"""Budget tools — cost estimation and calculation.

Tools:
- estimate_daily_budget: Calculate daily budget for activities + meals + transport
- estimate_trip_budget: Calculate total trip budget breakdown
"""

from langchain_core.tools import tool


# Food cost estimates per meal (TND)
FOOD_COSTS = {
    "budget": {"breakfast": 5, "lunch": 15, "dinner": 20},
    "moderate": {"breakfast": 10, "lunch": 25, "dinner": 35},
    "luxury": {"breakfast": 20, "lunch": 45, "dinner": 60},
}

# Transport estimates per day (TND)
TRANSPORT_COSTS = {
    "taxi": 30,  # Average daily taxi cost
    "rental_car": 80,  # Car rental per day
    "public": 5,  # Local buses
}


@tool
async def estimate_daily_budget(
    activities_cost: float,
    meals_count: int = 3,
    transport_type: str = "taxi",
    budget_level: str = "moderate",
) -> dict:
    """Calculate estimated daily budget for a set of activities, meals, and transport.

    Args:
        activities_cost: Total cost of activities for the day in TND
        meals_count: Number of meals (default 3: breakfast, lunch, dinner)
        transport_type: "taxi", "rental_car", or "public"
        budget_level: "budget", "moderate", or "luxury"
    """
    food_prices = FOOD_COSTS.get(budget_level, FOOD_COSTS["moderate"])
    transport_cost = TRANSPORT_COSTS.get(transport_type, TRANSPORT_COSTS["taxi"])

    # Calculate food cost
    food_cost = 0
    if meals_count >= 1:
        food_cost += food_prices["breakfast"]
    if meals_count >= 2:
        food_cost += food_prices["lunch"]
    if meals_count >= 3:
        food_cost += food_prices["dinner"]

    total = activities_cost + food_cost + transport_cost

    return {
        "activities_cost": activities_cost,
        "food_estimate": food_cost,
        "transport_estimate": transport_cost,
        "total": round(total, 2),
        "breakdown": {
            "activities": activities_cost,
            "food": food_cost,
            "transport": transport_cost,
        },
    }


@tool
async def estimate_trip_budget(
    days: int,
    activities_per_day_cost: float,
    stay_per_night: float,
    meals_per_day: int = 3,
    transport_type: str = "taxi",
    budget_level: str = "moderate",
) -> dict:
    """Calculate total trip budget estimation with full breakdown.

    Args:
        days: Number of days
        activities_per_day_cost: Average daily activity cost in TND
        stay_per_night: Accommodation cost per night in TND
        meals_per_day: Meals per day (default 3)
        transport_type: "taxi", "rental_car", or "public"
        budget_level: "budget", "moderate", or "luxury"
    """
    food_prices = FOOD_COSTS.get(budget_level, FOOD_COSTS["moderate"])
    transport_cost = TRANSPORT_COSTS.get(transport_type, TRANSPORT_COSTS["taxi"])

    total_activities = activities_per_day_cost * days
    total_accommodation = stay_per_night * (days - 1)  # nights = days - 1
    daily_food = sum(food_prices.values()) if meals_per_day >= 3 else food_prices.get("lunch", 25) * meals_per_day
    total_food = daily_food * days
    total_transport = transport_cost * days

    total = total_activities + total_accommodation + total_food + total_transport

    return {
        "days": days,
        "nights": days - 1,
        "total_budget": round(total, 2),
        "budget_breakdown": {
            "activities": round(total_activities, 2),
            "accommodation": round(total_accommodation, 2),
            "food": round(total_food, 2),
            "transport": round(total_transport, 2),
        },
        "daily_average": round(total / days, 2),
        "budget_level": budget_level,
    }
