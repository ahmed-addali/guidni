"""Structured plan request schema.

Used by the /plan endpoint and auto-detected from /chat messages.
Separates trip parameters from the LLM so the backend can pre-process them.
"""

import re
from pydantic import BaseModel
from typing import Optional


# Budget ranges in TND per category
BUDGET_RANGES = {
    "budget": {"per_activity": 50, "per_meal": 15, "per_night": 100},
    "mid-range": {"per_activity": 150, "per_meal": 35, "per_night": 350},
    "luxury": {"per_activity": 300, "per_meal": 70, "per_night": 600},
}

# Map interest keywords to RAG semantic queries
INTEREST_TO_QUERY = {
    "adventures": "adventure outdoor exciting thrilling tours",
    "water_sports": "boat sea water diving snorkeling sailing catamaran jet ski",
    "nature_wildlife": "nature wildlife garden park animals camel horse ranch",
    "cultural": "museum heritage tradition historical souk medina mosque",
    "shopping": "market souk shopping artisan handcraft local products",
    "relaxation": "spa beach relax calm wellness thalasso hammam",
    "attractions": "sightseeing landmark monument attraction tourist",
    "food_drink": "food gastronomy wine tasting cooking class culinary",
    "nightlife": "nightlife bar club evening entertainment",
    "sports": "sport golf tennis cycling quad buggy",
    "family": "family kids children fun park amusement",
    "romantic": "romantic couple sunset dinner cruise private",
}

# Food cost estimates per meal (TND) — mirrors budget_tools.py
FOOD_COSTS = {
    "budget": {"breakfast": 5, "lunch": 15, "dinner": 20},
    "mid-range": {"breakfast": 10, "lunch": 25, "dinner": 35},
    "luxury": {"breakfast": 20, "lunch": 45, "dinner": 60},
}

# Transport estimates per day (TND)
TRANSPORT_COSTS = {
    "taxi": 30,
    "rental_car": 80,
    "public": 5,
}


class PlanRequest(BaseModel):
    """Structured plan generation request."""
    user_id: str
    conversation_id: Optional[str] = None
    model: Optional[str] = None

    # Trip parameters
    region: str = "Djerba"
    num_days: int = 3
    traveler_type: str = "solo"  # solo, couple, family, group

    # Preferences
    interests: list[str] = []
    budget_level: str = "mid-range"  # budget, mid-range, luxury
    accommodation_type: str = "hotel"  # hotel, vacationRental, hostel, resort

    # Optional overrides
    budget_total: Optional[int] = None
    start_date: Optional[str] = None  # YYYY-MM-DD
    special_requests: Optional[str] = None


def parse_chat_to_plan_request(message: str, user_id: str) -> Optional[PlanRequest]:
    """Try to parse a chat message into a structured PlanRequest.

    Detects messages like:
      "Plan a 7-day balanced trip in Djerba for a solo traveler.
       Preferences: interests in adventures, water_sports, ..."

    Returns PlanRequest if detected, None otherwise.
    """
    # Must look like a plan request
    if not re.search(r"plan\s+(?:a\s+)?\d+-day", message, re.I):
        return None

    # Extract number of days
    days_match = re.search(r"(\d+)-day", message, re.I)
    num_days = int(days_match.group(1)) if days_match else 3

    # Extract traveler type
    traveler_match = re.search(
        r"for\s+(?:a\s+)?(solo|couple|family|group)\s+traveler",
        message, re.I
    )
    traveler_type = traveler_match.group(1).lower() if traveler_match else "solo"

    # Extract region
    region_match = re.search(r"(?:trip\s+)?in\s+(\w+)", message, re.I)
    region = region_match.group(1) if region_match else "Djerba"

    # Extract interests from "interests in X, Y, Z" pattern
    interests = []
    interests_match = re.search(
        r"interests?\s+in\s+([^,.]+(?:,\s*[^,.]+)*)",
        message, re.I
    )
    if interests_match:
        raw = interests_match.group(1)
        interests = [i.strip().lower() for i in raw.split(",")]

    # Extract budget level
    budget_level = "mid-range"
    if re.search(r"\bbudget\b", message, re.I) and not re.search(r"mid-range", message, re.I):
        budget_level = "budget"
    elif re.search(r"\bluxury\b|\bpremium\b|\bhigh.?end\b", message, re.I):
        budget_level = "luxury"
    elif re.search(r"\bmid-?range\b|\bmoderate\b", message, re.I):
        budget_level = "mid-range"

    # Extract accommodation type
    accommodation_type = "hotel"
    acc_match = re.search(
        r"(hotel|vacationRental|hostel|resort|villa|guesthouse)\s+accommodation",
        message, re.I
    )
    if acc_match:
        accommodation_type = acc_match.group(1)

    return PlanRequest(
        user_id=user_id,
        region=region,
        num_days=num_days,
        traveler_type=traveler_type,
        interests=interests,
        budget_level=budget_level,
        accommodation_type=accommodation_type,
    )
