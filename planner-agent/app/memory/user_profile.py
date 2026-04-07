"""User profile memory — persistent learned preferences.

Builds and updates a learned user profile over time based on:
- Booking patterns
- Review sentiments
- Conversation preferences
- Explicit stated preferences

This is separate from the conversation context — it persists
across conversations.
"""

import logging
from app.db.connection import async_session
from app.db import queries

logger = logging.getLogger(__name__)


async def build_user_profile(user_id: str) -> dict:
    """Build a comprehensive user profile from database data.

    Analyzes:
    - Booking history → favorite categories, spending patterns
    - Reviews → sentiment, what they value
    - Wishlists → what interests them
    - Preferences → language, currency
    """
    async with async_session() as session:
        user = await queries.get_user(session, user_id)
        if not user:
            return {"error": "User not found"}

        bookings = await queries.get_user_bookings(session, user_id, limit=50)
        reviews = await queries.get_user_reviews(session, user_id, limit=50)
        wishlists = await queries.get_user_wishlists(session, user_id)
        preference = await queries.get_user_preference(session, user_id)

    # Analyze booking patterns
    categories = {}
    regions = {}
    total_spend = 0.0
    booking_months = {}

    for b in bookings:
        if b.get("activity"):
            cat = b["activity"].get("category", "unknown")
            categories[cat] = categories.get(cat, 0) + 1
            reg = b["activity"].get("region", "unknown")
            regions[reg] = regions.get(reg, 0) + 1
        total_spend += b.get("totalPrice", 0)

        if b.get("date"):
            try:
                month = b["date"][:7]  # YYYY-MM
                booking_months[month] = booking_months.get(month, 0) + 1
            except (TypeError, IndexError):
                pass

    # Analyze review patterns
    avg_rating = 0.0
    high_rated_categories = []
    if reviews:
        avg_rating = sum(r["rating"] for r in reviews) / len(reviews)
        high_rated = [r for r in reviews if r["rating"] >= 4]
        # Note: we'd need to cross-reference with activities for categories

    # Determine travel style from data
    travel_style = "balanced"
    if categories:
        top_cats = sorted(categories.items(), key=lambda x: -x[1])
        active_cats = {"water sports", "adventure", "sports", "hiking"}
        calm_cats = {"spa", "beach", "relaxation", "cultural", "museum"}
        active_count = sum(c for cat, c in top_cats if cat.lower() in active_cats)
        calm_count = sum(c for cat, c in top_cats if cat.lower() in calm_cats)
        if active_count > calm_count * 2:
            travel_style = "active"
        elif calm_count > active_count * 2:
            travel_style = "relaxed"

    return {
        "user": user,
        "preference": preference,
        "stats": {
            "total_bookings": len(bookings),
            "total_spend": total_spend,
            "average_spend": total_spend / max(len(bookings), 1),
            "total_reviews": len(reviews),
            "average_rating_given": round(avg_rating, 1),
        },
        "patterns": {
            "favorite_categories": sorted(categories.items(), key=lambda x: -x[1])[:5],
            "preferred_regions": sorted(regions.items(), key=lambda x: -x[1])[:3],
            "travel_style": travel_style,
            "booking_frequency": len(booking_months),
        },
        "interests": {
            "wishlist_items": wishlists,
            "wishlist_count": len(wishlists),
        },
    }
