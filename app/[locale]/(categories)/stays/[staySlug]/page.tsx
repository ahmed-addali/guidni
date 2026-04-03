import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { FiMapPin, FiStar } from "react-icons/fi";
import { getStayBySlug, getRelatedStays } from "@/lib/actions/stays";
import { getReviews, hasCompletedBooking, hasReviewed } from "@/lib/actions/reviews";
import { getManualBadges, getGuidniReview } from "@/lib/actions/badges";
import { getAutoBadges } from "@/lib/utils/badge-utils";
import { BadgeList } from "@/components/badges/BadgeList";
import { GuidniReviewSection } from "@/components/badges/GuidniReviewSection";
import { StayGallery } from "@/components/stays/StayGallery";
import { AmenitiesSection } from "@/components/stays/AmenitiesSection";
import { StayDetailsGrid } from "@/components/stays/StayDetailsGrid";
import { StayBookingCard } from "@/components/stays/StayBookingCard";
import { ReviewsSection } from "@/components/activities/ReviewsSection";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { DescriptionWithToggle } from "@/components/shared/DescriptionWithToggle";
import { RatingSummary } from "@/components/shared/RatingSummary";
import { StayHostStrip } from "./_components/StayHostStrip";
import { StayHighlights } from "./_components/StayHighlights";
import { StayLocationSection } from "./_components/StayLocationSection";
import { StayThingsToKnow } from "./_components/StayThingsToKnow";
import { StayAnchorNav } from "./_components/StayAnchorNav";
import { StayMobileBookingBar } from "./_components/StayMobileBookingBar";
import { StayRelatedSection } from "./_components/StayRelatedSection";
import { ShareButton } from "./_components/ShareButton";
import { RelationType } from "@prisma/client";

type Params = Promise<{ locale: string; staySlug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { staySlug, locale } = await params;
  const stay = await getStayBySlug(staySlug);
  if (!stay) return { title: "Stay Not Found" };
  const title = locale === "ar" && stay.arabicTitle ? stay.arabicTitle : stay.title;
  return {
    title,
    description: stay.description.slice(0, 160),
    openGraph: { images: stay.images.map((img) => img.url) },
  };
}

