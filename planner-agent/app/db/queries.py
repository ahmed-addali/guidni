"""Database query functions — all data access for the agent.

Read-only queries for existing Prisma tables.
Write queries for the agent's own tables (PlannerConversation, etc.).
"""

import uuid
from datetime import datetime, date
from typing import Optional
from sqlalchemy import select, func, and_, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import (
    User, Activity, Images, Stay, Restaurant, RestaurantHours, RestaurantMenu,
    ActivityReservation, StaysReservation, RestaurantReservation, Review, Wishlist, Preference,
    Pass, PassReservation, Attraction,
    PlannerConversation, PlannerMessage, GeneratedPlan, ActivityIntelligence,
)


# =========================================
# USER QUERIES
# =========================================

async def get_user(session: AsyncSession, user_id: str) -> dict | None:
    """Get user info by ID."""
    result = await session.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        return None
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "country": user.country,
        "city": user.city,
        "phone": user.phone,
        "bio": user.bio,
    }


async def get_user_bookings(session: AsyncSession, user_id: str, limit: int = 30) -> list[dict]:
    """Get user's past activity reservations with activity data."""
    result = await session.execute(
        select(ActivityReservation)
        .options(selectinload(ActivityReservation.activity))
        .where(ActivityReservation.userId == user_id)
        .order_by(ActivityReservation.createdAt.desc())
        .limit(limit)
    )
    reservations = result.scalars().all()
    return [
        {
            "id": r.id,
            "date": r.date.isoformat() if r.date else None,
            "time": r.time,
            "adults": r.adults,
            "children": r.children,
            "totalPrice": float(r.totalPrice) if r.totalPrice else 0,
            "status": r.status,
            "activity": {
                "id": r.activity.id,
                "title": r.activity.title,
                "category": r.activity.category,
                "price": r.activity.price,
                "region": r.activity.region,
            } if r.activity else None,
        }
        for r in reservations
    ]


async def get_user_reviews(session: AsyncSession, user_id: str, limit: int = 30) -> list[dict]:
    """Get user's reviews with ratings."""
    result = await session.execute(
        select(Review)
        .where(Review.userId == user_id)
        .order_by(Review.createdAt.desc())
        .limit(limit)
    )
    reviews = result.scalars().all()
    return [
        {
            "id": r.id,
            "rating": r.rating,
            "comment": r.comment,
            "relationId": r.relationId,
            "relationType": r.relationType,
            "createdAt": r.createdAt.isoformat() if r.createdAt else None,
        }
        for r in reviews
    ]


async def get_user_wishlists(session: AsyncSession, user_id: str) -> list[dict]:
    """Get user's wishlist items."""
    result = await session.execute(
        select(Wishlist)
        .where(Wishlist.userId == user_id)
    )
    wishlists = result.scalars().all()

    items = []
    for w in wishlists:
        item = {
            "id": w.id,
            "relationId": w.relationId,
            "relationType": w.relationType,
        }
        # Fetch the related entity name
        if w.relationType == "ACTIVITY":
            act = await session.execute(select(Activity.title).where(Activity.id == w.relationId))
            row = act.scalar_one_or_none()
            item["title"] = row if row else "Unknown"
        elif w.relationType == "STAY":
            stay = await session.execute(select(Stay.title).where(Stay.id == w.relationId))
            row = stay.scalar_one_or_none()
            item["title"] = row if row else "Unknown"
        elif w.relationType == "RESTAURANT":
            restaurant = await session.execute(select(Restaurant.name).where(Restaurant.id == w.relationId))
            row = restaurant.scalar_one_or_none()
            item["title"] = row if row else "Unknown"
        items.append(item)

    return items


async def get_user_preference(session: AsyncSession, user_id: str) -> dict | None:
    """Get user preferences (currency, language)."""
    result = await session.execute(
        select(Preference).where(Preference.userId == user_id)
    )
    pref = result.scalar_one_or_none()
    if not pref:
        return None
    return {
        "currency": pref.currency,
        "language": pref.language,
    }


