"""User tools — get user profile, history, preferences.

Description for the agent:
"Get complete user profile including booking history, review patterns,
wishlist, and spending habits. Use this to understand user preferences."
"""

from langchain_core.tools import tool
from app.db.connection import async_session
from app.db import queries


@tool
async def get_user_profile(user_id: str) -> dict:
    """Get complete user profile including booking history, review patterns,
    wishlist items, and spending habits. Use this to understand user preferences
    before building a plan.

    Args:
        user_id: The user's unique ID
    """
    async with async_session() as session:
        user = await queries.get_user(session, user_id)
        if not user:
            return {"error": "User not found"}

        bookings = await queries.get_user_bookings(session, user_id, limit=30)
        reviews = await queries.get_user_reviews(session, user_id, limit=30)
        wishlists = await queries.get_user_wishlists(session, user_id)
        preference = await queries.get_user_preference(session, user_id)

    # Compute insights
    categories = {}
    total_spend = 0.0
    for b in bookings:
        if b.get("activity"):
            cat = b["activity"].get("category", "unknown")
            categories[cat] = categories.get(cat, 0) + 1
        total_spend += b.get("totalPrice", 0)

    avg_rating = 0.0
    if reviews:
        avg_rating = sum(r["rating"] for r in reviews) / len(reviews)

    return {
        "user": user,
        "preference": preference,
        "booking_count": len(bookings),
        "favorite_categories": sorted(categories.items(), key=lambda x: -x[1]),
        "average_spend": total_spend / max(len(bookings), 1),
        "total_spend": total_spend,
        "average_rating_given": round(avg_rating, 1),
        "review_count": len(reviews),
        "wishlist_items": wishlists,
        "recent_bookings": bookings[:5],
    }
