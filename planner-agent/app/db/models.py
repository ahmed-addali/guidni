"""SQLAlchemy models mirroring the Prisma schema.

READ-ONLY models: User, Session, Account, Verification, Destination, BusinessProfile, 
                  Activity, Stay, Restaurant, Pass, Attraction, Plan, GuideProfile, 
                  Rental, Transfer, Shop, Product, AgentProfile, etc.
WRITE models:     PlannerConversation, PlannerMessage, GeneratedPlan, ActivityIntelligence
"""

import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Date, Text,
    ForeignKey, JSON, Numeric, Table, Enum, Index, UniqueConstraint
)
from sqlalchemy.orm import DeclarativeBase, relationship
from sqlalchemy.dialects.postgresql import ARRAY


class Base(DeclarativeBase):
    pass


# ============================================================
# ENUMS
# ============================================================
class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    USER = "USER"
    PARTNER = "PARTNER"
    AGENT = "AGENT"

class BookingStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"

class PaymentOption(str, enum.Enum):
    NOW = "NOW"
    LATER = "LATER"

class PaymentMethod(str, enum.Enum):
    INCLUDED_IN_PASS = "INCLUDED_IN_PASS"
    KONNECT = "KONNECT"
    PAYPAL = "PAYPAL"
    STRIPE = "STRIPE"
    CASH = "CASH"
    CREDIT_CARD = "CREDIT_CARD"

class PaymentStatus(str, enum.Enum):
    UNPAID = "UNPAID"
    PARTIAL = "PARTIAL"
    PAID = "PAID"
    REFUNDED = "REFUNDED"
    FAILED = "FAILED"

class CurrencyCode(str, enum.Enum):
    TND = "TND"
    EUR = "EUR"
    USD = "USD"

class RelationType(str, enum.Enum):
    RESTAURANT = "RESTAURANT"
    ACTIVITY = "ACTIVITY"
    STAY = "STAY"
    RENTAL = "RENTAL"
    TRANSFER = "TRANSFER"
    BUSINESS_PROFILE = "BUSINESS_PROFILE"
    SHOP = "SHOP"
    PRODUCT = "PRODUCT"
    GUIDE = "GUIDE"
    PLAN = "PLAN"

class PlanType(str, enum.Enum):
    USER_SAVED = "USER_SAVED"
    GUIDE_FREE = "GUIDE_FREE"
    GUIDE_PAID = "GUIDE_PAID"

class TransferType(str, enum.Enum):
    AIRPORT_TRANSFER = "AIRPORT_TRANSFER"
    TAXI = "TAXI"
    CHAUFFEUR = "CHAUFFEUR"
    SHUTTLE = "SHUTTLE"

class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    PROCESSING = "PROCESSING"
    SHIPPED = "SHIPPED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"
    REFUNDED = "REFUNDED"

class DeliveryMethod(str, enum.Enum):
    PICKUP = "PICKUP"
    LOCAL_DELIVERY = "LOCAL_DELIVERY"
    NATIONWIDE = "NATIONWIDE"
    INTERNATIONAL = "INTERNATIONAL"

class RentalType(str, enum.Enum):
    CAR = "CAR"
    BIKE = "BIKE"
    SCOOTER = "SCOOTER"
    BOAT = "BOAT"
    OTHER = "OTHER"

class RestaurantType(str, enum.Enum):
    RESTAURANT = "RESTAURANT"
    CAFEE_SHOP = "CAFEE_SHOP"
    BOTH = "BOTH"

class BadgeKey(str, enum.Enum):
    VERIFIED = "VERIFIED"
    GUEST_FAVORITE = "GUEST_FAVORITE"
    REVIEWED_BY_GUIDNI = "REVIEWED_BY_GUIDNI"
    OWNER_OPERATED = "OWNER_OPERATED"

class GuidniReviewStatus(str, enum.Enum):
    PENDING = "PENDING"
    SCHEDULED = "SCHEDULED"
    UNDER_REVIEW = "UNDER_REVIEW"
    PUBLISHED = "PUBLISHED"
    WITHDRAWN = "WITHDRAWN"

class PassActivityType(str, enum.Enum):
    FIXED = "FIXED"
    OPTIONAL = "OPTIONAL"

class AgentTier(str, enum.Enum):
    STARTER = "STARTER"
    PRO = "PRO"
    ELITE = "ELITE"

class InvitationStatus(str, enum.Enum):
    PENDING = "PENDING"
    OPENED = "OPENED"
    BOOKED = "BOOKED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"

class EarningStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    PAID = "PAID"
    CANCELLED = "CANCELLED"

class AgentPointType(str, enum.Enum):
    BOOKING_COMMISSION = "BOOKING_COMMISSION"
    REFERRAL_SIGNUP = "REFERRAL_SIGNUP"
    REFERRAL_VERIFIED = "REFERRAL_VERIFIED"
    REFERRAL_FIRST_LISTING = "REFERRAL_FIRST_LISTING"
    REFERRAL_FIRST_BOOKING = "REFERRAL_FIRST_BOOKING"
    TIER_BONUS = "TIER_BONUS"
    REDEMPTION = "REDEMPTION"

class AgentPointStatus(str, enum.Enum):
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"

class AgentReferralStatus(str, enum.Enum):
    PENDING = "PENDING"
    UNDER_REVIEW = "UNDER_REVIEW"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"

class RedemptionStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    PAID = "PAID"
    REJECTED = "REJECTED"


# ============================================================
# PRISMA IMPLICIT MANY-TO-MANY ASSOCIATION TABLES
# ============================================================
activity_attraction_m2m = Table(
    "_ActivityToAttraction",
    Base.metadata,
    Column("A", String, ForeignKey("Activity.id", ondelete="CASCADE"), primary_key=True),
    Column("B", String, ForeignKey("Attraction.id", ondelete="CASCADE"), primary_key=True)
)

pass_fixed_activities_m2m = Table(
    "_FixedActivities",
    Base.metadata,
    Column("A", String, ForeignKey("Activity.id", ondelete="CASCADE"), primary_key=True),
    Column("B", String, ForeignKey("passes.id", ondelete="CASCADE"), primary_key=True)
)

pass_optional_activities_m2m = Table(
    "_OptionalActivities",
    Base.metadata,
    Column("A", String, ForeignKey("Activity.id", ondelete="CASCADE"), primary_key=True),
    Column("B", String, ForeignKey("passes.id", ondelete="CASCADE"), primary_key=True)
)


# ============================================================
# READ-ONLY MODELS (mirror Prisma — agent reads, never writes)
# ============================================================

