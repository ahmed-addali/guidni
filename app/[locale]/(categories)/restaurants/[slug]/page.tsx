import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FiMapPin, FiStar } from "react-icons/fi";
import { Separator } from "@/components/ui/separator";
import { getRestaurantBySlug, getRelatedRestaurants } from "@/lib/actions/restaurants";
import { getReviews, hasReviewed, hasCompletedBooking } from "@/lib/actions/reviews";
import { getManualBadges, getGuidniReview } from "@/lib/actions/badges";
import { getAutoBadges } from "@/lib/utils/badge-utils";
import { BadgeList } from "@/components/badges/BadgeList";
import { GuidniReviewSection } from "@/components/badges/GuidniReviewSection";
import { RelationType } from "@prisma/client";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { ReviewsSection } from "@/components/activities/ReviewsSection";
import { RatingSummary } from "@/components/shared/RatingSummary";
import { DescriptionWithToggle } from "@/components/shared/DescriptionWithToggle";
import { ImageGallery } from "@/components/shared/ImageGallery";
import { ShareButton } from "@/app/[locale]/(categories)/stays/[staySlug]/_components/ShareButton";
import { RestaurantAnchorNav } from "./_components/RestaurantAnchorNav";
import { RestaurantInfoStrip } from "./_components/RestaurantInfoStrip";
import { RestaurantHoursCard } from "./_components/RestaurantHoursCard";
import { RestaurantLocationSection } from "./_components/RestaurantLocationSection";
import { RestaurantMobileBar } from "./_components/RestaurantMobileBar";
import { RestaurantRelatedSection } from "./_components/RestaurantRelatedSection";
import { ReservationWidget } from "./_components/ReservationWidget";

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) return {};
  return {
    title: restaurant.name,
    description: restaurant.description.slice(0, 160),
    openGraph: {
      images: [
        ...(restaurant.coverPhoto ? [restaurant.coverPhoto] : []),
        ...restaurant.images.map((i) => i.url),
      ],
    },
  };
}