# =========================================
# ACTIVITY QUERIES
# =========================================

async def get_activities_by_region(
    session: AsyncSession,
    region: str,
    category: str | None = None,
    max_price: int | None = None,
) -> list[dict]:
    """Get activities in a region with optional filters."""
    query = select(Activity).options(selectinload(Activity.images))

    conditions = [Activity.region.ilike(f"%{region}%")]
    if category:
        conditions.append(Activity.category.ilike(f"%{category}%"))
    if max_price is not None:
        conditions.append(Activity.price <= max_price)

    query = query.where(and_(*conditions))
    result = await session.execute(query)
    activities = result.scalars().all()

    return [
        {
            "id": a.id,
            "title": a.title,
            "description": a.description[:200] + "..." if len(a.description) > 200 else a.description,
            "category": a.category,
            "price": a.price,
            "region": a.region,
            "city": a.city,
            "duration": a.duration,
            "capacity": a.capacity,
            "availableTimes": a.availableTimes,
            "note": a.note,
            "nbReviews": a.nbReviews,
            "images": [{"url": img.url, "alt": img.alt} for img in (a.images or [])[:3]],
        }
        for a in activities
    ]


async def get_activity_details(session: AsyncSession, activity_id: str) -> dict | None:
    """Get full details of a specific activity."""
    result = await session.execute(
        select(Activity)
        .options(selectinload(Activity.images))
        .where(Activity.id == activity_id)
    )
    a = result.scalar_one_or_none()
    if not a:
        return None
    return {
        "id": a.id,
        "title": a.title,
        "description": a.description,
        "category": a.category,
        "price": a.price,
        "region": a.region,
        "city": a.city,
        "address": a.address,
        "location": a.location,
        "duration": a.duration,
        "capacity": a.capacity,
        "availableTimes": a.availableTimes,
        "includes": a.includes,
        "excludes": a.excludes,
        "allowed": a.allowed,
        "forbidden": a.forbidden,
        "cancelation": a.cancelation,
        "guide": a.guide,
        "note": a.note,
        "nbReviews": a.nbReviews,
        "images": [{"url": img.url, "alt": img.alt} for img in (a.images or [])],
    }


# =========================================
# ACTIVITY INTELLIGENCE (ENRICHMENT CACHE)
# =========================================

async def get_activity_intelligence(session: AsyncSession, activity_id: str) -> dict | None:
    """Get cached AI enrichment for an activity."""
    result = await session.execute(
        select(ActivityIntelligence).where(ActivityIntelligence.activityId == activity_id)
    )
    intel = result.scalar_one_or_none()
    if not intel:
        return None
    return intel.enrichmentData


async def save_activity_intelligence(
    session: AsyncSession,
    activity_id: str,
    data: dict,
) -> None:
    """Upsert AI enrichment data for an activity."""
    existing = await session.execute(
        select(ActivityIntelligence).where(ActivityIntelligence.activityId == activity_id)
    )
    intel = existing.scalar_one_or_none()

    if intel:
        intel.enrichmentData = data
        intel.updatedAt = datetime.utcnow()
    else:
        intel = ActivityIntelligence(
            id=str(uuid.uuid4()),
            activityId=activity_id,
            enrichmentData=data,
        )
        session.add(intel)

    await session.commit()


# =========================================
# STAY QUERIES
# =========================================

async def get_stays_by_region(
    session: AsyncSession,
    region: str,
    max_price: int | None = None,
    min_rating: float | None = None,
    limit: int = 5,
) -> list[dict]:
    """Get top stays in a region."""
    query = select(Stay).options(selectinload(Stay.images))

    conditions = [
        Stay.region.ilike(f"%{region}%"),
        Stay.approvalStatus == "APPROVED",
    ]
    if max_price is not None:
        conditions.append(Stay.price <= max_price)
    if min_rating is not None:
        conditions.append(Stay.averageRating >= min_rating)

    query = query.where(and_(*conditions)).order_by(Stay.averageRating.desc()).limit(limit)
    result = await session.execute(query)
    stays = result.scalars().all()

    return [
        {
            "id": s.id,
            "title": s.title,
            "description": s.description[:200] + "..." if len(s.description) > 200 else s.description,
            "propertyType": s.propertyType,
            "price": s.price,
            "region": s.region,
            "city": s.city,
            "averageRating": s.averageRating,
            "nbReviews": s.nbReviews,
            "guestCount": s.guestCount,
            "bedroomCount": s.bedroomCount,
            "hasPool": s.hasPool,
            "hasWifi": s.hasWifi,
            "hasParking": s.hasParking,
            "images": [{"url": img.url, "alt": img.alt} for img in (s.images or [])[:3]],
        }
        for s in stays
    ]


