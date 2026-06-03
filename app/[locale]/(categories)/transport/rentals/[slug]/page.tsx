import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { TbCar } from "react-icons/tb";
import { FiMapPin, FiStar } from "react-icons/fi";
import { Separator } from "@/components/ui/separator";
import { getRentalBySlug, getRelatedRentals, getPublicRentalUnavailableDates } from "@/lib/actions/rentals";
import { PLATFORM_CURRENCY } from "@/lib/utils/constants";
import { getReviews, hasReviewed, hasCompletedBooking } from "@/lib/actions/reviews";
import { isInWishlist } from "@/lib/actions/wishlist";
import { getManualBadges, getGuidniReview } from "@/lib/actions/badges";
import { getAutoBadges } from "@/lib/utils/badge-utils";
import { BadgeList } from "@/components/badges/BadgeList";
import { GuidniReviewSection } from "@/components/badges/GuidniReviewSection";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { ShareButton } from "@/app/[locale]/(categories)/stays/[staySlug]/_components/ShareButton";
import { ReviewsSection } from "@/components/activities/ReviewsSection";
import { RatingSummary } from "@/components/shared/RatingSummary";
import { DescriptionWithToggle } from "@/components/shared/DescriptionWithToggle";
import { ImageGallery } from "@/components/shared/ImageGallery";
import { DetailPageTracker } from "@/components/shared/DetailPageTracker";
import { RelationType } from "@prisma/client";
import { RentalAnchorNav } from "./_components/RentalAnchorNav";
import { RentalMobileBar } from "./_components/RentalMobileBar";
import { RentalBookingWidget } from "./_components/RentalBookingWidget";
import { RentalRelatedSection } from "./_components/RentalRelatedSection";
import { RentalQuickFacts } from "./_components/RentalQuickFacts";
import { RentalHostStrip } from "./_components/RentalHostStrip";
import { RentalHighlights } from "./_components/RentalHighlights";

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const rental = await getRentalBySlug(slug);
  if (!rental) return { title: "Not found" };
  return {
    title: `${rental.title} · Guidni Rentals`,
    description: rental.description.slice(0, 160),
    openGraph: { images: rental.images.map((i) => i.url) },
  };
}