export default async function RestaurantDetailPage({ params }: { params: Params }) {
  const { locale, slug } = await params;

  const [restaurant, t] = await Promise.all([
    getRestaurantBySlug(slug),
    getTranslations({ locale, namespace: "RestaurantPage" }),
  ]);
  if (!restaurant) notFound();

  const [reviews, alreadyReviewed, completedBooking, manualBadges, guidniReview, relatedRestaurants] =
    await Promise.all([
      getReviews(restaurant.id, RelationType.RESTAURANT),
      hasReviewed(restaurant.id, "RESTAURANT"),
      hasCompletedBooking(restaurant.id, "RESTAURANT"),
      getManualBadges(restaurant.id, RelationType.RESTAURANT),
      getGuidniReview(restaurant.id, RelationType.RESTAURANT),
      restaurant.destinationId
        ? getRelatedRestaurants(restaurant.id, restaurant.destinationId)
        : Promise.resolve([]),
    ]);

  const canReview = completedBooking && !alreadyReviewed;

  const autoBadges = getAutoBadges({ note: restaurant.note, nbReviews: restaurant.nbReviews });
  const allBadges = [...manualBadges, ...autoBadges];

  const name = locale === "ar" && restaurant.arabicName ? restaurant.arabicName : restaurant.name;
  const description =
    locale === "ar" && restaurant.arabicDescription
      ? restaurant.arabicDescription
      : restaurant.description;

  const allImages = [
    ...(restaurant.coverPhoto ? [restaurant.coverPhoto] : []),
    ...restaurant.images.map((i) => i.url),
  ];

  const location = [
    restaurant.destination?.city ?? restaurant.city,
    restaurant.country,
  ]
    .filter(Boolean)
    .join(", ");

  const rating = restaurant.note ? parseFloat(restaurant.note) : 0;

  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });

  const typeLabel =
    t(`type.${restaurant.type}` as Parameters<typeof t>[0]) ?? restaurant.type;

  return (
    <div className="max-w-screen-xl mx-auto px-4 md:px-20 py-8 pb-16 lg:pb-8">

      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-5">
        <Link href={`/${locale}/restaurants`} className="hover:text-gray-700 transition-colors">
          {t("breadcrumb")}
        </Link>
        {restaurant.destination?.city && (
          <>
            <span>/</span>
            <span className="hover:text-gray-700 transition-colors">
              {restaurant.destination.city}
            </span>
          </>
        )}
        <span>/</span>
        <span className="text-gray-700 font-medium truncate max-w-xs">{name}</span>
      </nav>

      {/* ── Title + action row ── */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-2">
            {name}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            {location && (
              <div className="flex items-center gap-1">
                <FiMapPin className="h-3.5 w-3.5" />
                <span>{location}</span>
              </div>
            )}
            {rating > 0 && restaurant.nbReviews > 0 && (
              <a href="#reviews-section" className="flex items-center gap-1 hover:underline">
                <FiStar className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                <span className="font-medium text-gray-700">{rating.toFixed(1)}</span>
                <span>· {restaurant.nbReviews} {t("reviews")}</span>
              </a>
            )}
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
            title={name}
            shareLabel={t("share")}
            copiedLabel={t("shareCopied")}
            className="h-9 w-9 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors"
          />
          <WishlistButton
            listingId={restaurant.id}
            relationType="RESTAURANT"
            className="h-9 w-9 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors"
          />
        </div>
      </div>

      {/* ── Gallery ── */}
      <ImageGallery
        images={allImages.map((url) => ({ url }))}
        title={name}
        allPhotosLabel={t("allPhotos")}
        photosLabel={t("photos")}
      />

      {/* ── Anchor nav ── */}
      <RestaurantAnchorNav
        labels={{
          overview:  t("nav.overview"),
          menu:      t("nav.menu"),
          location:  t("nav.location"),
          reviews:   t("nav.reviews"),
        }}
      />

      {/* ── Two-column grid ── */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">

        {/* ── Left column ── */}
        <div className="space-y-10 min-w-0">

          {/* Overview */}
          <div id="overview-section" className="scroll-mt-24 space-y-4">
            <RestaurantInfoStrip
              type={restaurant.type}
              typeLabel={typeLabel}
              category={restaurant.category}
              meals={restaurant.meals}
              foodTypes={restaurant.foodTypes}
              dietTypes={restaurant.dietTypes}
              attributes={restaurant.attributes}
            />
            <h2 className="text-xl font-semibold text-gray-900">{t("about")}</h2>
            <DescriptionWithToggle
              text={description}
              showMoreLabel={t("showMore")}
              showLessLabel={t("showLess")}
            />
          </div>

          <Separator />

          {/* Menu preview */}
          <div id="menu-section" className="scroll-mt-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {t("menu.title")}
                {restaurant.menu.length > 0 && (
                  <span className="text-sm font-normal text-gray-400 ml-2">
                    ({restaurant.menu.length})
                  </span>
                )}
              </h2>
              {restaurant.menu.length > 0 && (
                <a
                  href={`/${locale}/restaurants/${restaurant.slug}/menu`}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  {t("menu.viewFull")} →
                </a>
              )}
            </div>

            {restaurant.menu.length === 0 ? (
              <p className="text-sm text-gray-400 py-4">{t("menu.noMenu")}</p>
            ) : (
              <div className="space-y-2">
                {restaurant.menu.slice(0, 4).map((item) => {
                  const img = item.images?.[0]?.url ?? null;
                  return (
                    <a
                      key={item.id}
                      href={`/${locale}/restaurants/${restaurant.slug}/menu`}
                      className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
                    >
                      {img ? (
                        <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden">
                          <img src={img} alt={item.name} className="object-cover w-full h-full" />
                        </div>
                      ) : (
                        <div className="h-12 w-12 shrink-0 rounded-lg bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-300 text-xs">🍽</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-gray-400 truncate">{item.description}</p>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-gray-900 shrink-0">{item.price} TND</span>
                    </a>
                  );
                })}
                {restaurant.menu.length > 4 && (
                  <a
                    href={`/${locale}/restaurants/${restaurant.slug}/menu`}
                    className="flex items-center justify-center w-full py-3 rounded-xl border border-dashed border-gray-200 text-sm text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors"
                  >
                    {t("menu.viewFull")} ({restaurant.menu.length} {t("menu.items")}) →
                  </a>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Location */}
          <div id="location-section" className="scroll-mt-24">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t("location.title")}</h2>
            <RestaurantLocationSection
              address={restaurant.address}
              phone={restaurant.phone}
              location={restaurant.location}
              website={restaurant.website}
              instagram={restaurant.instagram}
              facebook={restaurant.facebook}
              labels={{
                viewOnMaps: t("location.viewOnMaps"),
                website:    t("location.website"),
                instagram:  t("location.instagram"),
                facebook:   t("location.facebook"),
              }}
            />
          </div>
        </div>

        {/* ── Right column ── */}
        <div id="reservation-widget" className="space-y-4">
          {restaurant.reservationsEnabled ? (
            <ReservationWidget
              restaurantId={restaurant.id}
              restaurantName={name}
              maxGuests={restaurant.maxGuests}
              locale={locale}
              labels={{
                title:           t("widget.title"),
                date:            t("widget.date"),
                time:            t("widget.time"),
                guests:          t("widget.guests"),
                maxGuests:       t.raw("widget.maxGuests") as string,
                notes:           t("widget.notes"),
                notesPlaceholder: t("widget.notesPlaceholder"),
                submit:          t("widget.submit"),
                submitting:      t("widget.submitting"),
                cancelNote:      t("widget.cancelNote"),
                successTitle:    t("widget.successTitle"),
                successMessage:  t.raw("widget.successMessage") as string,
              }}
            />
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-3">
              <h3 className="font-semibold text-gray-900">{t("visitCard.title")}</h3>
              {restaurant.address && (
                <p className="text-sm text-gray-600 flex items-start gap-2">
                  <FiMapPin className="h-4 w-4 shrink-0 mt-0.5 text-gray-400" />
                  {restaurant.address}
                </p>
              )}
              {restaurant.phone && (
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="text-gray-400 text-xs">📞</span>
                  <a href={`tel:${restaurant.phone}`} className="hover:text-primary transition-colors">
                    {restaurant.phone}
                  </a>
                </p>
              )}
              <p className="text-xs text-gray-400 pt-2 border-t border-gray-50">
                {t("visitCard.walkin")}
              </p>
            </div>
          )}

          <RestaurantHoursCard
            hours={restaurant.hours}
            todayName={todayName}
            labels={{
              title:   t("hours.title"),
              closed:  t("hours.closed"),
              open24h: t("hours.open24h"),
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

        {rating > 0 && reviews.length >= 2 && (
          <>
            <RatingSummary
              averageRating={rating}
              nbReviews={restaurant.nbReviews}
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
          listingId={restaurant.id}
          relationType="RESTAURANT"
          listingTitle={name}
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

      {/* ── Related restaurants ── */}
      {relatedRestaurants.length > 0 && (
        <>
          <Separator className="my-10" />
          <RestaurantRelatedSection
            restaurants={relatedRestaurants}
            locale={locale}
            label={t("relatedTitle", { city: restaurant.destination?.city ?? "" })}
          />
        </>
      )}

      {/* ── Mobile bar ── */}
      <RestaurantMobileBar
        note={restaurant.note}
        nbReviews={restaurant.nbReviews}
        reservationsEnabled={restaurant.reservationsEnabled}
        labels={{
          bookTable: t("mobileBar.bookTable"),
          viewMenu:  t("mobileBar.viewMenu"),
          reviews:   t("reviews"),
        }}
      />
    </div>
  );
}
