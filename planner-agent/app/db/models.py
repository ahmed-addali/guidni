"""SQLAlchemy models mirroring the Prisma schema.

READ-ONLY models: User, Activity, Images, Stay, Yummy, Review, Wishlist,
                  Preference, Pass, PassReservation, ActivityReservation, Attraction
WRITE models:     PlannerConversation, PlannerMessage, GeneratedPlan, ActivityIntelligence
"""

from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text,
    ForeignKey, JSON, Numeric, Index
)
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


# ============================================================
# READ-ONLY MODELS (mirror Prisma — agent reads, never writes)
# ============================================================

class User(Base):
    """Mirrors Prisma User model."""
    __tablename__ = "User"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=True)
    email = Column(String, unique=True, nullable=True)
    emailVerified = Column(DateTime, nullable=True)
    image = Column(String, nullable=True)
    password = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    role = Column(String, default="USER")
    isTwoFactorEnabled = Column(Boolean, default=False)
    bio = Column(String, nullable=True)
    address = Column(String, nullable=True)
    country = Column(String, nullable=True)
    city = Column(String, nullable=True)
    postalCode = Column(String, nullable=True)

    # Relationships
    activityReservations = relationship("ActivityReservation", back_populates="user", lazy="selectin")
    reviews = relationship("Review", back_populates="user", lazy="selectin")
    wishlists = relationship("Wishlist", back_populates="user", lazy="selectin")
    preference = relationship("Preference", back_populates="user", uselist=False, lazy="selectin")
    passReservations = relationship("PassReservation", back_populates="user", lazy="selectin")
    staysReservations = relationship("StaysReservation", back_populates="user", lazy="selectin")


class Activity(Base):
    """Mirrors Prisma Activity model."""
    __tablename__ = "Activity"

    id = Column(String, primary_key=True)
    slug = Column(String, unique=True)
    title = Column(String, nullable=False)
    arabicTitle = Column(String, nullable=True)
    description = Column(Text, nullable=False)
    arabicDescription = Column(Text, nullable=True)
    category = Column(String, nullable=False)
    price = Column(Integer, nullable=False)
    phone = Column(String, nullable=True)
    country = Column(String, nullable=False)
    region = Column(String, nullable=False)
    city = Column(String, nullable=True)
    address = Column(String, nullable=True)
    location = Column(String, nullable=True)
    note = Column(String, nullable=True)
    nbReviews = Column(Integer, default=0)
    duration = Column(String, nullable=True)
    includes = Column(Text, nullable=True)
    excludes = Column(Text, nullable=True)
    allowed = Column(Text, nullable=True)
    forbidden = Column(Text, nullable=True)
    cancelation = Column(Boolean, nullable=True)
    paynow = Column(Boolean, nullable=True)
    guide = Column(String, nullable=True)
    profileId = Column(String, nullable=False)
    capacity = Column(Integer, nullable=False)
    availableTimes = Column(String, nullable=False)
    featuredInHome = Column(Boolean, default=False)

    # Relationships
    images = relationship("Images", back_populates="activity", lazy="selectin")
    reservations = relationship("ActivityReservation", back_populates="activity", lazy="selectin")


class Images(Base):
    """Mirrors Prisma Images model."""
    __tablename__ = "Images"

    id = Column(String, primary_key=True)
    url = Column(String, nullable=False)
    alt = Column(String, default="")
    createdAt = Column(DateTime, default=datetime.utcnow)

    yummyId = Column(String, ForeignKey("Yummy.id"), nullable=True)
    activityId = Column(String, ForeignKey("Activity.id"), nullable=True)
    yummyMenuId = Column(String, ForeignKey("YummyMenu.id"), nullable=True)
    reviewId = Column(String, ForeignKey("Review.id"), nullable=True)
    attractionId = Column(String, ForeignKey("Attraction.id"), nullable=True)
    stayId = Column(String, ForeignKey("Stay.id"), nullable=True)
    feedbackId = Column(String, ForeignKey("feedback.id"), nullable=True)

    # Relationships
    activity = relationship("Activity", back_populates="images")
    yummy = relationship("Yummy", back_populates="images")
    stay = relationship("Stay", back_populates="images")


