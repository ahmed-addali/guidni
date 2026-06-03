import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { TbRoute } from "react-icons/tb";
import { FiMapPin, FiStar } from "react-icons/fi";
import { Separator } from "@/components/ui/separator";
import { getTransferBySlug, getRelatedTransfers, getPublicTransferUnavailableDates, getTransferBookedSlots } from "@/lib/actions/transfers";
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
import { TransferAnchorNav } from "./_components/TransferAnchorNav";
import { TransferMobileBar } from "./_components/TransferMobileBar";
import { TransferBookingWidget } from "./_components/TransferBookingWidget";
import { TransferRelatedSection } from "./_components/TransferRelatedSection";
import { TransferQuickFacts } from "./_components/TransferQuickFacts";
import { TransferHostStrip } from "./_components/TransferHostStrip";
import { TransferHighlights } from "./_components/TransferHighlights";

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const transfer = await getTransferBySlug(slug);
  if (!transfer) return { title: "Not found" };
  return {
    title: `${transfer.title} · Guidni Transport`,
    description: transfer.description?.slice(0, 160),
    openGraph: { images: transfer.images.map((i) => i.url) },
  };
}

export default async function TransferDetailPage({ params }: { params: Params }) {
  const { locale, slug } = await params;

  const [transfer, t] = await Promise.all([
    getTransferBySlug(slug),
    getTranslations({ locale, namespace: "TransportPage" }),
  ]);
  if (!transfer) notFound();

  const [reviews, alreadyReviewed, completedBooking, wishlisted, manualBadges, guidniReview, relatedTransfers, unavailableDates, bookedSlots] =
    await Promise.all([
      getReviews(transfer.id, RelationType.TRANSFER),
      hasReviewed(transfer.id, "TRANSFER"),
      hasCompletedBooking(transfer.id, "TRANSFER"),
      isInWishlist(transfer.id, "TRANSFER"),
      getManualBadges(transfer.id, RelationType.TRANSFER),
      getGuidniReview(transfer.id, RelationType.TRANSFER),
      transfer.destinationId
        ? getRelatedTransfers(transfer.id, transfer.destinationId)
        : Promise.resolve([]),
      getPublicTransferUnavailableDates(transfer.id),
      getTransferBookedSlots(transfer.id),
    ]);

  const canReview = completedBooking && !alreadyReviewed;

  const autoBadges = getAutoBadges({ note: transfer.note, nbReviews: transfer.nbReviews });
  const allBadges = [...manualBadges, ...autoBadges];

  const averageRating = transfer.note ? parseFloat(transfer.note) : null;

  const TYPE_LABELS: Record<string, string> = {
    AIRPORT_TRANSFER: t("transfer.typeAirport"),
    TAXI:             t("transfer.typeTaxi"),
    CHAUFFEUR:        t("transfer.typeChauffeur"),
    SHUTTLE:          t("transfer.typeShuttle"),
  };

  const features = [
    transfer.isAC        && t("transfer.featureAC"),
    transfer.isMeetGreet && t("transfer.featureMeetGreet"),
    transfer.isChildSeat && t("transfer.featureChildSeat"),
    transfer.languages   && (t.raw("transfer.featureLanguages") as string).replace("{v}", transfer.languages),
    transfer.vehicleType && (t.raw("transfer.featureVehicleType") as string).replace("{v}", transfer.vehicleType),
    transfer.brand && transfer.model &&
      `${transfer.brand} ${transfer.model}${transfer.year ? ` (${transfer.year})` : ""}`,
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
    perTrip:             t("transfer.widget.perTrip"),
    perHour:             t("transfer.widget.perHour"),
    perPerson:           t("transfer.widget.perPerson"),
    date:                t("transfer.widget.date"),
    time:                t("transfer.widget.time"),
    pickup:              t("transfer.widget.pickup"),
    pickupPlaceholder:   t("transfer.widget.pickupPlaceholder"),
    dropoff:             t("transfer.widget.dropoff"),
    dropoffOptional:     t("transfer.widget.dropoffOptional"),
    dropoffPlaceholder:  t("transfer.widget.dropoffPlaceholder"),
    flightNumber:        t("transfer.widget.flightNumber"),
    flightPlaceholder:   t("transfer.widget.flightPlaceholder"),
    hours:               t("transfer.widget.hours"),
    passengers:          t("transfer.widget.passengers"),
    contactName:         t("transfer.widget.contactName"),
    namePlaceholder:     t("transfer.widget.namePlaceholder"),
    contactPhone:        t("transfer.widget.contactPhone"),
    phonePlaceholder:    t("transfer.widget.phonePlaceholder"),
    notes:               t("transfer.widget.notes"),
    notesPlaceholder:    t("transfer.widget.notesPlaceholder"),
    total:               t("transfer.widget.total"),
    book:                t("transfer.widget.book"),
    booking:             t("transfer.widget.booking"),
    noCharge:            t("transfer.widget.noCharge"),
    doneTitle:           t("transfer.widget.doneTitle"),
    doneMessage:         t("transfer.widget.doneMessage"),
    errDateTime:         t("transfer.widget.errDateTime"),
    errPickup:           t("transfer.widget.errPickup"),
    errName:             t("transfer.widget.errName"),
    errMinHour:          t("transfer.widget.errMinHour"),
    errTimeConflict:     t("transfer.widget.errTimeConflict"),
    viewBooking:         t("transfer.widget.viewBooking"),
    bookAgain:           t("transfer.widget.bookAgain"),
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 md:px-20 py-8 pb-16 lg:pb-16">
      <DetailPageTracker listingId={transfer.id} listingType="TRANSFER" />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-5">
        <Link href={`/${locale}/transport?service=transfers`} className="hover:text-gray-700 transition-colors">
          {t("transfer.breadcrumb")}
        </Link>
        <span>/</span>
        {transfer.destination?.city && (
          <>
            <span className="hover:text-gray-700 transition-colors">{transfer.destination.city}</span>
            <span>/</span>
          </>
        )}
        <span className="text-gray-700 font-medium truncate max-w-xs">{transfer.title}</span>
      </nav>

      {/* Title + actions row */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1 rounded-full">
              {TYPE_LABELS[transfer.type] ?? transfer.type}
            </span>
            {allBadges.length > 0 && <BadgeList badges={allBadges} detailPage />}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-2">
            {transfer.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            {(transfer.city || transfer.country) && (
              <div className="flex items-center gap-1">
                <FiMapPin className="h-3.5 w-3.5" />
                <span>{[transfer.city, transfer.country].filter(Boolean).join(", ")}</span>
              </div>
            )}
            {averageRating && averageRating > 0 && transfer.nbReviews > 0 && (
              <a href="#reviews-section" className="flex items-center gap-1 hover:underline">
                <FiStar className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                <span className="font-medium text-gray-700">{averageRating.toFixed(1)}</span>
                <span>· {transfer.nbReviews} {t("reviews.title").toLowerCase()}</span>
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ShareButton
            title={transfer.title}
            shareLabel={t("transfer.share")}
            copiedLabel={t("transfer.shareCopied")}
            className="h-9 w-9 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors"
          />
          <WishlistButton
            listingId={transfer.id}
            relationType="TRANSFER"
            initialIsWishlisted={wishlisted}
            className="h-9 w-9 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors"
          />
        </div>
      </div>

      {/* Gallery */}
      {transfer.images.length > 0 ? (
        <ImageGallery
          images={transfer.images}
          title={transfer.title}
          allPhotosLabel={t("transfer.allPhotos")}
          photosLabel={t("transfer.photos")}
          listingId={transfer.id}
          listingType="TRANSFER"
        />
      ) : (
        <div className="h-72 sm:h-96 bg-gray-100 rounded-2xl flex items-center justify-center mb-2">
          <TbRoute className="h-24 w-24 text-gray-300" />
        </div>
      )}

      {/* Anchor nav */}
      <TransferAnchorNav
        labels={{
          overview: t("transfer.nav.overview"),
          features: t("transfer.nav.features"),
          reviews:  t("transfer.nav.reviews"),
        }}
      />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 mt-10">

        {/* Left column */}
        <div className="space-y-8 min-w-0">

          {/* Quick facts */}
          <TransferQuickFacts
            type={transfer.type}
            capacity={transfer.capacity}
            vehicleType={transfer.vehicleType}
            languages={transfer.languages}
            labels={{
              type:        t("transfer.quickFacts.type"),
              capacity:    t("transfer.quickFacts.capacity"),
              vehicleType: t("transfer.quickFacts.vehicleType"),
              languages:   t("transfer.quickFacts.languages"),
              typeLabels:  TYPE_LABELS,
            }}
          />

          <Separator />

          {/* Highlights */}
          <TransferHighlights
            isAC={transfer.isAC}
            isMeetGreet={transfer.isMeetGreet}
            isChildSeat={transfer.isChildSeat}
            note={transfer.note}
            labels={{
              ac:        t("transfer.highlights.ac"),
              meetGreet: t("transfer.highlights.meetGreet"),
              childSeat: t("transfer.highlights.childSeat"),
              topRated:  t("transfer.highlights.topRated"),
            }}
          />

          {(transfer.isAC || transfer.isMeetGreet || transfer.isChildSeat || (transfer.note && parseFloat(transfer.note) >= 4.5)) && (
            <Separator />
          )}

          {/* Host strip */}
          {transfer.businessProfile && (
            <>
              <TransferHostStrip
                name={transfer.businessProfile.name}
                profileImage={transfer.businessProfile.profileImage ?? null}
                createdAt={transfer.businessProfile.createdAt}
                isVerified={transfer.businessProfile.isVerified}
                labels={{
                  hostedBy:    t("transfer.hostStrip.hostedBy"),
                  memberSince: t("transfer.hostStrip.memberSince"),
                }}
              />
              <Separator />
            </>
          )}

          {/* Description */}
          <div id="overview-section" className="scroll-mt-24">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t("transfer.about")}</h2>
            {transfer.description && (
              <DescriptionWithToggle
                text={transfer.description}
                showMoreLabel={t("transfer.showMore")}
                showLessLabel={t("transfer.showLess")}
              />
            )}
          </div>

          {/* Features */}
          {features.length > 0 && (
            <>
              <Separator />
              <div id="features-section" className="scroll-mt-24">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t("transfer.featuresTitle")}</h2>
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
          <TransferBookingWidget
            transferId={transfer.id}
            type={transfer.type}
            pricePerTrip={transfer.pricePerTrip}
            pricePerHour={transfer.pricePerHour}
            pricePerPerson={transfer.pricePerPerson}
            capacity={transfer.capacity}
            locale={locale}
            unavailableDates={unavailableDates}
            bookedSlots={bookedSlots}
            labels={widgetLabels}
          />

          {/* Quick pricing card */}
          <div className="mt-4 bg-white border border-gray-100 rounded-2xl p-5 space-y-3 text-sm">
            {transfer.pricePerTrip != null && (
              <div className="flex justify-between text-gray-600">
                <span>{transfer.type === "SHUTTLE" ? t("transfer.pricePerTrip") : t("transfer.fixedRate")}</span>
                <span className="font-semibold text-gray-900">{transfer.pricePerTrip} TND</span>
              </div>
            )}
            {transfer.pricePerHour != null && (
              <div className="flex justify-between text-gray-600">
                <span>{t("transfer.pricePerHour")}</span>
                <span className="font-semibold text-gray-900">{transfer.pricePerHour} TND</span>
              </div>
            )}
            {transfer.pricePerPerson != null && (
              <div className="flex justify-between text-gray-600">
                <span>{t("transfer.pricePerPerson")}</span>
                <span className="font-semibold text-gray-900">{transfer.pricePerPerson} TND</span>
              </div>
            )}
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
              nbReviews={transfer.nbReviews}
              reviews={reviews}
              labels={{ reviews: t("reviews.title"), outOf: t("transfer.outOf") }}
            />
            <Separator />
          </>
        )}

        <ReviewsSection
          reviews={reviews}
          noReviewsLabel={t("reviews.noReviews")}
          canReview={canReview}
          listingId={transfer.id}
          relationType="TRANSFER"
          listingTitle={transfer.title}
          reviewFormLabels={reviewFormLabels}
          partnerReplyLabel={t("reviews.partnerReply")}
        />
      </div>

      {/* Related */}
      {relatedTransfers.length > 0 && (
        <>
          <Separator className="my-10" />
          <TransferRelatedSection
            transfers={relatedTransfers}
            locale={locale}
            title={t("transfer.relatedTitle")}
            perTrip={t("transfer.widget.perTrip")}
            perHour={t("transfer.widget.perHour")}
          />
        </>
      )}

      {/* Mobile bottom bar */}
      <TransferMobileBar
        note={transfer.note}
        nbReviews={transfer.nbReviews}
        pricePerTrip={transfer.pricePerTrip}
        pricePerHour={transfer.pricePerHour}
        type={transfer.type}
        labels={{
          book:    t("transfer.widget.book"),
          reviews: t("reviews.title"),
          perTrip: t("transfer.widget.perTrip"),
          perHour: t("transfer.widget.perHour"),
        }}
      />
    </div>
  );
}