export default async function StayPage({ params }: { params: Params }) {
  const { locale, staySlug } = await params;

  const [stay, t] = await Promise.all([
    getStayBySlug(staySlug),
    getTranslations({ locale, namespace: "StayPage" }),
  ]);

  if (!stay) notFound();

  const [reviews, completedBooking, alreadyReviewed, manualBadges, guidniReview, relatedStays] = await Promise.all([
    getReviews(stay.id, RelationType.STAY),
    hasCompletedBooking(stay.id, "STAY"),
    hasReviewed(stay.id, "STAY"),
    getManualBadges(stay.id, RelationType.STAY),
    getGuidniReview(stay.id, RelationType.STAY),
    stay.destinationId
      ? getRelatedStays(stay.id, stay.destinationId)
      : Promise.resolve([]),
  ]);

  const canReview = completedBooking && !alreadyReviewed;

  const autoBadges = getAutoBadges({ note: stay.averageRating?.toString() ?? null, nbReviews: stay.nbReviews });
  const allBadges = [...manualBadges, ...autoBadges];

  const title = locale === "ar" && stay.arabicTitle ? stay.arabicTitle : stay.title;
  const description =
    locale === "ar" && stay.arabicDescription ? stay.arabicDescription : stay.description;

  const hostName  = stay.businessProfile?.name || stay.hostName || t("host.defaultName");
  const memberYear = stay.businessProfile?.createdAt
    ? new Date(stay.businessProfile.createdAt).getFullYear().toString()
    : "";

  const cancelPolicies: Record<string, string> = {
    flexible:       t("houseRules.cancelPolicies.flexible"),
    moderate:       t("houseRules.cancelPolicies.moderate"),
    strict:         t("houseRules.cancelPolicies.strict"),
    non_refundable: t("houseRules.cancelPolicies.non_refundable"),
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 md:px-20 py-8 pb-16 lg:pb-16">

      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-5">
        <Link href={`/${locale}/stays`} className="hover:text-gray-700 transition-colors">
          {t("breadcrumb.stays")}
        </Link>
        <span>/</span>
        {stay.destination?.city && (
          <>
            <span className="hover:text-gray-700 transition-colors">
              {stay.destination.city}
            </span>
            <span>/</span>
          </>
        )}
        <span className="text-gray-700 font-medium truncate max-w-xs">{title}</span>
      </nav>

      {/* ── Title + action row ── */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-2">
            {title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            {stay.destination?.city && (
              <div className="flex items-center gap-1">
                <FiMapPin className="h-3.5 w-3.5" />
                <span>
                  {[stay.neighborhood, stay.destination.city, stay.destination.country]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            )}
            {(stay.averageRating ?? 0) > 0 && stay.nbReviews > 0 ? (
              <a href="#reviews-section" className="flex items-center gap-1 hover:underline">
                <FiStar className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                <span className="font-medium text-gray-700">{stay.averageRating.toFixed(1)}</span>
                <span>· {stay.nbReviews} {t("reviews")}</span>
              </a>
            ) : null}
          </div>
          {allBadges.length > 0 && (
            <div className="mt-3">
              <BadgeList badges={allBadges} detailPage />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <ShareButton
            title={title}
            shareLabel={t("share")}
            copiedLabel={t("shareCopied")}
            className="h-9 w-9 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors"
          />
          <WishlistButton
            listingId={stay.id}
            relationType="STAY"
            className="h-9 w-9 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors"
          />
        </div>
      </div>

      {/* ── Gallery ── */}
      <StayGallery
        images={stay.images}
        title={title}
        allPhotosLabel={t("allPhotos")}
        photosLabel={t("photos")}
      />

      {/* ── Anchor navigation ── */}
      <StayAnchorNav
        labels={{
          overview:  t("nav.overview"),
          amenities: t("nav.amenities"),
          location:  t("nav.location"),
          reviews:   t("nav.reviews"),
        }}
      />

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 mt-10">

        {/* ── Left column ── */}
        <div className="space-y-8 min-w-0">

          {/* Host strip */}
          <StayHostStrip
            hostName={hostName}
            hostLanguages={stay.hostLanguages}
            profileImage={stay.businessProfile?.profileImage}
            isVerified={stay.businessProfile?.isVerified ?? false}
            memberSince={memberYear}
            labels={{
              hostedBy:    t("host.hostedBy", { type: stay.category, name: hostName }),
              speaks:      t("host.speaks"),
              memberSince: t("memberSince"),
            }}
          />

          <Separator />

          {/* Space details */}
          <div id="overview-section" className="scroll-mt-24">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t("details.title")}</h2>
            <StayDetailsGrid
              guestCount={stay.guestCount}
              bedroomCount={stay.bedroomCount}
              bedCount={stay.bedCount}
              bathroomCount={stay.bathroomCount}
              labels={{
                guests:    t("details.guests"),
                bedrooms:  t("details.bedrooms"),
                beds:      t("details.beds"),
                bathrooms: t("details.bathrooms"),
              }}
            />
          </div>

          <Separator />

          {/* Key highlights */}
          <StayHighlights
            stay={stay}
            labels={{
              freeCancel: t("highlights.freeCancel"),
              pool:       t("highlights.pool"),
              wifi:       t("highlights.wifi"),
              parking:    t("highlights.parking"),
              kitchen:    t("highlights.kitchen"),
              garden:     t("highlights.garden"),
              balcony:    t("highlights.balcony"),
              topRated:   t("highlights.topRated"),
            }}
          />

          <Separator />

          {/* Description */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t("about")}</h2>
            <DescriptionWithToggle
              text={description}
              showMoreLabel={t("showMore")}
              showLessLabel={t("showLess")}
            />
          </div>

          <Separator />

          {/* Amenities */}
          <div id="amenities-section" className="scroll-mt-24">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t("amenities.title")}</h2>
            <AmenitiesSection
              stay={stay}
              labels={{
                wifi:       t("amenities.wifi"),
                kitchen:    t("amenities.kitchen"),
                ac:         t("amenities.ac"),
                heating:    t("amenities.heating"),
                pool:       t("amenities.pool"),
                garden:     t("amenities.garden"),
                balcony:    t("amenities.balcony"),
                parking:    t("amenities.parking"),
                security:   t("amenities.security"),
                concierge:  t("amenities.concierge"),
                wheelchair: t("amenities.wheelchair"),
                elevator:   t("amenities.elevator"),
                groupEssentials: t("amenities.groupEssentials"),
                groupOutdoors:   t("amenities.groupOutdoors"),
                groupSafety:     t("amenities.groupSafety"),
                showAll:    t.raw("amenities.showAll") as string,
                showLess:   t("amenities.showLess"),
              }}
            />
          </div>

          <Separator />

          {/* Location */}
          <div id="location-section" className="scroll-mt-24">
            <StayLocationSection
              address={stay.address}
              neighborhood={stay.neighborhood}
              city={stay.city}
              region={stay.region}
              country={stay.country}
              location={stay.location}
              locationNotes={stay.locationNotes}
              lat={stay.latitude}
              lng={stay.longitude}
              labels={{
                title:      t("location.title"),
                viewOnMaps: t("location.viewOnMaps"),
              }}
            />
          </div>
        </div>

        {/* ── Right: booking card ── */}
        <div id="booking-card">
          <StayBookingCard
            stayId={stay.id}
            price={stay.price}
            cleaningFee={stay.cleaningFee ?? 0}
            weeklyDiscount={stay.weeklyDiscount ?? 0}
            monthlyDiscount={stay.monthlyDiscount ?? 0}
            averageRating={stay.averageRating}
            nbReviews={stay.nbReviews}
            minStayNights={stay.minStayNights}
            maxGuests={stay.guestCount}
            cancelationPolicy={stay.cancelationPolicy}
            labels={{
              perNight:    t("perNight"),
              cleaningFee: t("cleaningFee"),
              serviceFee:  t("serviceFee"),
              taxes:       t("taxes"),
              discount:    t("discount"),
              total:       t("total"),
              bookNow:     t("bookNow"),
              bookingNote: t("bookingNote"),
              reviews:     t("reviews"),
              adults:      t("booking.adults"),
              children:    t("booking.children"),
              checkIn:     t("booking.checkIn"),
              checkOut:    t("booking.checkOut"),
              freeCancel:  t("highlights.freeCancel"),
              minNights:   t("minNights", { n: stay.minStayNights }),
              night:       t("night"),
              nights:      t("nights"),
              maxGuests:   t("booking.maxGuests"),
            }}
          />
        </div>
      </div>

      {/* ── Guidni Review ── */}
      {guidniReview && (
        <>
          <Separator className="my-10" />
          <GuidniReviewSection
            review={guidniReview}
            labels={{
              title:        t("guidniReview.title"),
              by:           t("guidniReview.by"),
              visited:      t("guidniReview.visited"),
              score:        t("guidniReview.score"),
              accuracy:     t("guidniReview.accuracy"),
              quality:      t("guidniReview.quality"),
              value:        t("guidniReview.value"),
              presentation: t("guidniReview.presentation"),
              host:         t("guidniReview.host"),
              fullReview:   t("guidniReview.fullReview"),
              loved:        t("guidniReview.loved"),
              worth:        t("guidniReview.worth"),
              bestFor:      t("guidniReview.bestFor"),
              partnerReply: t("guidniReview.partnerReply"),
              outOf:        t("guidniReview.outOf"),
            }}
          />
        </>
      )}

      {/* ── Reviews ── */}
      <Separator className="my-10" />

      <div id="reviews-section" className="space-y-8 scroll-mt-24">
        <h2 className="text-xl font-semibold text-gray-900">
          {t("reviewsTitle")}{reviews.length > 0 && ` (${reviews.length})`}
        </h2>

        {(stay.averageRating ?? 0) > 0 && reviews.length >= 2 && (
          <>
            <RatingSummary
              averageRating={stay.averageRating!}
              nbReviews={stay.nbReviews}
              reviews={reviews}
              labels={{ reviews: t("reviews"), outOf: t("outOf") }}
            />
            <Separator />
          </>
        )}

        <ReviewsSection
          reviews={reviews}
          noReviewsLabel={t("noReviews")}
          canReview={canReview}
          listingId={stay.id}
          relationType="STAY"
          listingTitle={title}
          partnerReplyLabel={t("reviewForm.partnerReply")}
          reviewFormLabels={{
            buttonLabel:        t("reviewForm.buttonLabel"),
            dialogTitle:        t("reviewForm.dialogTitle"),
            ratingLabel:        t("reviewForm.ratingLabel"),
            titleLabel:         t("reviewForm.titleLabel"),
            titlePlaceholder:   t("reviewForm.titlePlaceholder"),
            commentLabel:       t("reviewForm.commentLabel"),
            commentPlaceholder: t("reviewForm.commentPlaceholder"),
            submit:             t("reviewForm.submit"),
            submitting:         t("reviewForm.submitting"),
            cancel:             t("reviewForm.cancel"),
            success:            t("reviewForm.success"),
          }}
        />
      </div>

      {/* ── Things to know ── */}
      <Separator className="my-10" />

      <StayThingsToKnow
        checkInTime={stay.checkInTime}
        checkOutTime={stay.checkOutTime}
        isPetFriendly={stay.isPetFriendly}
        isSmokeFree={stay.isSmokeFree}
        cancelationPolicy={stay.cancelationPolicy}
        labels={{
          title:         t("thingsToKnow.title"),
          houseRules:    t("thingsToKnow.houseRules"),
          safety:        t("thingsToKnow.safety"),
          cancellation:  t("thingsToKnow.cancellation"),
          checkIn:       t("houseRules.checkIn"),
          checkOut:      t("houseRules.checkOut"),
          after:         t("houseRules.after"),
          before:        t("houseRules.before"),
          pets:          t("houseRules.pets"),
          smoking:       t("houseRules.smoking"),
          allowed:       t("houseRules.allowed"),
          notAllowed:    t("houseRules.notAllowed"),
          safetyItems:   [
            t("thingsToKnow.safetyItem1"),
            t("thingsToKnow.safetyItem2"),
            t("thingsToKnow.safetyItem3"),
          ],
          cancelPolicies,
        }}
      />

      {/* ── Related stays ── */}
      {relatedStays.length > 0 && (
        <>
          <Separator className="my-10" />
          <StayRelatedSection
            stays={relatedStays}
            locale={locale}
            label={t("relatedTitle", { city: stay.destination?.city ?? "" })}
          />
        </>
      )}

      {/* ── Mobile booking bar ── */}
      <StayMobileBookingBar
        price={stay.price}
        averageRating={stay.averageRating}
        nbReviews={stay.nbReviews}
        labels={{
          perNight: t("perNight"),
          bookNow:  t("bookNow"),
          reviews:  t("reviews"),
        }}
      />

    </div>
  );
}
