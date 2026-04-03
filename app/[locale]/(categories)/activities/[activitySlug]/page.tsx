import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { FiMapPin, FiStar } from "react-icons/fi";
import { getActivityBySlug, getRelatedActivities } from "@/lib/actions/activities";
import { getReviews, hasCompletedBooking, hasReviewed } from "@/lib/actions/reviews";
import { getManualBadges, getGuidniReview } from "@/lib/actions/badges";
import { getAutoBadges } from "@/lib/utils/badge-utils";
import { BadgeList } from "@/components/badges/BadgeList";
import { GuidniReviewSection } from "@/components/badges/GuidniReviewSection";
import { ImageGallery } from "@/components/shared/ImageGallery";
import { RatingSummary } from "@/components/shared/RatingSummary";
import { ActivityBookingCard } from "@/components/activities/ActivityBookingCard";
import { ReviewsSection } from "@/components/activities/ReviewsSection";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { ShareButton } from "@/app/[locale]/(categories)/stays/[staySlug]/_components/ShareButton";
import { ActivityQuickFacts } from "./_components/ActivityQuickFacts";
import { ActivityHighlights } from "./_components/ActivityHighlights";
import { ActivityIncludes } from "./_components/ActivityIncludes";
import { ActivityPassCallout } from "./_components/ActivityPassCallout";
import { ActivityLocationSection } from "./_components/ActivityLocationSection";
import { ActivityGoodToKnow } from "./_components/ActivityGoodToKnow";
import { ActivityAnchorNav } from "./_components/ActivityAnchorNav";
import { ActivityMobileBookingBar } from "./_components/ActivityMobileBookingBar";
import { ActivityHostStrip } from "./_components/ActivityHostStrip";
import { ActivityRelatedSection } from "./_components/ActivityRelatedSection";
import { DescriptionWithToggle } from "@/components/shared/DescriptionWithToggle";
import { RelationType } from "@prisma/client";

type Params = Promise<{ locale: string; activitySlug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { activitySlug, locale } = await params;
  const activity = await getActivityBySlug(activitySlug);
  if (!activity) return { title: "Activity Not Found" };
  const title = locale === "ar" && activity.arabicTitle ? activity.arabicTitle : activity.title;
  return {
    title,
    description: activity.description.slice(0, 160),
    openGraph: { images: activity.images.map((img) => img.url) },
  };
}

function splitList(value: string | null | undefined): string[] {
  return value ? value.split(",").map((s) => s.trim()).filter(Boolean) : [];
}

