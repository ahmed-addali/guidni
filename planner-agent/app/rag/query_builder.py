"""
Query builder — converts UserPreferences into rich natural language queries
for semantic search via BGE-M3. The richer the query, the better the
vector similarity ranking.

NOTE: Rentals and Transfers do NOT use semantic search — only pre-filtering.
"""

from app.schemas.requests import UserPreferences


# ── Descriptive maps ──────────────────────────────────────────

INTEREST_DESCRIPTIONS: dict[str, str] = {
    "adventures": "adventure outdoor extreme sports hiking climbing adrenaline",
    "water_sports": "water sports beach diving snorkeling surfing swimming jet ski sea",
    "culture": "culture history heritage traditional museum art religious architecture",
    "food_drink": "food gastronomy restaurant local cuisine tasting cooking culinary",
    "nature_wildlife": "nature wildlife animals eco hiking landscape birds garden",
    "attractions": "landmarks attractions famous iconic sightseeing photo viewpoint",
    "sightseeing": "sightseeing tours guided panoramic views excursion",
    "workshops": "workshops hands-on learning crafts pottery cooking art class",
    "wellness": "wellness spa relaxation luxury hammam massage yoga retreat",
    "shopping": "shopping souvenirs market souk artisan crafts local products",
    "family_friendly": "family kids children friendly safe playground all ages",
    "events": "events music festival entertainment nightlife concert live show",
    "trips": "day trip excursion boat island tour transport guided discovery",
}

BUDGET_DESCRIPTIONS = {
    1: "budget-friendly affordable cheap free low-cost",
    2: "mid-range good-value moderate reasonable",
    3: "luxury premium high-end exclusive fine upscale",
}

GROUP_DESCRIPTIONS = {
    "solo": "solo traveler independent exploration personal",
    "couple": "couple romantic intimate date honeymoon special",
    "family": "family children kids safe playground fun educational",
    "friends": "group of friends fun social party lively adventure",
}

STYLE_DESCRIPTIONS = {
    "relaxed": "relaxed easy pace calm peaceful gentle slow",
    "balanced": "balanced mix activities and downtime variety moderate",
    "active": "active full schedule energetic non-stop dynamic adventure",
}

ACCOMMODATION_DESCRIPTIONS = {
    "hotel": "hotel full service amenities professional clean comfortable",
    "riad": "riad traditional local character authentic charming courtyard",
    "apartment": "apartment home comforts kitchen self-catering spacious private",
    "hostel": "hostel budget friendly social backpacker communal affordable",
}


# ── ACTIVITY query ────────────────────────────────────────────
# Semantic: title(ar,fr), description(ar,fr), features

def build_activity_query(prefs: UserPreferences) -> str:
    """Build a rich semantic query for activity search."""
    interest_text = " ".join(
        INTEREST_DESCRIPTIONS.get(i, i) for i in prefs.interests
    ) if prefs.interests else "tourism activities experiences"

    budget_text = BUDGET_DESCRIPTIONS.get(prefs.budget, "")
    group_text = GROUP_DESCRIPTIONS.get(prefs.group_type, "")
    style_text = STYLE_DESCRIPTIONS.get(prefs.travel_style, "")

    return (
        f"Activities and experiences: {interest_text}. "
        f"In {prefs.destination_name or prefs.destination_city}. "
        f"{budget_text} options. "
        f"For {group_text}. "
        f"{style_text} travel style."
    )


# ── ATTRACTION query ──────────────────────────────────────────
# Semantic: title(ar,fr), description(ar,fr), overview

def build_attraction_query(prefs: UserPreferences) -> str:
    """Build a semantic query for attraction search."""
    interest_text = " ".join(
        INTEREST_DESCRIPTIONS.get(i, i) for i in prefs.interests
    ) if prefs.interests else "landmarks sightseeing points of interest"

    return (
        f"Attractions and points of interest: {interest_text}. "
        f"In {prefs.destination_name or prefs.destination_city}. "
        f"Must-see places to visit."
    )


# ── RESTAURANT query ─────────────────────────────────────────
# Semantic: name(ar,fr), description(ar,fr)

def build_restaurant_query(prefs: UserPreferences, slot: str = "lunch") -> str:
    """Build a rich semantic query for restaurant search."""
    meal_text = "lunch daytime dining" if slot == "lunch" else "dinner evening dining"

    group_text = GROUP_DESCRIPTIONS.get(prefs.group_type, "")
    budget_text = BUDGET_DESCRIPTIONS.get(prefs.budget, "")

    # Interest-driven food preferences
    food_prefs = []
    if "food_drink" in prefs.interests:
        food_prefs.append("local gastronomy authentic cuisine traditional food")
    if "culture" in prefs.interests:
        food_prefs.append("traditional local cultural heritage cuisine")
    if "wellness" in prefs.interests:
        food_prefs.append("healthy organic fresh natural")
    food_text = " ".join(food_prefs) if food_prefs else "restaurant dining"

    return (
        f"Restaurant for {meal_text}: {food_text}. "
        f"In {prefs.destination_name or prefs.destination_city}. "
        f"{budget_text}. For {group_text}."
    )


# ── STAY query ────────────────────────────────────────────────
# Semantic: title(ar,fr), description(ar,fr)

def build_stay_query(prefs: UserPreferences) -> str:
    """Build a rich semantic query for accommodation search."""
    accom_text = ACCOMMODATION_DESCRIPTIONS.get(prefs.accommodation_type, "")
    budget_text = BUDGET_DESCRIPTIONS.get(prefs.budget, "")
    group_text = GROUP_DESCRIPTIONS.get(prefs.group_type, "")

    return (
        f"Accommodation stay: {accom_text}. "
        f"In {prefs.destination_name or prefs.destination_city}. "
        f"{budget_text}. For {group_text}."
    )


# ── RENTAL + TRANSFER: NO SEMANTIC SEARCH ────────────────────
# These use pre-filtering only. Dummy functions return empty strings.

def build_rental_query(prefs: UserPreferences) -> str:
    """Rentals use pre-filtering only — no semantic search."""
    return ""


def build_transfer_query(prefs: UserPreferences) -> str:
    """Transfers use pre-filtering only — no semantic search."""
    return ""
