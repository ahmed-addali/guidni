"""
PlanItem and ScoredPlanItem — data models returned by the search/plan endpoints.
Mirrors the TypeScript PlanItem from lib/planner/types.ts.
"""

from pydantic import BaseModel, Field
from typing import Literal


PlanItemType = Literal["ACTIVITY", "ATTRACTION", "RESTAURANT", "TRANSFER", "RENTAL", "STAY"]


class RestaurantHoursSlim(BaseModel):
    day: str
    opening: str | None = None
    closing: str | None = None
    is_closed: bool = Field(False, alias="isClosed")
    is_full_day_opening: bool = Field(False, alias="isFullDayOpening")

    model_config = {"populate_by_name": True}


class PlanItem(BaseModel):
    """Universal plan item returned to the frontend."""

    id: str
    type: PlanItemType
    slug: str
    name: str
    arabic_name: str | None = Field(None, alias="arabicName")
    image_url: str | None = Field(None, alias="imageUrl")
    location: str | None = None
    price: int = 0
    price_label: str | None = Field(None, alias="priceLabel")
    duration_minutes: int | None = Field(None, alias="durationMinutes")
    intensity: Literal["low", "medium", "high"] | None = None
    tags: list[str] = Field(default_factory=list)
    ideal_time: Literal["morning", "afternoon", "evening", "any", "lunch"] | None = Field(
        None, alias="idealTime"
    )
    family_friendly: bool | None = Field(None, alias="familyFriendly")
    booking_url: str | None = Field(None, alias="bookingUrl")

    # Restaurant-specific
    meals: list[str] | None = None
    attributes: list[str] | None = None
    hours: list[RestaurantHoursSlim] | None = None

    # Transfer-specific
    transfer_type: str | None = Field(None, alias="transferType")
    capacity: int | None = None
    is_ac: bool | None = Field(None, alias="isAC")
    is_meet_greet: bool | None = Field(None, alias="isMeetGreet")
    is_child_seat: bool | None = Field(None, alias="isChildSeat")

    # Stay-specific
    property_type: str | None = Field(None, alias="propertyType")
    guest_count: int | None = Field(None, alias="guestCount")
    amenities: list[str] | None = None
    average_rating: float | None = Field(None, alias="averageRating")

    # Popularity
    nb_reviews: int | None = Field(None, alias="nbReviews")
    rating: float | None = None

    model_config = {"populate_by_name": True}


class ScoredPlanItem(PlanItem):
    """PlanItem with an attached relevance score from RAG + hybrid scoring."""

    score: float = 0.0
    rag_score: float = Field(0.0, alias="ragScore")
    domain_score: float = Field(0.0, alias="domainScore")


class PlannerData(BaseModel):
    """Full planner data returned from /api/plan/generate — all collections pre-ranked."""

    activities: list[ScoredPlanItem] = Field(default_factory=list)
    attractions: list[ScoredPlanItem] = Field(default_factory=list)
    restaurants: list[ScoredPlanItem] = Field(default_factory=list)
    transfers: list[ScoredPlanItem] = Field(default_factory=list)
    rentals: list[ScoredPlanItem] = Field(default_factory=list)
    matched_stay: ScoredPlanItem | None = Field(None, alias="matchedStay")

    model_config = {"populate_by_name": True}
