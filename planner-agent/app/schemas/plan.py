"""Plan data structures (Pydantic models).

Defines the full structured plan format returned by the agent.
"""

from pydantic import BaseModel
from typing import Optional


class PlanSlot(BaseModel):
    """A single time slot in a day plan."""
    time: str  # "09:00"
    end_time: str  # "11:00"
    type: str  # "activity" | "meal" | "rest" | "stay_suggestion"
    activity_id: Optional[str] = None
    title: str
    description: str
    category: str = ""
    price: float = 0.0
    duration: int = 0  # minutes
    reason: str = ""  # "Je vous recommande X parce que..."
    image: Optional[str] = None
    bookable: bool = False


class DayPlan(BaseModel):
    """One day of the itinerary."""
    day_number: int
    date: str = ""  # ISO date string
    theme: str = ""  # "Romance & Relaxation"
    slots: list[PlanSlot] = []


class StaySuggestion(BaseModel):
    """Accommodation suggestion."""
    stay_id: str
    title: str
    price: float
    rating: float = 0.0
    image: Optional[str] = None
    reason: str = ""


class BudgetBreakdown(BaseModel):
    """Cost breakdown."""
    activities: float = 0.0
    accommodation: float = 0.0
    food: float = 0.0
    transport: float = 0.0
    total: float = 0.0


class FullPlan(BaseModel):
    """Complete multi-day travel plan."""
    days: list[DayPlan] = []
    summary: str = ""
    total_budget: float = 0.0
    stay_suggestions: list[StaySuggestion] = []
    tips: list[str] = []
    budget_breakdown: Optional[BudgetBreakdown] = None
