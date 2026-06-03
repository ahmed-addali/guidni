"""
UserPreferences — mirrors the TypeScript type from lib/planner/types.ts.
This is the input payload from the Next.js planner wizard.
"""

from pydantic import BaseModel, Field
from typing import Literal


InterestId = Literal[
    "adventures",
    "water_sports",
    "culture",
    "food_drink",
    "nature_wildlife",
    "attractions",
    "sightseeing",
    "workshops",
    "wellness",
    "shopping",
    "family_friendly",
    "events",
    "trips",
]

TravelStyle = Literal["relaxed", "balanced", "active"]
BudgetLevel = Literal[1, 2, 3]
GroupType = Literal["solo", "couple", "family", "friends"]
AccommodationType = Literal["hotel", "riad", "apartment", "hostel"]
RentalTypeEnum = Literal["car", "bike", "scooter"]


class UserPreferences(BaseModel):
    """Exact mirror of the TypeScript UserPreferences type."""

    destination_id: str = Field(..., alias="destinationId")
    destination_name: str = Field("", alias="destinationName")
    destination_city: str = Field("", alias="destinationCity")

    start_date: str | None = Field(None, alias="startDate")
    duration: int = Field(3, ge=1, le=14)

    travel_style: TravelStyle = Field("balanced", alias="travelStyle")
    budget: BudgetLevel = 2
    group_type: GroupType = Field("couple", alias="groupType")
    interests: list[InterestId] = []
    accommodation_type: AccommodationType = Field("hotel", alias="accommodationType")

    # Logistics
    needs_airport_pickup: bool = Field(False, alias="needsAirportPickup")
    needs_return_transfer: bool = Field(False, alias="needsReturnTransfer")
    needs_rental: bool = Field(False, alias="needsRental")
    rental_type: RentalTypeEnum | None = Field(None, alias="rentalType")

    model_config = {"populate_by_name": True}


class SearchRequest(BaseModel):
    """Request body for per-collection search endpoints."""

    preferences: UserPreferences
    slot: Literal["lunch", "evening"] | None = None  # restaurant-specific
    query: str | None = None  # optional free-text override
    limit: int = Field(20, ge=1, le=100)
    exclude_ids: list[str] = Field(default_factory=list)


class SwapRequest(BaseModel):
    """Request body for swap-alternatives endpoint."""

    preferences: UserPreferences
    item_type: Literal["ACTIVITY", "ATTRACTION", "RESTAURANT", "TRANSFER", "RENTAL", "STAY"]
    slot_type: Literal["morning", "lunch", "afternoon", "evening"]
    current_item_id: str
    existing_item_ids: list[str] = Field(default_factory=list)
    limit: int = Field(6, ge=1, le=20)


class SingleIngestRequest(BaseModel):
    """Request body for auto-trigger single-item re-ingestion."""

    item_type: Literal["activity", "stay", "restaurant", "transfer", "rental", "attraction"]
    item_id: str
    action: Literal["upsert", "delete"] = "upsert"