# =========================================
# RESTAURANT QUERIES
# =========================================

async def get_restaurants_by_region(
    session: AsyncSession,
    region: str | None = None,
    cuisine_type: str | None = None,
    limit: int = 10,
) -> list[dict]:
    """Get restaurants in a region."""
    query = select(Restaurant).options(
        selectinload(Restaurant.images),
        selectinload(Restaurant.hours),
    )

    conditions = []
    if region:
        # Match using city (similar to the legacy yummy implementation)
        conditions.append(Restaurant.city.ilike(f"%{region}%"))
    if cuisine_type:
        conditions.append(Restaurant.category.ilike(f"%{cuisine_type}%"))

    if conditions:
        query = query.where(and_(*conditions))

    query = query.limit(limit)
    result = await session.execute(query)
    restaurants = result.scalars().all()

    return [
        {
            "id": r.id,
            "name": r.name,
            "description": r.description[:200] + "..." if len(r.description) > 200 else r.description,
            "type": r.type,
            "category": r.category,
            "city": r.city,
            "phone": r.phone,
            "note": r.note,
            "nbReviews": r.nbReviews,
            "reservationsEnabled": r.reservationsEnabled,
            "hours": [
                {"day": h.day, "opening": h.opening, "closing": h.closing, "isClosed": h.isClosed}
                for h in (r.hours or [])
            ],
            "images": [{"url": img.url, "alt": img.alt} for img in (r.images or [])[:3]],
        }
        for r in restaurants
    ]


# =========================================
# AVAILABILITY QUERIES
# =========================================

async def check_activity_availability(
    session: AsyncSession,
    activity_id: str,
    check_date: date,
) -> dict:
    """Check if an activity has available spots on a specific date."""
    # Get activity capacity
    act_result = await session.execute(
        select(Activity.capacity).where(Activity.id == activity_id)
    )
    capacity = act_result.scalar_one_or_none()
    if capacity is None:
        return {"available": False, "error": "Activity not found"}

    # Count reservations for that date (non-cancelled)
    count_result = await session.execute(
        select(func.count(ActivityReservation.id))
        .where(
            and_(
                ActivityReservation.activityId == activity_id,
                func.date(ActivityReservation.date) == check_date,
                ActivityReservation.status != "CANCELLED",
            )
        )
    )
    booked = count_result.scalar() or 0

    spots_left = max(0, capacity - booked)
    return {
        "available": spots_left > 0,
        "spots_left": spots_left,
        "total_capacity": capacity,
        "booked": booked,
    }


# =========================================
# CONVERSATION QUERIES
# =========================================

async def create_conversation(session: AsyncSession, user_id: str) -> str:
    """Create a new planner conversation."""
    conv_id = str(uuid.uuid4())
    conv = PlannerConversation(
        id=conv_id,
        userId=user_id,
    )
    session.add(conv)
    await session.commit()
    return conv_id


async def get_conversation(session: AsyncSession, conversation_id: str) -> dict | None:
    """Get conversation with messages."""
    result = await session.execute(
        select(PlannerConversation)
        .options(selectinload(PlannerConversation.messages))
        .where(PlannerConversation.id == conversation_id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        return None
    return {
        "id": conv.id,
        "userId": conv.userId,
        "title": conv.title,
        "contextSummary": conv.contextSummary,
        "isActive": conv.isActive,
        "createdAt": conv.createdAt.isoformat() if conv.createdAt else None,
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "messageType": m.messageType,
                "metadata": m.meta_data,
                "createdAt": m.createdAt.isoformat() if m.createdAt else None,
            }
            for m in sorted(conv.messages, key=lambda x: x.createdAt)
        ],
    }