export default async function ActivityPage({ params }: { params: Params }) {
  const { locale, activitySlug } = await params;

  const [activity, t] = await Promise.all([
    getActivityBySlug(activitySlug),
    getTranslations({ locale, namespace: "ActivityPage" }),
  ]);

  if (!activity) notFound();

  const [reviews, completedBooking, alreadyReviewed, manualBadges, guidniReview, relatedActivities] = await Promise.all([
    getReviews(activity.id, RelationType.ACTIVITY),
    hasCompletedBooking(activity.id, "ACTIVITY"),
    hasReviewed(activity.id, "ACTIVITY"),
    getManualBadges(activity.id, RelationType.ACTIVITY),
    getGuidniReview(activity.id, RelationType.ACTIVITY),
    activity.destinationId
      ? getRelatedActivities(activity.id, activity.destinationId)
      : Promise.resolve([]),
  ]);

  const autoBadges = getAutoBadges({ note: activity.note, nbReviews: activity.nbReviews });
  const allBadges = [...manualBadges, ...autoBadges];

  const canReview = completedBooking && !alreadyReviewed;

  const title = locale === "ar" && activity.arabicTitle ? activity.arabicTitle : activity.title;
  const description =
    locale === "ar" && activity.arabicDescription
      ? activity.arabicDescription
      : activity.description;

  const averageRating = activity.note ? parseFloat(activity.note) : null;

  const includes  = splitList(activity.includes);
  const excludes  = splitList(activity.excludes);
  const allowed   = splitList(activity.allowed);
  const forbidden = splitList(activity.forbidden);

  const hasPassDeals =
    activity.fixedInPasses.length > 0 || activity.optionalInPasses.length > 0;

  return (
    <div className="max-w-screen-xl mx-auto px-4 md:px-20 py-8 pb-16 lg:pb-16">

      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-5">
        <Link href={`/${locale}/activities`} className="hover:text-gray-700 transition-colors">
          {t("breadcrumb.activities")}
        </Link>
        <span>/</span>
        {activity.destination?.city && (
          <>
            <span className="hover:text-gray-700 transition-colors">
              {activity.destination.city}
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
            {activity.city && (
              <div className="flex items-center gap-1">
                <FiMapPin className="h-3.5 w-3.5" />
                <span>
                  {[activity.city, activity.region, activity.country]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            )}
            {averageRating && averageRating > 0 ? (
              <a href="#reviews-section" className="flex items-center gap-1 hover:underline">
                <FiStar className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                <span className="font-medium text-gray-700">{averageRating.toFixed(1)}</span>
                <span>· {activity.nbReviews} {t("reviews")}</span>
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
            listingId={activity.id}
            relationType="ACTIVITY"
            className="h-9 w-9 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors"
          />
        </div>
      </div>

      {/* ── Gallery ── */}
      <ImageGallery
        images={activity.images}
        title={title}
        allPhotosLabel={t("allPhotos")}
        photosLabel={t("photos")}
      />

      {/* ── Anchor navigation ── */}
      <ActivityAnchorNav
        hasIncludes={includes.length > 0 || excludes.length > 0 || allowed.length > 0 || forbidden.length > 0}
        hasGoodToKnow
        labels={{
          overview:  t("nav.overview"),
          includes:  t("nav.includes"),
          location:  t("nav.location"),
          reviews:   t("nav.reviews"),
          goodToKnow: t("nav.goodToKnow"),
        }}
      />

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 mt-10">

        {/* ── Left column ── */}
        <div className="space-y-8 min-w-0">

          {/* Quick facts */}
          <ActivityQuickFacts
            category={activity.category}
            duration={activity.duration}
            capacity={activity.capacity}
            guide={activity.guide}
            locale={locale}
            labels={{
              category:  t("quickFacts.category"),
              duration:  t("quickFacts.duration"),
              groupSize: t("quickFacts.groupSize"),
              languages: t("quickFacts.languages"),
              maxGroup:  t("quickFacts.maxGroup", { n: activity.capacity }),
            }}
          />

          <Separator />

          {/* Highlights */}
          <ActivityHighlights
            activity={activity}
            labels={{
              freeCancel: t("highlights.freeCancel"),
              payLater:   t("highlights.payLater"),
              smallGroup: t("highlights.smallGroup"),
              guided:     t("highlights.guided"),
              topRated:   t("highlights.topRated"),
            }}
          />

          <Separator />

          {/* Host strip */}
          <ActivityHostStrip
            name={activity.businessProfile.name}
            profileImage={activity.businessProfile.profileImage}
            createdAt={activity.businessProfile.createdAt}
            isVerified={activity.businessProfile.isVerified}
            labels={{
              hostedBy:   t("hostedBy"),
              memberSince: t("memberSince"),
            }}
          />

          <Separator />

          {/* Description */}
          <div id="about-section">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t("about")}</h2>
            <DescriptionWithToggle
              text={description}
              showMoreLabel={t("showMore")}
              showLessLabel={t("showLess")}
            />
          </div>

          {(includes.length > 0 || excludes.length > 0 || allowed.length > 0 || forbidden.length > 0) && (
            <>
              <Separator />
              <div id="includes-section">
                <ActivityIncludes
                  includes={includes}
                  excludes={excludes}
                  allowed={allowed}
                  forbidden={forbidden}
                  labels={{
                    includes: t("includes"),
                    excludes: t("excludes"),
                    allowed:  t("allowed"),
                    forbidden: t("forbidden"),
                  }}
                />
              </div>
            </>
          )}

          {hasPassDeals && (
            <>
              <Separator />
              <ActivityPassCallout
                locale={locale}
                labels={{
                  title:    t("passCallout.title"),
                  subtitle: t("passCallout.subtitle"),
                  cta:      t("passCallout.cta"),
                }}
              />
            </>
          )}

          <Separator />

          {/* Meeting point */}
          <div id="location-section">
            <ActivityLocationSection
              address={activity.address}
              city={activity.city}
              region={activity.region}
              country={activity.country}
              location={activity.location}
              labels={{
                title:      t("location.title"),
                viewOnMaps: t("location.viewOnMaps"),
              }}
            />
          </div>

          <Separator />

          {/* Good to know */}
          <div id="good-to-know-section">
            <ActivityGoodToKnow
              cancelation={activity.cancelation}
              paynow={activity.paynow}
              capacity={activity.capacity}
              labels={{
                title:               t("goodToKnow.title"),
                cancellationTitle:   t("goodToKnow.cancellationTitle"),
                cancellationFree:    t("goodToKnow.cancellationFree"),
                cancellationStrict:  t("goodToKnow.cancellationStrict"),
                paymentTitle:        t("goodToKnow.paymentTitle"),
                paymentLater:        t("goodToKnow.paymentLater"),
                paymentNow:          t("goodToKnow.paymentNow"),
                groupTitle:          t("goodToKnow.groupTitle"),
                maxGroup:            t("goodToKnow.maxGroup", { n: activity.capacity }),
              }}
            />
          </div>
        </div>

        {/* ── Right: booking card ── */}
        <div id="booking-card">
          <ActivityBookingCard
            activityId={activity.id}
            price={activity.price}
            capacity={activity.capacity}
            cancelation={activity.cancelation}
            paynow={activity.paynow}
            averageRating={averageRating}
            nbReviews={activity.nbReviews}
            labels={{
              perPerson:         t("perPerson"),
              date:              t("booking.date"),
              pickDate:          t("booking.pickDate"),
              adults:            t("booking.adults"),
              children:          t("booking.children"),
              checkAvailability: t("booking.checkAvailability"),
              checking:          t("booking.checking"),
              selectTime:        t("booking.selectTime"),
              serviceFee:        t("booking.serviceFee"),
              taxes:             t("booking.taxes"),
              total:             t("booking.total"),
              bookNow:           t("booking.bookNow"),
              noAvailability:    t("booking.noAvailability"),
              errorMessage:      t("booking.errorMessage"),
              back:              t("booking.back"),
              reviews:           t("reviews"),
              freeCancel:        t("highlights.freeCancel"),
              payLater:          t("highlights.payLater"),
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

      <div id="reviews-section" className="space-y-8">
        <h2 className="text-xl font-semibold text-gray-900">
          {t("reviewsTitle")} ({reviews.length})
        </h2>

        {averageRating && averageRating > 0 && reviews.length >= 2 && (
          <>
            <RatingSummary
              averageRating={averageRating}
              nbReviews={activity.nbReviews}
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
          listingId={activity.id}
          relationType="ACTIVITY"
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

      {/* ── Related activities ── */}
      {relatedActivities.length > 0 && (
        <>
          <Separator className="my-10" />
          <ActivityRelatedSection
            activities={relatedActivities}
            locale={locale}
            label={t("relatedTitle", { city: activity.destination?.city ?? "" })}
          />
        </>
      )}

      {/* ── Mobile booking bar ── */}
      <ActivityMobileBookingBar
        price={activity.price}
        averageRating={averageRating}
        nbReviews={activity.nbReviews}
        labels={{
          perPerson: t("perPerson"),
          bookNow:   t("booking.bookNow"),
          reviews:   t("reviews"),
        }}
      />

    </div>
  );
}
