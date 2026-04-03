-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER', 'PARTNER', 'AGENT');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PaymentOption" AS ENUM ('NOW', 'LATER');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('INCLUDED_IN_PASS', 'KONNECT', 'PAYPAL', 'STRIPE', 'CASH', 'CREDIT_CARD');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID', 'REFUNDED', 'FAILED');

-- CreateEnum
CREATE TYPE "CurrencyCode" AS ENUM ('TND', 'EUR', 'USD');

-- CreateEnum
CREATE TYPE "RelationType" AS ENUM ('YUMMY', 'ACTIVITY', 'STAY', 'BUSINESS_PROFILE');

-- CreateEnum
CREATE TYPE "YummyType" AS ENUM ('RESTAURANT', 'CAFEE_SHOP', 'BOTH');

-- CreateEnum
CREATE TYPE "PassActivityType" AS ENUM ('FIXED', 'OPTIONAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "phone" TEXT,
    "bio" TEXT,
    "address" TEXT,
    "country" TEXT,
    "city" TEXT,
    "postalCode" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Destination" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "region" TEXT,
    "description" TEXT,
    "arabicDescription" TEXT,
    "coverImage" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Destination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "address" TEXT,
    "region" TEXT NOT NULL,
    "phone" TEXT,
    "registration" BOOLEAN NOT NULL DEFAULT false,
    "companyRN" TEXT,
    "website" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nbReviews" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION DEFAULT 0,
    "isSuperhost" BOOLEAN NOT NULL DEFAULT false,
    "superhostSince" TIMESTAMP(3),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "governmentId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "type" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
    "profileImage" TEXT,
    "languages" TEXT,
    "responseRate" INTEGER,
    "responseTime" TEXT,
    "userId" TEXT NOT NULL,
    "destinationId" TEXT,

    CONSTRAINT "BusinessProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "arabicTitle" TEXT,
    "description" TEXT NOT NULL,
    "arabicDescription" TEXT,
    "category" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "phone" TEXT,
    "country" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "city" TEXT,
    "address" TEXT,
    "location" TEXT,
    "note" TEXT,
    "nbReviews" INTEGER NOT NULL DEFAULT 0,
    "duration" TEXT,
    "includes" TEXT,
    "excludes" TEXT,
    "allowed" TEXT,
    "forbidden" TEXT,
    "cancelation" BOOLEAN,
    "paynow" BOOLEAN,
    "guide" TEXT,
    "capacity" INTEGER NOT NULL,
    "availableTimes" TEXT NOT NULL,
    "featuredInHome" BOOLEAN NOT NULL DEFAULT false,
    "profileId" TEXT NOT NULL,
    "destinationId" TEXT,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityReservation" (
    "id" TEXT NOT NULL,
    "bookingRef" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "adults" INTEGER NOT NULL,
    "children" INTEGER NOT NULL,
    "totalPrice" DECIMAL(65,30) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "paymentOption" "PaymentOption" NOT NULL DEFAULT 'LATER',
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'KONNECT',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "notes" TEXT,
    "language" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "typeInPass" "PassActivityType",
    "userId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "passId" TEXT,

    CONSTRAINT "ActivityReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stay" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "featuredInHome" BOOLEAN NOT NULL DEFAULT false,
    "approvalStatus" TEXT NOT NULL DEFAULT 'APPROVED',
    "title" TEXT NOT NULL,
    "arabicTitle" TEXT,
    "description" TEXT NOT NULL,
    "arabicDescription" TEXT,
    "propertyType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "videoTour" TEXT,
    "price" INTEGER NOT NULL,
    "cleaningFee" INTEGER DEFAULT 0,
    "serviceFee" INTEGER DEFAULT 0,
    "securityDeposit" INTEGER DEFAULT 0,
    "weeklyDiscount" INTEGER DEFAULT 0,
    "monthlyDiscount" INTEGER DEFAULT 0,
    "guestCount" INTEGER NOT NULL DEFAULT 1,
    "bedroomCount" INTEGER NOT NULL DEFAULT 1,
    "bedCount" INTEGER NOT NULL DEFAULT 1,
    "bathroomCount" INTEGER NOT NULL DEFAULT 1,
    "maxChildren" INTEGER DEFAULT 0,
    "hasWifi" BOOLEAN NOT NULL DEFAULT false,
    "hasKitchen" BOOLEAN NOT NULL DEFAULT false,
    "hasAirConditioning" BOOLEAN NOT NULL DEFAULT false,
    "hasHeating" BOOLEAN NOT NULL DEFAULT false,
    "hasPool" BOOLEAN NOT NULL DEFAULT false,
    "hasGarden" BOOLEAN NOT NULL DEFAULT false,
    "hasBalcony" BOOLEAN NOT NULL DEFAULT false,
    "hasParking" BOOLEAN NOT NULL DEFAULT false,
    "hasSecurity" BOOLEAN NOT NULL DEFAULT false,
    "hasConcierge" BOOLEAN NOT NULL DEFAULT false,
    "wheelchairAccessible" BOOLEAN NOT NULL DEFAULT false,
    "elevatorAvailable" BOOLEAN NOT NULL DEFAULT false,
    "checkInTime" TEXT NOT NULL DEFAULT '15:00',
    "checkOutTime" TEXT NOT NULL DEFAULT '11:00',
    "minStayNights" INTEGER NOT NULL DEFAULT 1,
    "maxStayNights" INTEGER,
    "isPetFriendly" BOOLEAN NOT NULL DEFAULT false,
    "isSmokeFree" BOOLEAN NOT NULL DEFAULT true,
    "cancelationPolicy" TEXT NOT NULL DEFAULT 'FLEXIBLE',
    "country" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "city" TEXT,
    "address" TEXT,
    "neighborhood" TEXT,
    "location" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "locationNotes" TEXT,
    "phone" TEXT,
    "hostName" TEXT NOT NULL DEFAULT '',
    "hostLanguages" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "nbReviews" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION DEFAULT 0,
    "lastBookedAt" TIMESTAMP(3),
    "bookingCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastRenovated" TIMESTAMP(3),
    "profileId" TEXT NOT NULL,
    "destinationId" TEXT,

    CONSTRAINT "Stay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaysReservation" (
    "id" TEXT NOT NULL,
    "bookingRef" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "checkIn" DATE NOT NULL,
    "checkOut" DATE NOT NULL,
    "nights" INTEGER NOT NULL,
    "adults" INTEGER NOT NULL DEFAULT 1,
    "children" INTEGER NOT NULL DEFAULT 0,
    "babies" INTEGER NOT NULL DEFAULT 0,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "cleaningFee" DECIMAL(10,2),
    "serviceFee" DECIMAL(10,2),
    "taxes" DECIMAL(10,2),
    "discount" DECIMAL(10,2),
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'TND',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "paymentOption" "PaymentOption",
    "paymentMethod" "PaymentMethod",
    "transactionId" TEXT,
    "paidAmount" DECIMAL(10,2),
    "refundAmount" DECIMAL(10,2),
    "specialRequests" TEXT,
    "cancellationReason" TEXT,
    "hostNotes" TEXT,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "stayId" TEXT NOT NULL,
    "couponId" TEXT,

    CONSTRAINT "StaysReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discount" INTEGER NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Yummy" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "arabicName" TEXT,
    "description" TEXT NOT NULL,
    "arabicDescription" TEXT,
    "phone" TEXT,
    "type" "YummyType" NOT NULL,
    "category" TEXT,
    "meals" TEXT,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT,
    "location" TEXT,
    "logo" TEXT,
    "coverPhoto" TEXT,
    "website" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "pdfMenu" TEXT,
    "note" TEXT,
    "nbReviews" INTEGER NOT NULL DEFAULT 0,
    "reservationsEnabled" BOOLEAN NOT NULL,
    "maxGuests" INTEGER,
    "tables" INTEGER,
    "featuredInHome" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profileId" TEXT NOT NULL,
    "destinationId" TEXT,

    CONSTRAINT "Yummy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YummyMenu" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "yummyId" TEXT NOT NULL,

    CONSTRAINT "YummyMenu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YummyHours" (
    "id" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "opening" TEXT,
    "closing" TEXT,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "isFullDayOpening" BOOLEAN NOT NULL DEFAULT false,
    "yummyId" TEXT NOT NULL,

    CONSTRAINT "YummyHours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YummyReservation" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "price" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "yummyId" TEXT NOT NULL,

    CONSTRAINT "YummyReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passes" (
    "id" TEXT NOT NULL,
    "passKey" TEXT NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "destinationId" TEXT,

    CONSTRAINT "passes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PassReservation" (
    "id" TEXT NOT NULL,
    "pass" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "participants" INTEGER NOT NULL,
    "totalPrice" DECIMAL(65,30) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "paymentOption" "PaymentOption" NOT NULL DEFAULT 'LATER',
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'KONNECT',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "notes" TEXT,
    "language" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "PassReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attraction" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "overview" TEXT,
    "location" TEXT NOT NULL,
    "hours" TEXT,
    "fees" TEXT,
    "coordinates" JSONB,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "destinationId" TEXT,

    CONSTRAINT "Attraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttractionTranslation" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "overview" TEXT,
    "attractionId" TEXT NOT NULL,

    CONSTRAINT "AttractionTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "duration" INTEGER NOT NULL,
    "preferences" JSONB NOT NULL,
    "itinerary" JSONB NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "destinationId" TEXT,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "title" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "response" TEXT,
    "responseDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "relationId" TEXT NOT NULL,
    "relationType" "RelationType" NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Images" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activityId" TEXT,
    "stayId" TEXT,
    "yummyId" TEXT,
    "yummyMenuId" TEXT,
    "reviewId" TEXT,
    "attractionId" TEXT,
    "feedbackId" TEXT,

    CONSTRAINT "Images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wishlist" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "relationId" TEXT NOT NULL,
    "relationType" "RelationType" NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Wishlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Preference" (
    "id" TEXT NOT NULL,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'TND',
    "language" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Preference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FixedActivities" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FixedActivities_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_OptionalActivities" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_OptionalActivities_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Destination_slug_key" ON "Destination"("slug");

-- CreateIndex
CREATE INDEX "Destination_slug_idx" ON "Destination"("slug");

-- CreateIndex
CREATE INDEX "Destination_active_idx" ON "Destination"("active");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessProfile_userId_key" ON "BusinessProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_slug_key" ON "Activity"("slug");

-- CreateIndex
CREATE INDEX "Activity_slug_idx" ON "Activity"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityReservation_bookingRef_key" ON "ActivityReservation"("bookingRef");

-- CreateIndex
CREATE INDEX "ActivityReservation_userId_idx" ON "ActivityReservation"("userId");

-- CreateIndex
CREATE INDEX "ActivityReservation_activityId_idx" ON "ActivityReservation"("activityId");

-- CreateIndex
CREATE INDEX "ActivityReservation_status_idx" ON "ActivityReservation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Stay_slug_key" ON "Stay"("slug");

-- CreateIndex
CREATE INDEX "Stay_country_idx" ON "Stay"("country");

-- CreateIndex
CREATE INDEX "Stay_region_idx" ON "Stay"("region");

-- CreateIndex
CREATE INDEX "Stay_city_idx" ON "Stay"("city");

-- CreateIndex
CREATE INDEX "Stay_price_idx" ON "Stay"("price");

-- CreateIndex
CREATE INDEX "Stay_averageRating_idx" ON "Stay"("averageRating");

-- CreateIndex
CREATE INDEX "Stay_slug_idx" ON "Stay"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "StaysReservation_bookingRef_key" ON "StaysReservation"("bookingRef");

-- CreateIndex
CREATE INDEX "StaysReservation_userId_idx" ON "StaysReservation"("userId");

-- CreateIndex
CREATE INDEX "StaysReservation_stayId_idx" ON "StaysReservation"("stayId");

-- CreateIndex
CREATE INDEX "StaysReservation_checkIn_idx" ON "StaysReservation"("checkIn");

-- CreateIndex
CREATE INDEX "StaysReservation_status_idx" ON "StaysReservation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Yummy_slug_key" ON "Yummy"("slug");

-- CreateIndex
CREATE INDEX "Yummy_slug_idx" ON "Yummy"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "passes_passKey_key" ON "passes"("passKey");

-- CreateIndex
CREATE INDEX "PassReservation_userId_idx" ON "PassReservation"("userId");

-- CreateIndex
CREATE INDEX "PassReservation_status_idx" ON "PassReservation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Attraction_slug_key" ON "Attraction"("slug");

-- CreateIndex
CREATE INDEX "Plan_id_idx" ON "Plan"("id");

-- CreateIndex
CREATE INDEX "Review_relationId_relationType_idx" ON "Review"("relationId", "relationType");

-- CreateIndex
CREATE UNIQUE INDEX "Wishlist_userId_relationId_key" ON "Wishlist"("userId", "relationId");

-- CreateIndex
CREATE UNIQUE INDEX "Preference_userId_key" ON "Preference"("userId");

-- CreateIndex
CREATE INDEX "_FixedActivities_B_index" ON "_FixedActivities"("B");

-- CreateIndex
CREATE INDEX "_OptionalActivities_B_index" ON "_OptionalActivities"("B");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProfile" ADD CONSTRAINT "BusinessProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProfile" ADD CONSTRAINT "BusinessProfile_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "BusinessProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityReservation" ADD CONSTRAINT "ActivityReservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityReservation" ADD CONSTRAINT "ActivityReservation_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityReservation" ADD CONSTRAINT "ActivityReservation_passId_fkey" FOREIGN KEY ("passId") REFERENCES "PassReservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stay" ADD CONSTRAINT "Stay_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "BusinessProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stay" ADD CONSTRAINT "Stay_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaysReservation" ADD CONSTRAINT "StaysReservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaysReservation" ADD CONSTRAINT "StaysReservation_stayId_fkey" FOREIGN KEY ("stayId") REFERENCES "Stay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaysReservation" ADD CONSTRAINT "StaysReservation_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Yummy" ADD CONSTRAINT "Yummy_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "BusinessProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Yummy" ADD CONSTRAINT "Yummy_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YummyMenu" ADD CONSTRAINT "YummyMenu_yummyId_fkey" FOREIGN KEY ("yummyId") REFERENCES "Yummy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YummyHours" ADD CONSTRAINT "YummyHours_yummyId_fkey" FOREIGN KEY ("yummyId") REFERENCES "Yummy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YummyReservation" ADD CONSTRAINT "YummyReservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YummyReservation" ADD CONSTRAINT "YummyReservation_yummyId_fkey" FOREIGN KEY ("yummyId") REFERENCES "Yummy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passes" ADD CONSTRAINT "passes_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PassReservation" ADD CONSTRAINT "PassReservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attraction" ADD CONSTRAINT "Attraction_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttractionTranslation" ADD CONSTRAINT "AttractionTranslation_attractionId_fkey" FOREIGN KEY ("attractionId") REFERENCES "Attraction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Images" ADD CONSTRAINT "Images_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Images" ADD CONSTRAINT "Images_stayId_fkey" FOREIGN KEY ("stayId") REFERENCES "Stay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Images" ADD CONSTRAINT "Images_yummyId_fkey" FOREIGN KEY ("yummyId") REFERENCES "Yummy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Images" ADD CONSTRAINT "Images_yummyMenuId_fkey" FOREIGN KEY ("yummyMenuId") REFERENCES "YummyMenu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Images" ADD CONSTRAINT "Images_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Images" ADD CONSTRAINT "Images_attractionId_fkey" FOREIGN KEY ("attractionId") REFERENCES "Attraction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Images" ADD CONSTRAINT "Images_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preference" ADD CONSTRAINT "Preference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FixedActivities" ADD CONSTRAINT "_FixedActivities_A_fkey" FOREIGN KEY ("A") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FixedActivities" ADD CONSTRAINT "_FixedActivities_B_fkey" FOREIGN KEY ("B") REFERENCES "passes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OptionalActivities" ADD CONSTRAINT "_OptionalActivities_A_fkey" FOREIGN KEY ("A") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OptionalActivities" ADD CONSTRAINT "_OptionalActivities_B_fkey" FOREIGN KEY ("B") REFERENCES "passes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