# ------------------------------------------------------------
# AUTHENTICATION & USERS
# ------------------------------------------------------------
class User(Base):
    __tablename__ = "User"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    emailVerified = Column(Boolean, nullable=False)
    image = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    role = Column(Enum(UserRole, name="user_role_enum", native_enum=False), default=UserRole.USER)
    phone = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    address = Column(String, nullable=True)
    country = Column(String, nullable=True)
    city = Column(String, nullable=True)
    postalCode = Column(String, nullable=True)

    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    accounts = relationship("Account", back_populates="user", cascade="all, delete-orphan")
    activityReservations = relationship("ActivityReservation", back_populates="user")
    passReservations = relationship("PassReservation", back_populates="user")
    business = relationship("BusinessProfile", back_populates="user", uselist=False)
    restaurantReservations = relationship("RestaurantReservation", back_populates="user")
    staysReservations = relationship("StaysReservation", back_populates="user")
    rentalReservations = relationship("RentalReservation", back_populates="user")
    transferReservations = relationship("TransferReservation", back_populates="user")
    reviews = relationship("Review", back_populates="user")
    feedbacks = relationship("Feedback", back_populates="user")
    wishlists = relationship("Wishlist", back_populates="user")
    preference = relationship("Preference", back_populates="user", uselist=False)
    plans = relationship("Plan", back_populates="user")
    productOrders = relationship("ProductOrder", back_populates="user")
    guideProfile = relationship("GuideProfile", back_populates="user", uselist=False)
    agentProfile = relationship("AgentProfile", back_populates="user", uselist=False)
    planPurchases = relationship("PlanPurchase", back_populates="user")


class Session(Base):
    __tablename__ = "Session"
    id = Column(String, primary_key=True)
    expiresAt = Column(DateTime, nullable=False)
    token = Column(String, unique=True, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    ipAddress = Column(String, nullable=True)
    userAgent = Column(String, nullable=True)
    
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    user = relationship("User", back_populates="sessions")


class Account(Base):
    __tablename__ = "Account"
    id = Column(String, primary_key=True)
    accountId = Column(String, nullable=False)
    providerId = Column(String, nullable=False)
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    accessToken = Column(Text, nullable=True)
    refreshToken = Column(Text, nullable=True)
    idToken = Column(Text, nullable=True)
    accessTokenExpiresAt = Column(DateTime, nullable=True)
    refreshTokenExpiresAt = Column(DateTime, nullable=True)
    scope = Column(String, nullable=True)
    password = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="accounts")


class Verification(Base):
    __tablename__ = "Verification"
    id = Column(String, primary_key=True)
    identifier = Column(String, nullable=False)
    value = Column(String, nullable=False)
    expiresAt = Column(DateTime, nullable=False)
    createdAt = Column(DateTime, nullable=True)
    updatedAt = Column(DateTime, nullable=True)


# ------------------------------------------------------------
# DESTINATIONS & BUSINESS
# ------------------------------------------------------------
class Destination(Base):
    __tablename__ = "Destination"
    __table_args__ = (
        Index('idx_destination_slug', 'slug'),
        Index('idx_destination_active', 'active'),
    )

    id = Column(String, primary_key=True)
    slug = Column(String, unique=True, nullable=False)
    country = Column(String, nullable=False)
    city = Column(String, nullable=False)
    region = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    arabicDescription = Column(Text, nullable=True)
    coverImage = Column(String, nullable=True)
    gallery = Column(ARRAY(String), default=list)
    active = Column(Boolean, default=True)
    featured = Column(Boolean, default=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    timezone = Column(String, nullable=True)

    activities = relationship("Activity", back_populates="destination")
    stays = relationship("Stay", back_populates="destination")
    restaurants = relationship("Restaurant", back_populates="destination")
    rentals = relationship("Rental", back_populates="destination")
    transfers = relationship("Transfer", back_populates="destination")
    passes = relationship("Pass", back_populates="destination")
    attractions = relationship("Attraction", back_populates="destination")
    businessProfiles = relationship("BusinessProfile", back_populates="destination")
    plans = relationship("Plan", back_populates="destination")
    shops = relationship("Shop", back_populates="destination")
    guides = relationship("GuideProfile", back_populates="destination")
    agents = relationship("AgentProfile", back_populates="destination")


class BusinessProfile(Base):
    __tablename__ = "BusinessProfile"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    categories = Column(ARRAY(String), default=list)
    country = Column(String, nullable=False)
    address = Column(String, nullable=True)
    region = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    registration = Column(Boolean, default=False)
    companyRN = Column(String, nullable=True)
    website = Column(String, nullable=True)
    instagram = Column(String, nullable=True)
    facebook = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    nbReviews = Column(Integer, default=0)
    averageRating = Column(Float, default=0)
    isSuperhost = Column(Boolean, default=False)
    superhostSince = Column(DateTime, nullable=True)
    isVerified = Column(Boolean, default=False)
    governmentId = Column(String, nullable=True)
    verifiedAt = Column(DateTime, nullable=True)
    type = Column(String, default="INDIVIDUAL")
    profileImage = Column(String, nullable=True)
    languages = Column(String, nullable=True)
    responseRate = Column(Integer, nullable=True)
    responseTime = Column(String, nullable=True)
    
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), unique=True, nullable=False)
    destinationId = Column(String, ForeignKey("Destination.id", ondelete="SET NULL"), nullable=True)

    user = relationship("User", back_populates="business")
    destination = relationship("Destination", back_populates="businessProfiles")
    activities = relationship("Activity", back_populates="businessProfile")
    stays = relationship("Stay", back_populates="businessProfile")
    restaurants = relationship("Restaurant", back_populates="businessProfile")
    rentals = relationship("Rental", back_populates="businessProfile")
    transfers = relationship("Transfer", back_populates="businessProfile")
    shops = relationship("Shop", back_populates="businessProfile")
    agentReferrals = relationship("AgentReferral", back_populates="businessProfile")


# ------------------------------------------------------------
# ACTIVITIES
# ------------------------------------------------------------
class Activity(Base):
    __tablename__ = "Activity"
    __table_args__ = (
        Index('idx_activity_slug', 'slug'),
        Index('idx_activity_dest_cat', 'destinationId', 'category'),
    )

    id = Column(String, primary_key=True)
    slug = Column(String, unique=True, nullable=False)
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
    capacity = Column(Integer, nullable=False)
    availableTimes = Column(String, nullable=False)
    featuredInHome = Column(Boolean, default=False)
    
    tags = Column(ARRAY(String), default=list)
    intensity = Column(String, nullable=True)
    durationMinutes = Column(Integer, nullable=True)
    bestTimeOfDay = Column(String, nullable=True)
    agentCommissionEnabled = Column(Boolean, default=False)
    agentCommissionRate = Column(Float, nullable=True)
    
    profileId = Column(String, ForeignKey("BusinessProfile.id", ondelete="CASCADE"), nullable=False)
    destinationId = Column(String, ForeignKey("Destination.id", ondelete="SET NULL"), nullable=True)

    businessProfile = relationship("BusinessProfile", back_populates="activities")
    destination = relationship("Destination", back_populates="activities")
    images = relationship("Images", back_populates="activity")
    reservations = relationship("ActivityReservation", back_populates="activity")
    attractions = relationship("Attraction", secondary=activity_attraction_m2m, back_populates="activities")
    fixedInPasses = relationship("Pass", secondary=pass_fixed_activities_m2m, back_populates="fixedActivities")
    optionalInPasses = relationship("Pass", secondary=pass_optional_activities_m2m, back_populates="optionalActivities")