class Stay(Base):
    """Mirrors Prisma Stay model."""
    __tablename__ = "Stay"

    id = Column(String, primary_key=True)
    slug = Column(String, unique=True)
    featuredInHome = Column(Boolean, default=False)
    approvalStatus = Column(String, default="APPROVED")
    title = Column(String, nullable=False)
    arabicTitle = Column(String, nullable=True)
    description = Column(Text, nullable=False)
    arabicDescription = Column(Text, nullable=True)
    propertyType = Column(String, nullable=False)
    category = Column(String, nullable=False)
    videoTour = Column(String, nullable=True)
    price = Column(Integer, nullable=False)
    cleaningFee = Column(Integer, default=0)
    serviceFee = Column(Integer, default=0)
    securityDeposit = Column(Integer, default=0)
    weeklyDiscount = Column(Integer, default=0)
    monthlyDiscount = Column(Integer, default=0)
    guestCount = Column(Integer, default=1)
    bedroomCount = Column(Integer, default=1)
    bedCount = Column(Integer, default=1)
    bathroomCount = Column(Integer, default=1)
    maxChildren = Column(Integer, default=0)

    # Amenities
    hasWifi = Column(Boolean, default=False)
    hasKitchen = Column(Boolean, default=False)
    hasAirConditioning = Column(Boolean, default=False)
    hasHeating = Column(Boolean, default=False)
    hasPool = Column(Boolean, default=False)
    hasGarden = Column(Boolean, default=False)
    hasBalcony = Column(Boolean, default=False)
    hasParking = Column(Boolean, default=False)
    hasSecurity = Column(Boolean, default=False)
    hasConcierge = Column(Boolean, default=False)
    wheelchairAccessible = Column(Boolean, default=False)
    elevatorAvailable = Column(Boolean, default=False)

    # Rules
    checkInTime = Column(String, default="15:00")
    checkOutTime = Column(String, default="11:00")
    minStayNights = Column(Integer, default=1)
    maxStayNights = Column(Integer, nullable=True)
    isPetFriendly = Column(Boolean, default=False)
    isSmokeFree = Column(Boolean, default=True)
    cancelationPolicy = Column(String, default="FLEXIBLE")

    # Location
    country = Column(String, nullable=False)
    region = Column(String, nullable=False)
    city = Column(String, nullable=True)
    address = Column(String, nullable=True)
    neighborhood = Column(String, nullable=True)
    location = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    locationNotes = Column(Text, nullable=True)

    # Host
    profileId = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    hostName = Column(String, default="")
    hostLanguages = Column(String, nullable=True)

    # Stats
    viewCount = Column(Integer, default=0)
    nbReviews = Column(Integer, default=0)
    averageRating = Column(Float, default=0)
    lastBookedAt = Column(DateTime, nullable=True)
    bookingCount = Column(Integer, default=0)

    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    lastRenovated = Column(DateTime, nullable=True)

    # Relationships
    images = relationship("Images", back_populates="stay", lazy="selectin")
    reservations = relationship("StaysReservation", back_populates="stay", lazy="selectin")


class StaysReservation(Base):
    """Mirrors Prisma StaysReservation model."""
    __tablename__ = "StaysReservation"

    id = Column(String, primary_key=True)
    bookingNumber = Column(String, unique=True)
    status = Column(String, default="PENDING")
    checkIn = Column(DateTime, nullable=False)
    checkOut = Column(DateTime, nullable=False)
    nights = Column(Integer, nullable=False)
    adults = Column(Integer, default=1)
    children = Column(Integer, default=0)
    babies = Column(Integer, default=0)
    basePrice = Column(Numeric(10, 2), nullable=False)
    cleaningFee = Column(Numeric(10, 2), nullable=True)
    serviceFee = Column(Numeric(10, 2), nullable=True)
    taxes = Column(Numeric(10, 2), nullable=True)
    discount = Column(Numeric(10, 2), nullable=True)
    totalPrice = Column(Numeric(10, 2), nullable=False)
    currency = Column(String, default="TND")
    paymentStatus = Column(String, default="UNPAID")
    contactName = Column(String, nullable=False)
    contactEmail = Column(String, nullable=False)
    contactPhone = Column(String, nullable=True)
    specialRequests = Column(Text, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)

    userId = Column(String, ForeignKey("User.id"), nullable=False)
    stayId = Column(String, ForeignKey("Stay.id"), nullable=False)

    user = relationship("User", back_populates="staysReservations")
    stay = relationship("Stay", back_populates="reservations")