export default async function RentalDetailPage({ params }: { params: Params }) {
  const { locale, slug } = await params;

  const [rental, t] = await Promise.all([
    getRentalBySlug(slug),
    getTranslations({ locale, namespace: "TransportPage" }),
  ]);
  if (!rental) notFound();

  const [reviews, alreadyReviewed, completedBooking, wishlisted, manualBadges, guidniReview, relatedRentals, unavailableDates] =
    await Promise.all([
      getReviews(rental.id, RelationType.RENTAL),
      hasReviewed(rental.id, "RENTAL"),
      hasCompletedBooking(rental.id, "RENTAL"),
      isInWishlist(rental.id, "RENTAL"),
      getManualBadges(rental.id, RelationType.RENTAL),
      getGuidniReview(rental.id, RelationType.RENTAL),
      rental.destinationId
        ? getRelatedRentals(rental.id, rental.destinationId)
        : Promise.resolve([]),
      getPublicRentalUnavailableDates(rental.id),
    ]);

  const canReview = completedBooking && !alreadyReviewed;

  const autoBadges = getAutoBadges({ note: rental.note, nbReviews: rental.nbReviews });
  const allBadges = [...manualBadges, ...autoBadges];

  const averageRating = rental.note ? parseFloat(rental.note) : null;

  const TYPE_LABELS: Record<string, string> = {
    CAR:       t("rental.typeCar"),
    MOTORBIKE: t("rental.typeMotorbike"),
    SCOOTER:   t("rental.typeScooter"),
    BICYCLE:   t("rental.typeBicycle"),
    BOAT:      t("rental.typeBoat"),
    QUAD:      t("rental.typeQuad"),
    BUGGY:     t("rental.typeBuggy"),
    JET_SKI:   t("rental.typeJetSki"),
    OTHER:     t("rental.typeOther"),
  };

  const features = [
    rental.transmission && (t.raw("rental.transmission") as string).replace("{v}", rental.transmission),
    rental.fuelType     && (t.raw("rental.fuelType") as string).replace("{v}", rental.fuelType),
    rental.hasAC        && t("rental.hasAC"),
    rental.hasGPS       && t("rental.hasGPS"),
    rental.hasInsurance && t("rental.hasInsurance"),
    rental.requiresLicense && t("rental.requiresLicense"),
  ].filter(Boolean) as string[];

  const reviewFormLabels = {
    buttonLabel:        t("reviews.writeReview"),
    dialogTitle:        t("reviews.dialogTitle"),
    ratingLabel:        t("reviews.ratingLabel"),
    titleLabel:         t("reviews.titleLabel"),
    titlePlaceholder:   t("reviews.titlePlaceholder"),
    commentLabel:       t("reviews.commentLabel"),
    commentPlaceholder: t("reviews.commentPlaceholder"),
    submit:             t("reviews.submit"),
    submitting:         t("reviews.submitting"),
    cancel:             t("reviews.cancel"),
    success:            t("reviews.success"),
  };

  const widgetLabels = {
    perDay:           t("rental.widget.perDay"),
    pickupDate:       t("rental.widget.pickupDate"),
    returnDate:       t("rental.widget.returnDate"),
    notes:            t("rental.widget.notes"),
    notesPlaceholder: t("rental.widget.notesPlaceholder"),
    reserve:          t("rental.widget.reserve"),
    reserving:        t("rental.widget.reserving"),
    total:            t("rental.widget.total"),
    minDays:          t.raw("rental.widget.minDays") as string,
    noCharge:         t("rental.widget.noCharge"),
    doneTitle:        t("rental.widget.doneTitle"),
    doneMessage:      t("rental.widget.doneMessage"),
    pickDateErr:      t("rental.widget.pickDateErr"),
    minDaysErr:       t.raw("rental.widget.minDaysErr") as string,
    unavailableRange: t("rental.widget.unavailableRange"),
    viewBooking:      t("rental.widget.viewBooking"),
    bookAgain:        t("rental.widget.bookAgain"),
  };

  const hasHighlights = rental.hasAC || rental.hasGPS || rental.hasInsurance ||
    (rental.note != null && parseFloat(rental.note) >= 4.5);

  return (
    <div className="max-w-screen-xl mx-auto px-4 md:px-20 py-8 pb-16 lg:pb-16">
      <DetailPageTracker listingId={rental.id} listingType="RENTAL" />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-5">
        <Link href={`/${locale}/transport`} className="hover:text-gray-700 transition-colors">
          {t("rental.breadcrumb")}
        </Link>
        <span>/</span>
        {rental.destination?.city && (
          <>
            <span className="hover:text-gray-700 transition-colors">{rental.destination.city}</span>
            <span>/</span>
          </>
        )}
        <span className="text-gray-700 font-medium truncate max-w-xs">{rental.title}</span>
      </nav>

      {/* Title + actions row */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1 rounded-full">
              {TYPE_LABELS[rental.type] ?? rental.type}
            </span>
            {allBadges.length > 0 && <BadgeList badges={allBadges} detailPage />}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-2">
            {rental.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            {(rental.city || rental.country) && (
              <div className="flex items-center gap-1">
                <FiMapPin className="h-3.5 w-3.5" />
                <span>{[rental.city, rental.country].filter(Boolean).join(", ")}</span>
              </div>
            )}
            {averageRating && averageRating > 0 && rental.nbReviews > 0 && (
              <a href="#reviews-section" className="flex items-center gap-1 hover:underline">
                <FiStar className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                <span className="font-medium text-gray-700">{averageRating.toFixed(1)}</span>
                <span>· {rental.nbReviews} {t("reviews.title").toLowerCase()}</span>
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ShareButton
            title={rental.title}
            shareLabel={t("rental.share")}
            copiedLabel={t("rental.shareCopied")}
            className="h-9 w-9 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors"
          />
          <WishlistButton
            listingId={rental.id}
            relationType="RENTAL"
            initialIsWishlisted={wishlisted}
            className="h-9 w-9 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors"
          />
        </div>
      </div>

      {/* Gallery */}
      {rental.images.length > 0 ? (
        <ImageGallery
          images={rental.images}
          title={rental.title}
          allPhotosLabel={t("rental.allPhotos")}
          photosLabel={t("rental.photos")}
          listingId={rental.id}
          listingType="RENTAL"
        />
      ) : (
        <div className="h-72 sm:h-96 bg-gray-100 rounded-2xl flex items-center justify-center mb-2">
          <TbCar className="h-24 w-24 text-gray-300" />
        </div>
      )}

      {/* Anchor nav */}
      <RentalAnchorNav
        labels={{
          overview: t("rental.nav.overview"),
          features: t("rental.nav.features"),
          reviews:  t("rental.nav.reviews"),
        }}
      />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 mt-10">

        {/* Left column */}
        <div className="space-y-8 min-w-0">

          {/* Quick facts */}
          <RentalQuickFacts
            type={rental.type}
            capacity={rental.capacity}
            brand={rental.brand}
            model={rental.model}
            transmission={rental.transmission}
            labels={{
              type:         t("rental.quickFacts.type"),
              seats:        t("rental.quickFacts.seats"),
              vehicle:      t("rental.quickFacts.vehicle"),
              transmission: t("rental.quickFacts.transmission"),
              typeLabels:   TYPE_LABELS,
            }}
          />

          <Separator />

          {/* Highlights */}
          {hasHighlights && (
            <>
              <RentalHighlights
                hasAC={rental.hasAC}
                hasGPS={rental.hasGPS}
                hasInsurance={rental.hasInsurance}
                note={rental.note}
                labels={{
                  ac:        t("rental.highlights.ac"),
                  gps:       t("rental.highlights.gps"),
                  insurance: t("rental.highlights.insurance"),
                  topRated:  t("rental.highlights.topRated"),
                }}
              />
              <Separator />
            </>
          )}

          {/* Host strip */}
          {rental.businessProfile && (
            <>
              <RentalHostStrip
                name={rental.businessProfile.name}
                profileImage={rental.businessProfile.profileImage ?? null}
                createdAt={rental.businessProfile.createdAt}
                isVerified={rental.businessProfile.isVerified}
                labels={{
                  hostedBy:    t("rental.hostStrip.hostedBy"),
                  memberSince: t("rental.hostStrip.memberSince"),
                }}
              />
              <Separator />
            </>
          )}

          {/* Description */}
          <div id="overview-section" className="scroll-mt-24">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t("rental.about")}</h2>
            <DescriptionWithToggle
              text={rental.description}
              showMoreLabel={t("rental.showMore")}
              showLessLabel={t("rental.showLess")}
            />
          </div>

          {/* Features */}
          {features.length > 0 && (
            <>
              <Separator />
              <div id="features-section" className="scroll-mt-24">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t("rental.featuresTitle")}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">✓</span>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

        </div>

        {/* Right column — booking widget */}
        <div id="booking-card">
          <RentalBookingWidget
            rentalId={rental.id}
            pricePerDay={rental.pricePerDay}
            minDays={rental.minDays}
            unavailableDates={unavailableDates}
            labels={widgetLabels}
          />

          {/* Pricing info card */}
          <div className="mt-4 bg-white border border-gray-100 rounded-2xl p-5 space-y-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>{t("rental.pricePerDay")}</span>
              <span className="font-semibold text-gray-900">{rental.pricePerDay} {PLATFORM_CURRENCY}</span>
            </div>
            {rental.pricePerHour && (
              <div className="flex justify-between text-gray-600">
                <span>{t("rental.pricePerHour")}</span>
                <span className="font-semibold text-gray-900">{rental.pricePerHour} {PLATFORM_CURRENCY}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>{t("rental.minRental")}</span>
              <span className="font-semibold text-gray-900">
                {rental.minDays} {rental.minDays === 1 ? t("rental.day") : t("rental.days")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Full-width sections below two-column grid ── */}

      {/* Guidni Review */}
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

      {/* Reviews */}
      <Separator className="my-10" />

      <div id="reviews-section" className="scroll-mt-24 space-y-8">
        <h2 className="text-xl font-semibold text-gray-900">
          {t("reviews.title")}{reviews.length > 0 && ` (${reviews.length})`}
        </h2>

        {averageRating && averageRating > 0 && reviews.length >= 2 && (
          <>
            <RatingSummary
              averageRating={averageRating}
              nbReviews={rental.nbReviews}
              reviews={reviews}
              labels={{ reviews: t("reviews.title"), outOf: t("rental.outOf") }}
            />
            <Separator />
          </>
        )}

        <ReviewsSection
          reviews={reviews}
          noReviewsLabel={t("reviews.noReviews")}
          canReview={canReview}
          listingId={rental.id}
          relationType="RENTAL"
          listingTitle={rental.title}
          reviewFormLabels={reviewFormLabels}
          partnerReplyLabel={t("reviews.partnerReply")}
        />
      </div>

      {/* Related */}
      {relatedRentals.length > 0 && (
        <>
          <Separator className="my-10" />
          <RentalRelatedSection
            rentals={relatedRentals}
            locale={locale}
            title={t("rental.relatedTitle")}
            perDay={t("rental.widget.perDay")}
          />
        </>
      )}

      {/* Mobile bottom bar */}
      <RentalMobileBar
        note={rental.note}
        nbReviews={rental.nbReviews}
        pricePerDay={rental.pricePerDay}
        labels={{
          reserve: t("rental.widget.reserve"),
          reviews: t("reviews.title"),
          perDay:  t("rental.widget.perDay"),
        }}
      />
    </div>
  );
}