async def get_conversations_by_user(session: AsyncSession, user_id: str) -> list[dict]:
    """List all conversations for a user."""
    result = await session.execute(
        select(PlannerConversation)
        .where(PlannerConversation.userId == user_id)
        .order_by(PlannerConversation.updatedAt.desc())
    )
    convs = result.scalars().all()
    return [
        {
            "id": c.id,
            "title": c.title,
            "isActive": c.isActive,
            "createdAt": c.createdAt.isoformat() if c.createdAt else None,
            "updatedAt": c.updatedAt.isoformat() if c.updatedAt else None,
        }
        for c in convs
    ]


async def add_message(
    session: AsyncSession,
    conversation_id: str,
    role: str,
    content: str,
    message_type: str = "text",
    metadata: dict | None = None,
) -> str:
    """Add a message to a conversation."""
    msg_id = str(uuid.uuid4())
    msg = PlannerMessage(
        id=msg_id,
        conversationId=conversation_id,
        role=role,
        content=content,
        messageType=message_type,
        meta_data=metadata,
    )
    session.add(msg)

    # Update conversation updatedAt
    conv_result = await session.execute(
        select(PlannerConversation).where(PlannerConversation.id == conversation_id)
    )
    conv = conv_result.scalar_one_or_none()
    if conv:
        conv.updatedAt = datetime.utcnow()

    await session.commit()
    return msg_id


async def save_plan(
    session: AsyncSession,
    conversation_id: str,
    user_id: str,
    plan_data: dict,
) -> str:
    """Save a generated plan to the database."""
    plan_id = str(uuid.uuid4())

    # Deactivate previous plans for this conversation
    existing = await session.execute(
        select(GeneratedPlan)
        .where(
            and_(
                GeneratedPlan.conversationId == conversation_id,
                GeneratedPlan.isActive == True,
            )
        )
    )
    for old_plan in existing.scalars().all():
        old_plan.isActive = False

    # Get version number
    version_result = await session.execute(
        select(func.count(GeneratedPlan.id))
        .where(GeneratedPlan.conversationId == conversation_id)
    )
    version = (version_result.scalar() or 0) + 1

    plan = GeneratedPlan(
        id=plan_id,
        conversationId=conversation_id,
        userId=user_id,
        planData=plan_data,
        version=version,
    )
    session.add(plan)
    await session.commit()
    return plan_id


async def get_current_plan(session: AsyncSession, conversation_id: str) -> dict | None:
    """Get the latest active plan for a conversation."""
    result = await session.execute(
        select(GeneratedPlan)
        .where(
            and_(
                GeneratedPlan.conversationId == conversation_id,
                GeneratedPlan.isActive == True,
            )
        )
        .order_by(GeneratedPlan.version.desc())
        .limit(1)
    )
    plan = result.scalar_one_or_none()
    if not plan:
        return None
    return {
        "id": plan.id,
        "planData": plan.planData,
        "version": plan.version,
        "createdAt": plan.createdAt.isoformat() if plan.createdAt else None,
    }


async def update_conversation_context(
    session: AsyncSession,
    conversation_id: str,
    context: dict,
) -> None:
    """Update conversation context summary."""
    result = await session.execute(
        select(PlannerConversation).where(PlannerConversation.id == conversation_id)
    )
    conv = result.scalar_one_or_none()
    if conv:
        conv.contextSummary = context
        conv.updatedAt = datetime.utcnow()
        await session.commit()


async def delete_conversation(session: AsyncSession, conversation_id: str) -> bool:
    """Archive (deactivate) a conversation."""
    result = await session.execute(
        select(PlannerConversation).where(PlannerConversation.id == conversation_id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        return False
    conv.isActive = False
    conv.updatedAt = datetime.utcnow()
    await session.commit()
    return True