class Yummy(Base):
    """Mirrors Prisma Yummy model (restaurants/cafes)."""
    __tablename__ = "Yummy"

    id = Column(String, primary_key=True)
    slug = Column(String, unique=True)
    name = Column(String, nullable=False)
    arabicName = Column(String, nullable=True)
    description = Column(String, nullable=False)
    arabicDescription = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    type = Column(String, nullable=False)  # RESTAURANT, CAFEE_SHOP, BOTH
    category = Column(String, nullable=True)
    meals = Column(String, nullable=True)
    country = Column(String, nullable=False)
    city = Column(String, nullable=False)
    address = Column(String, nullable=True)
    location = Column(String, nullable=True)
    logo = Column(String, nullable=True)
    coverPhoto = Column(String, nullable=True)
    website = Column(String, nullable=True)
    instagram = Column(String, nullable=True)
    facebook = Column(String, nullable=True)
    pdfMenu = Column(String, nullable=True)
    note = Column(String, nullable=True)
    nbReviews = Column(Integer, default=0)
    reservationsEnabled = Column(Boolean, nullable=False)
    maxGuests = Column(Integer, nullable=True)
    tables = Column(Integer, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    featuredInHome = Column(Boolean, default=False)
    profileId = Column(String, nullable=False)

    # Relationships
    images = relationship("Images", back_populates="yummy", lazy="selectin")
    hours = relationship("YummyHours", back_populates="yummy", lazy="selectin")
    menu = relationship("YummyMenu", back_populates="yummy", lazy="selectin")


class YummyHours(Base):
    """Mirrors Prisma YummyHours model."""
    __tablename__ = "YummyHours"

    id = Column(String, primary_key=True)
    day = Column(String, nullable=False)
    opening = Column(String, nullable=True)
    closing = Column(String, nullable=True)
    isClosed = Column(Boolean, default=False)
    isFullDayOpening = Column(Boolean, default=False)
    yummyId = Column(String, ForeignKey("Yummy.id"), nullable=False)

    yummy = relationship("Yummy", back_populates="hours")


class YummyMenu(Base):
    """Mirrors Prisma YummyMenu model."""
    __tablename__ = "YummyMenu"

    id = Column(String, primary_key=True)
    yummyId = Column(String, ForeignKey("Yummy.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    price = Column(Integer, nullable=False)
    visible = Column(Boolean, default=True)
    category = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)

    yummy = relationship("Yummy", back_populates="menu")


class ActivityReservation(Base):
    """Mirrors Prisma ActivityReservation model."""
    __tablename__ = "ActivityReservation"

    id = Column(String, primary_key=True)
    userId = Column(String, ForeignKey("User.id"), nullable=False)
    activityId = Column(String, ForeignKey("Activity.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    time = Column(String, nullable=False)
    adults = Column(Integer, nullable=False)
    children = Column(Integer, nullable=False)
    totalPrice = Column(Numeric, nullable=False)
    status = Column(String, default="PENDING")
    paymentOption = Column(String, default="LATER")
    paymentMethod = Column(String, default="KONNECT")
    paymentStatus = Column(String, default="UNPAID")
    notes = Column(String, nullable=True)
    language = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    passId = Column(String, nullable=True)
    typeInPass = Column(String, nullable=True)

    user = relationship("User", back_populates="activityReservations")
    activity = relationship("Activity", back_populates="reservations")


class Review(Base):
    """Mirrors Prisma Review model."""
    __tablename__ = "Review"

    id = Column(String, primary_key=True)
    userName = Column(String, nullable=False)
    title = Column(String, nullable=True)
    rating = Column(Integer, nullable=False)
    comment = Column(String, nullable=True)
    response = Column(String, nullable=True)
    responseDate = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    userId = Column(String, ForeignKey("User.id"), nullable=False)
    relationId = Column(String, nullable=False)
    relationType = Column(String, nullable=False)  # YUMMY, ACTIVITY, STAY, BUSINESS_PROFILE

    user = relationship("User", back_populates="reviews")


class Wishlist(Base):
    """Mirrors Prisma Wishlist model."""
    __tablename__ = "Wishlist"

    id = Column(String, primary_key=True)
    userId = Column(String, ForeignKey("User.id"), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    relationId = Column(String, nullable=False)
    relationType = Column(String, nullable=False)  # YUMMY, ACTIVITY, STAY

    user = relationship("User", back_populates="wishlists")


class Preference(Base):
    """Mirrors Prisma Preference model."""
    __tablename__ = "Preference"

    id = Column(String, primary_key=True)
    userId = Column(String, ForeignKey("User.id"), unique=True, nullable=False)
    currency = Column(String, default="TND")
    language = Column(String, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="preference")


class Pass(Base):
    """Mirrors Prisma Pass model."""
    __tablename__ = "passes"

    id = Column(String, primary_key=True)
    passKey = Column(String, unique=True)
    price = Column(Integer, default=0)
    discount = Column(Integer, default=0)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)


class PassReservation(Base):
    """Mirrors Prisma PassReservation model."""
    __tablename__ = "PassReservation"

    id = Column(String, primary_key=True)
    userId = Column(String, ForeignKey("User.id"), nullable=False)
    # NOTE: "pass" column stores the pass key string, not a FK
    pass_key = Column("pass", String, nullable=False)
    date = Column(DateTime, nullable=False)
    participants = Column(Integer, nullable=False)
    totalPrice = Column(Numeric, nullable=False)
    status = Column(String, default="PENDING")
    paymentOption = Column(String, default="LATER")
    paymentMethod = Column(String, default="KONNECT")
    paymentStatus = Column(String, default="UNPAID")
    notes = Column(String, nullable=True)
    language = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    expiresAt = Column(DateTime, nullable=False)

    user = relationship("User", back_populates="passReservations")


class Attraction(Base):
    """Mirrors Prisma Attraction model."""
    __tablename__ = "Attraction"

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    slug = Column(String, unique=True)
    description = Column(String, nullable=False)
    overview = Column(String, nullable=True)
    location = Column(String, nullable=False)
    hours = Column(String, nullable=True)
    fees = Column(String, nullable=True)
    coordinates = Column(JSON, nullable=True)
    category = Column(String, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)


# ============================================================
# WRITE MODELS (new tables — the agent creates and manages)
# ============================================================

class PlannerConversation(Base):
    """Agent conversation tracking."""
    __tablename__ = "PlannerConversation"

    id = Column(String, primary_key=True)
    userId = Column(String, ForeignKey("User.id"), nullable=False)
    title = Column(String, nullable=True)
    contextSummary = Column(JSON, nullable=True)
    isActive = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)

    messages = relationship("PlannerMessage", back_populates="conversation", lazy="selectin")
    plans = relationship("GeneratedPlan", back_populates="conversation", lazy="selectin")


class PlannerMessage(Base):
    """Individual messages in a planner conversation."""
    __tablename__ = "PlannerMessage"

    id = Column(String, primary_key=True)
    conversationId = Column(String, ForeignKey("PlannerConversation.id"), nullable=False)
    role = Column(String, nullable=False)  # "user" | "assistant" | "system"
    content = Column(Text, nullable=False)
    messageType = Column(String, default="text")  # "text" | "plan" | "question"
    meta_data = Column("metadata", JSON, nullable=True)  # thinking_steps, tool results, etc.
    createdAt = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("PlannerConversation", back_populates="messages")


class GeneratedPlan(Base):
    """Generated travel plans."""
    __tablename__ = "GeneratedPlan"

    id = Column(String, primary_key=True)
    conversationId = Column(String, ForeignKey("PlannerConversation.id"), nullable=False)
    userId = Column(String, ForeignKey("User.id"), nullable=False)
    planData = Column(JSON, nullable=False)
    version = Column(Integer, default=1)
    isActive = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("PlannerConversation", back_populates="plans")


class ActivityIntelligence(Base):
    """Cached AI enrichment data for activities."""
    __tablename__ = "ActivityIntelligence"

    id = Column(String, primary_key=True)
    activityId = Column(String, ForeignKey("Activity.id"), unique=True, nullable=False)
    enrichmentData = Column(JSON, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