class ActivityReservation(Base):
    __tablename__ = "ActivityReservation"
    __table_args__ = (
        Index('idx_actres_userid', 'userId'),
        Index('idx_actres_actid', 'activityId'),
        Index('idx_actres_status', 'status'),
    )

    id = Column(String, primary_key=True)
    bookingRef = Column(String, unique=True, nullable=False)
    date = Column(DateTime, nullable=False)
    time = Column(String, nullable=False)
    adults = Column(Integer, nullable=False)
    children = Column(Integer, nullable=False)
    totalPrice = Column(Numeric(10, 2), nullable=False)
    
    status = Column(Enum(BookingStatus, name="booking_status", native_enum=False), default=BookingStatus.PENDING)
    paymentOption = Column(Enum(PaymentOption, name="payment_option", native_enum=False), default=PaymentOption.LATER)
    paymentMethod = Column(Enum(PaymentMethod, name="payment_method", native_enum=False), default=PaymentMethod.KONNECT)
    paymentStatus = Column(Enum(PaymentStatus, name="payment_status", native_enum=False), default=PaymentStatus.UNPAID)
    
    notes = Column(Text, nullable=True)
    language = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    typeInPass = Column(Enum(PassActivityType, name="pass_activity_type", native_enum=False), nullable=True)

    agentId = Column(String, ForeignKey("AgentProfile.id", ondelete="SET NULL"), nullable=True)
    agentInvitationId = Column(String, ForeignKey("AgentInvitation.id", ondelete="SET NULL"), nullable=True)
    commissionRate = Column(Float, nullable=True)
    commissionAmount = Column(Numeric(10, 2), nullable=True)
    
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    activityId = Column(String, ForeignKey("Activity.id", ondelete="CASCADE"), nullable=False)
    passId = Column(String, ForeignKey("PassReservation.id", ondelete="CASCADE"), nullable=True)

    user = relationship("User", back_populates="activityReservations")
    activity = relationship("Activity", back_populates="reservations")
    passReservation = relationship("PassReservation", back_populates="activityReservations")
    agent = relationship("AgentProfile", back_populates="activityReservations")
    agentInvitation = relationship("AgentInvitation", back_populates="activityReservations")


# ------------------------------------------------------------
# STAYS
# ------------------------------------------------------------
class Stay(Base):
    __tablename__ = "Stay"
    __table_args__ = (
        Index('idx_stay_country', 'country'),
        Index('idx_stay_region', 'region'),
        Index('idx_stay_city', 'city'),
        Index('idx_stay_price', 'price'),
        Index('idx_stay_rating', 'averageRating'),
        Index('idx_stay_slug', 'slug'),
    )

    id = Column(String, primary_key=True)
    slug = Column(String, unique=True, nullable=False)
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
    
    checkInTime = Column(String, default="15:00")
    checkOutTime = Column(String, default="11:00")
    minStayNights = Column(Integer, default=1)
    maxStayNights = Column(Integer, nullable=True)
    isPetFriendly = Column(Boolean, default=False)
    isSmokeFree = Column(Boolean, default=True)
    cancelationPolicy = Column(String, default="FLEXIBLE")
    
    country = Column(String, nullable=False)
    region = Column(String, nullable=False)
    city = Column(String, nullable=True)
    address = Column(String, nullable=True)
    neighborhood = Column(String, nullable=True)
    location = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    locationNotes = Column(Text, nullable=True)
    
    phone = Column(String, nullable=True)
    hostName = Column(String, default="")
    hostLanguages = Column(String, nullable=True)
    viewCount = Column(Integer, default=0)
    nbReviews = Column(Integer, default=0)
    averageRating = Column(Float, default=0)
    lastBookedAt = Column(DateTime, nullable=True)
    bookingCount = Column(Integer, default=0)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    lastRenovated = Column(DateTime, nullable=True)
    
    profileId = Column(String, ForeignKey("BusinessProfile.id", ondelete="CASCADE"), nullable=False)
    destinationId = Column(String, ForeignKey("Destination.id", ondelete="SET NULL"), nullable=True)

    businessProfile = relationship("BusinessProfile", back_populates="stays")
    destination = relationship("Destination", back_populates="stays")
    images = relationship("Images", back_populates="stay")
    reservations = relationship("StaysReservation", back_populates="stay")


class StaysReservation(Base):
    __tablename__ = "StaysReservation"
    __table_args__ = (
        Index('idx_stayres_userid', 'userId'),
        Index('idx_stayres_stayid', 'stayId'),
        Index('idx_stayres_checkin', 'checkIn'),
        Index('idx_stayres_status', 'status'),
    )

    id = Column(String, primary_key=True)
    bookingRef = Column(String, unique=True, nullable=False)
    status = Column(Enum(BookingStatus, name="booking_status", native_enum=False), default=BookingStatus.PENDING)
    checkIn = Column(Date, nullable=False)
    checkOut = Column(Date, nullable=False)
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
    
    currency = Column(Enum(CurrencyCode, name="currency_code", native_enum=False), default=CurrencyCode.TND)
    paymentStatus = Column(Enum(PaymentStatus, name="payment_status", native_enum=False), default=PaymentStatus.UNPAID)
    paymentOption = Column(Enum(PaymentOption, name="payment_option", native_enum=False), nullable=True)
    paymentMethod = Column(Enum(PaymentMethod, name="payment_method", native_enum=False), nullable=True)
    
    transactionId = Column(String, nullable=True)
    paidAmount = Column(Numeric(10, 2), nullable=True)
    refundAmount = Column(Numeric(10, 2), nullable=True)
    specialRequests = Column(Text, nullable=True)
    cancellationReason = Column(Text, nullable=True)
    hostNotes = Column(Text, nullable=True)
    contactName = Column(String, nullable=False)
    contactEmail = Column(String, nullable=False)
    contactPhone = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    confirmedAt = Column(DateTime, nullable=True)
    cancelledAt = Column(DateTime, nullable=True)
    
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    stayId = Column(String, ForeignKey("Stay.id", ondelete="CASCADE"), nullable=False)
    couponId = Column(String, ForeignKey("Coupon.id"), nullable=True)

    user = relationship("User", back_populates="staysReservations")
    stay = relationship("Stay", back_populates="reservations")
    coupon = relationship("Coupon", back_populates="reservations")


class Coupon(Base):
    __tablename__ = "Coupon"
    id = Column(String, primary_key=True)
    code = Column(String, unique=True, nullable=False)
    discount = Column(Integer, nullable=False)
    validUntil = Column(DateTime, nullable=False)
    reservations = relationship("StaysReservation", back_populates="coupon")


# ------------------------------------------------------------
# RESTAURANTS
# ------------------------------------------------------------
class Restaurant(Base):
    __tablename__ = "Restaurant"
    __table_args__ = (
        Index('idx_rest_slug', 'slug'),
        Index('idx_rest_dest_type', 'destinationId', 'type'),
    )

    id = Column(String, primary_key=True)
    slug = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    arabicName = Column(String, nullable=True)
    description = Column(Text, nullable=False)
    arabicDescription = Column(Text, nullable=True)
    phone = Column(String, nullable=True)
    type = Column(Enum(RestaurantType, name="restaurant_type", native_enum=False), nullable=False)
    category = Column(String, nullable=True)
    meals = Column(String, nullable=True)
    foodTypes = Column(ARRAY(String), default=list)
    dietTypes = Column(ARRAY(String), default=list)
    attributes = Column(ARRAY(String), default=list)
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
    featuredInHome = Column(Boolean, default=False)
    createdAt = Column(DateTime, default=datetime.utcnow)

    profileId = Column(String, ForeignKey("BusinessProfile.id", ondelete="CASCADE"), nullable=False)
    destinationId = Column(String, ForeignKey("Destination.id", ondelete="SET NULL"), nullable=True)

    businessProfile = relationship("BusinessProfile", back_populates="restaurants")
    destination = relationship("Destination", back_populates="restaurants")
    images = relationship("Images", back_populates="restaurant")
    menu = relationship("RestaurantMenu", back_populates="restaurant")
    hours = relationship("RestaurantHours", back_populates="restaurant")
    reservations = relationship("RestaurantReservation", back_populates="restaurant")


class RestaurantMenu(Base):
    __tablename__ = "RestaurantMenu"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    price = Column(Integer, nullable=False)
    visible = Column(Boolean, default=True)
    category = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    
    restaurantId = Column(String, ForeignKey("Restaurant.id", ondelete="CASCADE"), nullable=False)
    
    restaurant = relationship("Restaurant", back_populates="menu")
    images = relationship("Images", back_populates="restaurantMenu")


class RestaurantHours(Base):
    __tablename__ = "RestaurantHours"
    id = Column(String, primary_key=True)
    day = Column(String, nullable=False)
    opening = Column(String, nullable=True)
    closing = Column(String, nullable=True)
    isClosed = Column(Boolean, default=False)
    isFullDayOpening = Column(Boolean, default=False)
    
    restaurantId = Column(String, ForeignKey("Restaurant.id", ondelete="CASCADE"), nullable=False)
    restaurant = relationship("Restaurant", back_populates="hours")


class RestaurantReservation(Base):
    __tablename__ = "RestaurantReservation"

    id = Column(String, primary_key=True)
    bookingRef = Column(String, unique=True, nullable=False)
    date = Column(DateTime, nullable=False)
    time = Column(String, nullable=False)
    guests = Column(Integer, default=2)
    status = Column(Enum(BookingStatus, name="booking_status", native_enum=False), default=BookingStatus.PENDING)
    notes = Column(Text, nullable=True)
    guestName = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    price = Column(Integer, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    restaurantId = Column(String, ForeignKey("Restaurant.id", ondelete="CASCADE"), nullable=False)
    
    user = relationship("User", back_populates="restaurantReservations")
    restaurant = relationship("Restaurant", back_populates="reservations")


# ------------------------------------------------------------
# PASSES
# ------------------------------------------------------------
class Pass(Base):
    __tablename__ = "passes"

    id = Column(String, primary_key=True)
    passKey = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    arabicName = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    arabicDescription = Column(Text, nullable=True)
    price = Column(Integer, default=0)
    discount = Column(Integer, default=0)
    popular = Column(Boolean, default=False)
    optionalCount = Column(Integer, default=1)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    
    destinationId = Column(String, ForeignKey("Destination.id", ondelete="SET NULL"), nullable=True)

    destination = relationship("Destination", back_populates="passes")
    reservations = relationship("PassReservation", back_populates="pass_")
    fixedActivities = relationship("Activity", secondary=pass_fixed_activities_m2m, back_populates="fixedInPasses")
    optionalActivities = relationship("Activity", secondary=pass_optional_activities_m2m, back_populates="optionalInPasses")


class PassReservation(Base):
    __tablename__ = "PassReservation"
    __table_args__ = (
        Index('idx_passres_userid', 'userId'),
        Index('idx_passres_status', 'status'),
    )

    id = Column(String, primary_key=True)
    bookingRef = Column(String, unique=True, nullable=False)
    passKey = Column(String, nullable=False)
    date = Column(DateTime, nullable=False)
    participants = Column(Integer, nullable=False)
    totalPrice = Column(Numeric(10, 2), nullable=False)
    status = Column(Enum(BookingStatus, name="booking_status", native_enum=False), default=BookingStatus.PENDING)
    paymentOption = Column(Enum(PaymentOption, name="payment_option", native_enum=False), default=PaymentOption.LATER)
    paymentMethod = Column(Enum(PaymentMethod, name="payment_method", native_enum=False), default=PaymentMethod.KONNECT)
    paymentStatus = Column(Enum(PaymentStatus, name="payment_status", native_enum=False), default=PaymentStatus.UNPAID)
    notes = Column(Text, nullable=True)
    language = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    expiresAt = Column(DateTime, nullable=False)

    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    passId = Column(String, ForeignKey("passes.id", ondelete="SET NULL"), nullable=True)
    
    user = relationship("User", back_populates="passReservations")
    pass_ = relationship("Pass", back_populates="reservations")
    activityReservations = relationship("ActivityReservation", back_populates="passReservation")


# ------------------------------------------------------------
# ATTRACTIONS & PLANS
# ------------------------------------------------------------
class Attraction(Base):
    __tablename__ = "Attraction"
    __table_args__ = (
        Index('idx_attr_dest_cat', 'destinationId', 'category'),
    )

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=False)
    overview = Column(Text, nullable=True)
    location = Column(String, nullable=False)
    hours = Column(String, nullable=True)
    fees = Column(String, nullable=True)
    coordinates = Column(JSON, nullable=True)
    category = Column(String, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    hasFee = Column(Boolean, default=False)
    feeAmount = Column(Integer, nullable=True)
    feeNote = Column(String, nullable=True)
    
    destinationId = Column(String, ForeignKey("Destination.id", ondelete="SET NULL"), nullable=True)

    destination = relationship("Destination", back_populates="attractions")
    images = relationship("Images", back_populates="attraction")
    translations = relationship("AttractionTranslation", back_populates="attraction")
    activities = relationship("Activity", secondary=activity_attraction_m2m, back_populates="attractions")


class AttractionTranslation(Base):
    __tablename__ = "AttractionTranslation"
    id = Column(String, primary_key=True)
    locale = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    overview = Column(Text, nullable=True)
    
    attractionId = Column(String, ForeignKey("Attraction.id"), nullable=False)
    attraction = relationship("Attraction", back_populates="translations")


class Plan(Base):
    __tablename__ = "Plan"
    __table_args__ = (
        Index('idx_plan_id', 'id'),
        Index('idx_plan_user_created', 'userId', 'createdAt'),
        Index('idx_plan_pub_dest', 'isPublic', 'destinationId'),
        Index('idx_plan_guide_type', 'guideId', 'planType'),
        Index('idx_plan_dest_type_pub', 'destinationId', 'planType', 'isPublic'),
        Index('idx_plan_dest_purch', 'destinationId', 'purchaseCount'),
    )

    id = Column(String, primary_key=True)
    title = Column(String, nullable=True)
    duration = Column(Integer, nullable=False)
    preferences = Column(JSON, nullable=False)
    itinerary = Column(JSON, nullable=False)
    isPublic = Column(Boolean, default=False)
    viewCount = Column(Integer, default=0)
    generatedBy = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    
    planType = Column(Enum(PlanType, name="plan_type", native_enum=False), default=PlanType.USER_SAVED)
    price = Column(Integer, default=0)
    isPaidPlan = Column(Boolean, default=False)
    purchaseCount = Column(Integer, default=0)
    summary = Column(Text, nullable=True)
    previewDays = Column(Integer, default=1)
    tags = Column(ARRAY(String), default=list)
    difficulty = Column(String, nullable=True)
    suitableFor = Column(ARRAY(String), default=list)
    season = Column(String, nullable=True)

    userId = Column(String, ForeignKey("User.id"), nullable=True)
    destinationId = Column(String, ForeignKey("Destination.id", ondelete="SET NULL"), nullable=True)
    guideId = Column(String, ForeignKey("GuideProfile.id", ondelete="SET NULL"), nullable=True)

    user = relationship("User", back_populates="plans")
    destination = relationship("Destination", back_populates="plans")
    guide = relationship("GuideProfile", back_populates="plans")
    purchases = relationship("PlanPurchase", back_populates="plan")


# ------------------------------------------------------------
# GUIDES
# ------------------------------------------------------------
class GuideProfile(Base):
    __tablename__ = "GuideProfile"
    __table_args__ = (
        Index('idx_guide_dest_active', 'destinationId', 'isActive'),
        Index('idx_guide_feat_active', 'isFeatured', 'isActive'),
    )

    id = Column(String, primary_key=True)
    slug = Column(String, unique=True, nullable=False)
    displayName = Column(String, nullable=False)
    bio = Column(Text, nullable=False)
    arabicBio = Column(Text, nullable=True)
    tagline = Column(String, nullable=True)
    avatarUrl = Column(String, nullable=True)
    coverUrl = Column(String, nullable=True)
    specializations = Column(ARRAY(String), default=list)
    languages = Column(ARRAY(String), default=list)
    experienceYears = Column(Integer, nullable=True)
    country = Column(String, nullable=False)
    note = Column(Text, nullable=True)
    nbReviews = Column(Integer, default=0)
    planCount = Column(Integer, default=0)
    totalSales = Column(Integer, default=0)
    isVerified = Column(Boolean, default=False)
    isFeatured = Column(Boolean, default=False)
    isActive = Column(Boolean, default=True)
    website = Column(String, nullable=True)
    instagram = Column(String, nullable=True)
    facebook = Column(String, nullable=True)
    tiktok = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    
    destinationId = Column(String, ForeignKey("Destination.id", ondelete="SET NULL"), nullable=True)
    userId = Column(String, ForeignKey("User.id"), unique=True, nullable=False)

    destination = relationship("Destination", back_populates="guides")
    user = relationship("User", back_populates="guideProfile")
    plans = relationship("Plan", back_populates="guide")


class PlanPurchase(Base):
    __tablename__ = "PlanPurchase"
    __table_args__ = (
        Index('idx_planpurch_plan', 'planId'),
        Index('idx_planpurch_user', 'userId'),
        UniqueConstraint('userId', 'planId', name='uq_planpurch_user_plan'),
    )

    id = Column(String, primary_key=True)
    purchaseRef = Column(String, unique=True, nullable=False)
    amount = Column(Integer, nullable=False)
    platformFee = Column(Integer, nullable=False)
    guideEarns = Column(Integer, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    
    userId = Column(String, ForeignKey("User.id"), nullable=False)
    planId = Column(String, ForeignKey("Plan.id"), nullable=False)

    user = relationship("User", back_populates="planPurchases")
    plan = relationship("Plan", back_populates="purchases")


# ------------------------------------------------------------
# MISC (Reviews, Images, Prefs, Feedbacks, Rentals, Transfers, Shops)
# ------------------------------------------------------------
class Review(Base):
    __tablename__ = "Review"
    __table_args__ = (
        Index('idx_review_relid_type', 'relationId', 'relationType'),
    )

    id = Column(String, primary_key=True)
    userName = Column(String, nullable=False)
    title = Column(String, nullable=True)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    response = Column(Text, nullable=True)
    responseDate = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    relationId = Column(String, nullable=False)
    relationType = Column(Enum(RelationType, name="relation_type", native_enum=False), nullable=False)
    
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    
    user = relationship("User", back_populates="reviews")
    images = relationship("Images", back_populates="review")


class Images(Base):
    __tablename__ = "Images"
    id = Column(String, primary_key=True)
    url = Column(String, nullable=False)
    alt = Column(String, default="")
    createdAt = Column(DateTime, default=datetime.utcnow)

    activityId = Column(String, ForeignKey("Activity.id", ondelete="CASCADE"), nullable=True)
    stayId = Column(String, ForeignKey("Stay.id", ondelete="CASCADE"), nullable=True)
    restaurantId = Column(String, ForeignKey("Restaurant.id", ondelete="CASCADE"), nullable=True)
    restaurantMenuId = Column(String, ForeignKey("RestaurantMenu.id", ondelete="CASCADE"), nullable=True)
    reviewId = Column(String, ForeignKey("Review.id", ondelete="CASCADE"), nullable=True)
    attractionId = Column(String, ForeignKey("Attraction.id", ondelete="CASCADE"), nullable=True)
    feedbackId = Column(String, ForeignKey("feedback.id", ondelete="CASCADE"), nullable=True)
    rentalId = Column(String, ForeignKey("Rental.id", ondelete="CASCADE"), nullable=True)
    transferId = Column(String, ForeignKey("Transfer.id", ondelete="CASCADE"), nullable=True)
    shopId = Column(String, ForeignKey("Shop.id", ondelete="CASCADE"), nullable=True)
    productId = Column(String, ForeignKey("Product.id", ondelete="CASCADE"), nullable=True)
    guidniReviewId = Column(String, ForeignKey("GuidniReview.id", ondelete="CASCADE"), nullable=True)

    activity = relationship("Activity", back_populates="images")
    stay = relationship("Stay", back_populates="images")
    restaurant = relationship("Restaurant", back_populates="images")
    restaurantMenu = relationship("RestaurantMenu", back_populates="images")
    review = relationship("Review", back_populates="images")
    attraction = relationship("Attraction", back_populates="images")
    feedback = relationship("Feedback", back_populates="images")
    rental = relationship("Rental", back_populates="images")
    transfer = relationship("Transfer", back_populates="images")
    shop = relationship("Shop", back_populates="images")
    product = relationship("Product", back_populates="images")
    guidniReview = relationship("GuidniReview", back_populates="images")


class Wishlist(Base):
    __tablename__ = "Wishlist"
    __table_args__ = (
        UniqueConstraint('userId', 'relationId', name='uq_wishlist_user_rel'),
    )

    id = Column(String, primary_key=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    relationId = Column(String, nullable=False)
    relationType = Column(Enum(RelationType, name="relation_type", native_enum=False), nullable=False)
    
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    
    user = relationship("User", back_populates="wishlists")


class Preference(Base):
    __tablename__ = "Preference"
    id = Column(String, primary_key=True)
    currency = Column(Enum(CurrencyCode, name="currency_code", native_enum=False), default=CurrencyCode.TND)
    language = Column(String, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), unique=True, nullable=False)
    user = relationship("User", back_populates="preference")


class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(String, primary_key=True)
    message = Column(Text, nullable=False)
    type = Column(String, nullable=False)
    url = Column(String, nullable=True)
    userAgent = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    
    user = relationship("User", back_populates="feedbacks")
    images = relationship("Images", back_populates="feedback")


class Message(Base):
    __tablename__ = "Message"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)


class Payment(Base):
    __tablename__ = "Payment"
    id = Column(String, primary_key=True)
    reservationId = Column(String, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    status = Column(Enum(PaymentStatus, name="payment_status", native_enum=False), nullable=False)
    method = Column(Enum(PaymentMethod, name="payment_method", native_enum=False), nullable=False)
    transactionId = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)


class Rental(Base):
    __tablename__ = "Rental"
    __table_args__ = (
        Index('idx_rental_slug', 'slug'),
    )

    id = Column(String, primary_key=True)
    slug = Column(String, unique=True, nullable=False)
    title = Column(String, nullable=False)
    arabicTitle = Column(String, nullable=True)
    description = Column(Text, nullable=False)
    arabicDescription = Column(Text, nullable=True)
    type = Column(Enum(RentalType, name="rental_type", native_enum=False), nullable=False)
    pricePerDay = Column(Integer, nullable=False)
    pricePerHour = Column(Integer, nullable=True)
    minDays = Column(Integer, default=1)
    capacity = Column(Integer, default=1)
    brand = Column(String, nullable=True)
    model = Column(String, nullable=True)
    year = Column(Integer, nullable=True)
    color = Column(String, nullable=True)
    transmission = Column(String, nullable=True)
    fuelType = Column(String, nullable=True)
    hasAC = Column(Boolean, default=False)
    hasGPS = Column(Boolean, default=False)
    hasInsurance = Column(Boolean, default=False)
    requiresLicense = Column(Boolean, default=True)
    country = Column(String, nullable=False)
    region = Column(String, nullable=False)
    city = Column(String, nullable=True)
    address = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    featuredInHome = Column(Boolean, default=False)
    nbReviews = Column(Integer, default=0)

    profileId = Column(String, ForeignKey("BusinessProfile.id", ondelete="CASCADE"), nullable=False)
    destinationId = Column(String, ForeignKey("Destination.id", ondelete="SET NULL"), nullable=True)

    businessProfile = relationship("BusinessProfile", back_populates="rentals")
    destination = relationship("Destination", back_populates="rentals")
    images = relationship("Images", back_populates="rental")
    reservations = relationship("RentalReservation", back_populates="rental")


class RentalReservation(Base):
    __tablename__ = "RentalReservation"
    __table_args__ = (
        Index('idx_rentres_user', 'userId'),
        Index('idx_rentres_rental', 'rentalId'),
        Index('idx_rentres_status', 'status'),
    )

    id = Column(String, primary_key=True)
    bookingRef = Column(String, unique=True, nullable=False)
    startDate = Column(DateTime, nullable=False)
    endDate = Column(DateTime, nullable=False)
    days = Column(Integer, nullable=False)
    totalPrice = Column(Numeric(10, 2), nullable=False)
    status = Column(Enum(BookingStatus, name="booking_status", native_enum=False), default=BookingStatus.PENDING)
    paymentOption = Column(Enum(PaymentOption, name="payment_option", native_enum=False), default=PaymentOption.LATER)
    paymentMethod = Column(Enum(PaymentMethod, name="payment_method", native_enum=False), default=PaymentMethod.KONNECT)
    paymentStatus = Column(Enum(PaymentStatus, name="payment_status", native_enum=False), default=PaymentStatus.UNPAID)
    notes = Column(Text, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    rentalId = Column(String, ForeignKey("Rental.id", ondelete="CASCADE"), nullable=False)

    user = relationship("User", back_populates="rentalReservations")
    rental = relationship("Rental", back_populates="reservations")


class Transfer(Base):
    __tablename__ = "Transfer"
    __table_args__ = (
        Index('idx_transfer_slug', 'slug'),
        Index('idx_transfer_type', 'type'),
    )

    id = Column(String, primary_key=True)
    slug = Column(String, unique=True, nullable=False)
    title = Column(String, nullable=False)
    arabicTitle = Column(String, nullable=True)
    description = Column(Text, nullable=False)
    arabicDescription = Column(Text, nullable=True)
    type = Column(Enum(TransferType, name="transfer_type", native_enum=False), nullable=False)
    pricePerTrip = Column(Integer, nullable=True)
    pricePerHour = Column(Integer, nullable=True)
    pricePerPerson = Column(Integer, nullable=True)
    capacity = Column(Integer, default=4)
    vehicleType = Column(String, nullable=True)
    brand = Column(String, nullable=True)
    model = Column(String, nullable=True)
    year = Column(Integer, nullable=True)
    isAC = Column(Boolean, default=True)
    isMeetGreet = Column(Boolean, default=False)
    isChildSeat = Column(Boolean, default=False)
    languages = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    country = Column(String, nullable=False)
    region = Column(String, nullable=False)
    city = Column(String, nullable=True)
    address = Column(String, nullable=True)
    note = Column(Text, nullable=True)
    nbReviews = Column(Integer, default=0)
    featuredInHome = Column(Boolean, default=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)

    profileId = Column(String, ForeignKey("BusinessProfile.id", ondelete="CASCADE"), nullable=False)
    destinationId = Column(String, ForeignKey("Destination.id", ondelete="SET NULL"), nullable=True)

    businessProfile = relationship("BusinessProfile", back_populates="transfers")
    destination = relationship("Destination", back_populates="transfers")
    images = relationship("Images", back_populates="transfer")
    reservations = relationship("TransferReservation", back_populates="transfer")


class TransferReservation(Base):
    __tablename__ = "TransferReservation"
    __table_args__ = (
        Index('idx_transres_user', 'userId'),
        Index('idx_transres_transfer', 'transferId'),
        Index('idx_transres_status', 'status'),
    )

    id = Column(String, primary_key=True)
    bookingRef = Column(String, unique=True, nullable=False)
    date = Column(DateTime, nullable=False)
    time = Column(String, nullable=False)
    pickupLocation = Column(String, nullable=False)
    dropoffLocation = Column(String, nullable=True)
    passengers = Column(Integer, default=1)
    hoursRequested = Column(Integer, nullable=True)
    flightNumber = Column(String, nullable=True)
    contactName = Column(String, nullable=False)
    contactPhone = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    totalPrice = Column(Numeric(10, 2), nullable=False)
    status = Column(Enum(BookingStatus, name="booking_status", native_enum=False), default=BookingStatus.PENDING)
    paymentOption = Column(Enum(PaymentOption, name="payment_option", native_enum=False), default=PaymentOption.LATER)
    paymentMethod = Column(Enum(PaymentMethod, name="payment_method", native_enum=False), default=PaymentMethod.KONNECT)
    paymentStatus = Column(Enum(PaymentStatus, name="payment_status", native_enum=False), default=PaymentStatus.UNPAID)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)

    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    transferId = Column(String, ForeignKey("Transfer.id", ondelete="CASCADE"), nullable=False)

    user = relationship("User", back_populates="transferReservations")
    transfer = relationship("Transfer", back_populates="reservations")


class Shop(Base):
    __tablename__ = "Shop"
    __table_args__ = (
        Index('idx_shop_slug', 'slug'),
    )

    id = Column(String, primary_key=True)
    slug = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    arabicName = Column(String, nullable=True)
    description = Column(Text, nullable=False)
    arabicDescription = Column(Text, nullable=True)
    category = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    country = Column(String, nullable=False)
    region = Column(String, nullable=False)
    city = Column(String, nullable=True)
    address = Column(String, nullable=True)
    location = Column(String, nullable=True)
    coverPhoto = Column(String, nullable=True)
    logo = Column(String, nullable=True)
    website = Column(String, nullable=True)
    instagram = Column(String, nullable=True)
    facebook = Column(String, nullable=True)
    note = Column(Text, nullable=True)
    nbReviews = Column(Integer, default=0)
    isOpen = Column(Boolean, default=True)
    featuredInHome = Column(Boolean, default=False)
    deliveryMethods = Column(ARRAY(Enum(DeliveryMethod, name="delivery_method_enum", native_enum=False)), default=list)
    freeShippingAbove = Column(Integer, nullable=True)
    minOrderAmount = Column(Integer, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)

    profileId = Column(String, ForeignKey("BusinessProfile.id", ondelete="CASCADE"), nullable=False)
    destinationId = Column(String, ForeignKey("Destination.id", ondelete="SET NULL"), nullable=True)

    businessProfile = relationship("BusinessProfile", back_populates="shops")
    destination = relationship("Destination", back_populates="shops")
    products = relationship("Product", back_populates="shop")
    images = relationship("Images", back_populates="shop")
    orders = relationship("ProductOrder", back_populates="shop")


class Product(Base):
    __tablename__ = "Product"
    __table_args__ = (
        Index('idx_prod_slug', 'slug'),
        Index('idx_prod_shop', 'shopId'),
    )

    id = Column(String, primary_key=True)
    slug = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    arabicName = Column(String, nullable=True)
    description = Column(Text, nullable=False)
    arabicDescription = Column(Text, nullable=True)
    price = Column(Integer, nullable=False)
    comparePrice = Column(Integer, nullable=True)
    category = Column(String, nullable=False)
    material = Column(String, nullable=True)
    origin = Column(String, nullable=True)
    weight = Column(Integer, nullable=True)
    stock = Column(Integer, default=0)
    isHandmade = Column(Boolean, default=False)
    isLocalOnly = Column(Boolean, default=False)
    featured = Column(Boolean, default=False)
    tags = Column(ARRAY(String), default=list)
    createdAt = Column(DateTime, default=datetime.utcnow)
    
    shopId = Column(String, ForeignKey("Shop.id", ondelete="CASCADE"), nullable=False)

    shop = relationship("Shop", back_populates="products")
    images = relationship("Images", back_populates="product")
    orderItems = relationship("ProductOrderItem", back_populates="product")


class ProductOrder(Base):
    __tablename__ = "ProductOrder"
    __table_args__ = (
        Index('idx_prodord_user', 'userId'),
        Index('idx_prodord_shop', 'shopId'),
        Index('idx_prodord_status', 'status'),
    )

    id = Column(String, primary_key=True)
    orderRef = Column(String, unique=True, nullable=False)
    status = Column(Enum(OrderStatus, name="order_status", native_enum=False), default=OrderStatus.PENDING)
    deliveryMethod = Column(Enum(DeliveryMethod, name="delivery_method", native_enum=False), nullable=False)
    deliveryAddress = Column(Text, nullable=True)
    deliveryCity = Column(String, nullable=True)
    deliveryCountry = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    subtotal = Column(Integer, nullable=False)
    deliveryCost = Column(Integer, default=0)
    total = Column(Integer, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    shopId = Column(String, ForeignKey("Shop.id", ondelete="CASCADE"), nullable=False)

    user = relationship("User", back_populates="productOrders")
    shop = relationship("Shop", back_populates="orders")
    items = relationship("ProductOrderItem", back_populates="order")


class ProductOrderItem(Base):
    __tablename__ = "ProductOrderItem"
    id = Column(String, primary_key=True)
    quantity = Column(Integer, nullable=False)
    unitPrice = Column(Integer, nullable=False)
    
    productId = Column(String, ForeignKey("Product.id", ondelete="CASCADE"), nullable=False)
    orderId = Column(String, ForeignKey("ProductOrder.id", ondelete="CASCADE"), nullable=False)

    product = relationship("Product", back_populates="orderItems")
    order = relationship("ProductOrder", back_populates="items")


class ListingBadge(Base):
    __tablename__ = "ListingBadge"
    __table_args__ = (
        UniqueConstraint('badgeKey', 'relationType', 'relationId', name='uq_badge_rel'),
    )

    id = Column(String, primary_key=True)
    badgeKey = Column(Enum(BadgeKey, name="badge_key", native_enum=False), nullable=False)
    relationType = Column(Enum(RelationType, name="relation_type_badge", native_enum=False), nullable=False)
    relationId = Column(String, nullable=False)
    assignedAt = Column(DateTime, default=datetime.utcnow)
    assignedBy = Column(String, nullable=True)
    note = Column(Text, nullable=True)


class GuidniReview(Base):
    __tablename__ = "GuidniReview"
    __table_args__ = (
        UniqueConstraint('relationType', 'relationId', name='uq_guidnirev_rel'),
    )

    id = Column(String, primary_key=True)
    relationType = Column(Enum(RelationType, name="relation_type_grev", native_enum=False), nullable=False)
    relationId = Column(String, nullable=False)
    status = Column(Enum(GuidniReviewStatus, name="grev_status", native_enum=False), default=GuidniReviewStatus.PENDING)
    reviewerName = Column(String, nullable=True)
    reviewerTitle = Column(String, nullable=True)
    visitedAt = Column(DateTime, nullable=True)
    season = Column(String, nullable=True)
    summaryQuote = Column(Text, nullable=True)
    fullReview = Column(Text, nullable=True)
    whatWeLoved = Column(Text, nullable=True)
    worthKnowing = Column(Text, nullable=True)
    bestFor = Column(String, nullable=True)
    scoreAccuracy = Column(Integer, nullable=True)
    scoreQuality = Column(Integer, nullable=True)
    scoreValue = Column(Integer, nullable=True)
    scorePresent = Column(Integer, nullable=True)
    scoreHost = Column(Integer, nullable=True)
    scoreTotal = Column(Integer, nullable=True)
    partnerResponse = Column(Text, nullable=True)
    partnerResponseDate = Column(DateTime, nullable=True)
    tiktokUrl = Column(String, nullable=True)
    instagramUrl = Column(String, nullable=True)
    facebookUrl = Column(String, nullable=True)
    requestedBy = Column(String, nullable=True)
    assignedTo = Column(String, nullable=True)
    partnerOffer = Column(Text, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    publishedAt = Column(DateTime, nullable=True)

    images = relationship("Images", back_populates="guidniReview")


# ------------------------------------------------------------
# LOCAL AGENT PROGRAM
# ------------------------------------------------------------
class AgentProfile(Base):
    __tablename__ = "AgentProfile"
    __table_args__ = (
        Index('idx_agent_dest_active', 'destinationId', 'isActive'),
        Index('idx_agent_tier_pts', 'tier', 'points'),
    )

    id = Column(String, primary_key=True)
    slug = Column(String, unique=True, nullable=False)
    displayName = Column(String, nullable=False)
    pseudonym = Column(String, unique=True, nullable=True)
    phone = Column(String, nullable=False)
    country = Column(String, nullable=False)
    city = Column(String, nullable=False)
    bio = Column(Text, nullable=True)
    avatarUrl = Column(String, nullable=True)
    tier = Column(Enum(AgentTier, name="agent_tier", native_enum=False), default=AgentTier.STARTER)
    points = Column(Integer, default=0)
    totalEarned = Column(Numeric(10, 2), default=0)
    isVerified = Column(Boolean, default=False)
    isActive = Column(Boolean, default=True)
    verifiedAt = Column(DateTime, nullable=True)
    
    destinationId = Column(String, ForeignKey("Destination.id", ondelete="SET NULL"), nullable=True)
    userId = Column(String, ForeignKey("User.id"), unique=True, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)

    destination = relationship("Destination", back_populates="agents")
    user = relationship("User", back_populates="agentProfile")
    invitations = relationship("AgentInvitation", back_populates="agent")
    earnings = relationship("AgentEarning", back_populates="agent")
    agentPoints = relationship("AgentPoint", back_populates="agent")
    referrals = relationship("AgentReferral", back_populates="agent")
    redemptions = relationship("AgentRedemption", back_populates="agent")
    activityReservations = relationship("ActivityReservation", back_populates="agent")


class AgentInvitation(Base):
    __tablename__ = "AgentInvitation"
    __table_args__ = (
        Index('idx_aginv_agent_stat', 'agentId', 'status'),
        Index('idx_aginv_token', 'token'),
    )

    id = Column(String, primary_key=True)
    token = Column(String, unique=True, nullable=False)
    status = Column(Enum(InvitationStatus, name="invitation_status", native_enum=False), default=InvitationStatus.PENDING)
    listingType = Column(String, nullable=False)
    listingId = Column(String, nullable=False)
    touristEmail = Column(String, nullable=True)
    touristPhone = Column(String, nullable=True)
    note = Column(Text, nullable=True)
    date = Column(String, nullable=True)
    timeSlot = Column(String, nullable=True)
    adults = Column(Integer, default=1)
    children = Column(Integer, default=0)
    expiresAt = Column(DateTime, nullable=False)
    openedAt = Column(DateTime, nullable=True)
    bookedAt = Column(DateTime, nullable=True)
    
    agentId = Column(String, ForeignKey("AgentProfile.id", ondelete="CASCADE"), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)

    agent = relationship("AgentProfile", back_populates="invitations")
    activityReservations = relationship("ActivityReservation", back_populates="agentInvitation")


class AgentEarning(Base):
    __tablename__ = "AgentEarning"
    __table_args__ = (
        Index('idx_agearn_agent_stat', 'agentId', 'status'),
        Index('idx_agearn_bkref', 'bookingRef'),
    )

    id = Column(String, primary_key=True)
    bookingRef = Column(String, nullable=False)
    listingType = Column(String, nullable=False)
    listingId = Column(String, nullable=False)
    commissionRate = Column(Float, nullable=False)
    bookingAmount = Column(Numeric(10, 2), nullable=False)
    commissionAmount = Column(Numeric(10, 2), nullable=False)
    status = Column(Enum(EarningStatus, name="earning_status", native_enum=False), default=EarningStatus.PENDING)
    confirmedAt = Column(DateTime, nullable=True)
    paidAt = Column(DateTime, nullable=True)
    note = Column(Text, nullable=True)
    
    agentId = Column(String, ForeignKey("AgentProfile.id", ondelete="CASCADE"), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)

    agent = relationship("AgentProfile", back_populates="earnings")


class AgentPoint(Base):
    __tablename__ = "AgentPoint"
    __table_args__ = (
        Index('idx_agpt_agent_type', 'agentId', 'type'),
        Index('idx_agpt_agent_crt', 'agentId', 'createdAt'),
    )

    id = Column(String, primary_key=True)
    type = Column(Enum(AgentPointType, name="agent_pt_type", native_enum=False), nullable=False)
    amount = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(AgentPointStatus, name="agent_pt_status", native_enum=False), default=AgentPointStatus.CONFIRMED)
    referenceId = Column(String, nullable=True)
    
    agentId = Column(String, ForeignKey("AgentProfile.id", ondelete="CASCADE"), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)

    agent = relationship("AgentProfile", back_populates="agentPoints")


class AgentReferral(Base):
    __tablename__ = "AgentReferral"
    __table_args__ = (
        Index('idx_agref_agent_stat', 'agentId', 'status'),
        Index('idx_agref_busprof', 'businessProfileId'),
    )

    id = Column(String, primary_key=True)
    status = Column(Enum(AgentReferralStatus, name="agent_ref_status", native_enum=False), default=AgentReferralStatus.PENDING)
    partnerName = Column(String, nullable=False)
    partnerEmail = Column(String, nullable=True)
    partnerPhone = Column(String, nullable=True)
    partnerType = Column(String, nullable=True)
    partnerCity = Column(String, nullable=True)
    agentNote = Column(Text, nullable=True)
    signupAt = Column(DateTime, nullable=True)
    verifiedAt = Column(DateTime, nullable=True)
    firstListingAt = Column(DateTime, nullable=True)
    firstBookingAt = Column(DateTime, nullable=True)
    pointsAwarded = Column(Integer, default=0)
    
    agentId = Column(String, ForeignKey("AgentProfile.id", ondelete="CASCADE"), nullable=False)
    businessProfileId = Column(String, ForeignKey("BusinessProfile.id", ondelete="SET NULL"), nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)

    agent = relationship("AgentProfile", back_populates="referrals")
    businessProfile = relationship("BusinessProfile", back_populates="agentReferrals")


class AgentRedemption(Base):
    __tablename__ = "AgentRedemption"
    __table_args__ = (
        Index('idx_agred_agent_stat', 'agentId', 'status'),
    )

    id = Column(String, primary_key=True)
    points = Column(Integer, nullable=False)
    amountTND = Column(Numeric(10, 2), nullable=False)
    status = Column(Enum(RedemptionStatus, name="redemption_status", native_enum=False), default=RedemptionStatus.PENDING)
    method = Column(String, default="BANK_TRANSFER")
    accountInfo = Column(Text, nullable=True)
    processedAt = Column(DateTime, nullable=True)
    note = Column(Text, nullable=True)
    
    agentId = Column(String, ForeignKey("AgentProfile.id", ondelete="CASCADE"), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)

    agent = relationship("AgentProfile", back_populates="redemptions")


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