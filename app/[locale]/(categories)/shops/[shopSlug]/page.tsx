import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RelationType } from "@prisma/client";
import { Separator } from "@/components/ui/separator";
import { getShopBySlug, getRelatedShops } from "@/lib/actions/shops";
import { getReviews, hasCompletedBooking, hasReviewed } from "@/lib/actions/reviews";
import { isInWishlist } from "@/lib/actions/wishlist";
import { getManualBadges, getGuidniReview } from "@/lib/actions/badges";
import { getAutoBadges } from "@/lib/utils/badge-utils";
import { BadgeList } from "@/components/badges/BadgeList";
import { GuidniReviewSection } from "@/components/badges/GuidniReviewSection";
import { ReviewsSection } from "@/components/activities/ReviewsSection";
import { RatingSummary } from "@/components/shared/RatingSummary";
import { DetailPageTracker } from "@/components/shared/DetailPageTracker";
import { ShopCard } from "@/components/shops/ShopCard";
import { ShopHero } from "./_components/ShopHero";
import { ShopAnchorNav } from "./_components/ShopAnchorNav";
import { ShopInfoCard } from "./_components/ShopInfoCard";
import { ShopProductGrid } from "./_components/ShopProductGrid";
import { ShopOpeningHours } from "./_components/ShopOpeningHours";
import { ShopLocationSection } from "./_components/ShopLocationSection";
import { getShopCategoryLabel } from "@/lib/utils/shop-categories";
import { SITE_URL } from "@/lib/utils/constants";

type Params = Promise<{ locale: string; shopSlug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { locale, shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) return {};
  const name        = locale === "ar" && shop.arabicName ? shop.arabicName : shop.name;
  const title       = `${name} · Guidni`;
  const description = shop.description.slice(0, 160);
  const image       = shop.coverPhoto ?? shop.images[0]?.url ?? null;
  const canonical   = `${SITE_URL}/${locale}/shops/${shopSlug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url:    canonical,
      type:   "website",
      ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: name }] } : {}),
    },
    twitter: {
      card:        image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function ShopDetailPage({ params }: { params: Params }) {
  const { locale, shopSlug } = await params;

  const [shop, t] = await Promise.all([
    getShopBySlug(shopSlug),
    getTranslations({ locale, namespace: "ShopPage" }),
  ]);

  if (!shop) notFound();

  const [reviews, completedBooking, alreadyReviewed, wishlisted, relatedShops, manualBadges, guidniReview] = await Promise.all([
    getReviews(shop.id, RelationType.SHOP),
    hasCompletedBooking(shop.id, "SHOP"),
    hasReviewed(shop.id, "SHOP"),
    isInWishlist(shop.id, "SHOP"),
    getRelatedShops(shop.id, shop.destinationId, 3),
    getManualBadges(shop.id, RelationType.SHOP),
    getGuidniReview(shop.id, RelationType.SHOP),
  ]);

  const autoBadges = getAutoBadges({ note: shop.note, nbReviews: shop.nbReviews });
  const allBadges = [...manualBadges, ...autoBadges];

  const name = locale === "ar" && shop.arabicName ? shop.arabicName : shop.name;
  const categoryLabel = getShopCategoryLabel(shop.category, locale);

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : shop.note
      ? parseFloat(shop.note)
      : null;

  const canReview = completedBooking && !alreadyReviewed;

  const products = shop.products.map((p) => ({
    id:           p.id,
    slug:         p.slug,
    name:         p.name,
    arabicName:   p.arabicName,
    price:        p.price,
    comparePrice: p.comparePrice,
    category:     p.category,
    isHandmade:   p.isHandmade,
    imageUrl:     p.images[0]?.url ?? null,
  }));

  const deliveryLabels: Record<string, string> = {
    PICKUP:   t("delivery.pickup"),
    DELIVERY: t("delivery.delivery"),
  };


  const hasHours    = shop.hours.length > 0;
  const hasLocation = !!(shop.address || shop.location);
  const totalProducts = shop.products.length;
  const PRODUCTS_THRESHOLD = 8;

  return (
    <div className="max-w-screen-xl mx-auto px-4 md:px-20 py-8 pb-16">
      <DetailPageTracker listingId={shop.id} listingType="SHOP" />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-5 flex-wrap">
        <Link href={`/${locale}/shops`} className="hover:text-gray-700 transition-colors">
          {t("breadcrumb.shops")}
        </Link>
        <span>/</span>
        {(shop.city ?? shop.destination?.city) && (
          <>
            <span className="hover:text-gray-700">{shop.city ?? shop.destination?.city}</span>
            <span>/</span>
          </>
        )}
        <span className="text-gray-700 font-medium truncate max-w-xs">{name}</span>
      </nav>

      {/* Hero — cover with gradient, name, logo, open/closed, rating, share, wishlist */}
      <ShopHero
        id={shop.id}
        name={name}
        categoryLabel={categoryLabel}
        city={shop.city ?? shop.destination?.city ?? null}
        country={shop.country}
        note={shop.note}
        nbReviews={shop.nbReviews}
        isOpen={shop.isOpen}
        coverPhoto={shop.coverPhoto ?? shop.images[0]?.url ?? null}
        logo={shop.logo}
        locale={locale}
        initialIsWishlisted={wishlisted ?? false}
        openLabel={t("open")}
        closedLabel={t("closed")}
        shareLabel={t("share")}
        copiedLabel={t("shareCopied")}
      />

      {/* Anchor navigation — sticky, below hero */}
      <ShopAnchorNav
        hasHours={hasHours}
        hasLocation={hasLocation}
        labels={{
          products: t("anchorNav.products"),
          about:    t("anchorNav.about"),
          hours:    t("anchorNav.hours"),
          location: t("anchorNav.location"),
          reviews:  t("anchorNav.reviews"),
        }}
      />

      {/* Badges */}
      {allBadges.length > 0 && (
        <div className="mt-6">
          <BadgeList badges={allBadges} detailPage />
        </div>
      )}

      {/* Main two-column grid */}
      <div className="grid lg:grid-cols-[1fr_340px] gap-10 mt-8">
        {/* Left: products */}
        <div>
          <section id="shop-products" className="scroll-mt-28">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{t("productsTitle")}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {products.length} {products.length === 1 ? t("productSingular") : t("productPlural")}
              </p>
            </div>
            <ShopProductGrid
              shopSlug={shop.slug}
              shopName={name}
              products={products.slice(0, PRODUCTS_THRESHOLD)}
              locale={locale}
              allLabel={t("allProducts")}
              emptyLabel={t("noProducts")}
              handmadeLabel={t("handmade")}
            />
            <div className="mt-6 flex justify-center">
              <a
                href={`/${locale}/shops/${shop.slug}/products`}
                className="inline-flex items-center gap-2 border border-primary text-primary rounded-xl px-6 py-3 text-sm font-semibold hover:bg-primary/5 transition-colors"
              >
                {t("viewAllProducts")}
              </a>
            </div>
          </section>
        </div>

        {/* Right: info card + hours */}
        <div className="space-y-5">
          <section id="shop-about" className="scroll-mt-28">
            <ShopInfoCard
              description={shop.description}
              arabicDescription={shop.arabicDescription}
              address={shop.address}
              location={shop.location}
              website={shop.website}
              instagram={shop.instagram}
              facebook={shop.facebook}
              deliveryMethods={shop.deliveryMethods as never}
              freeShippingAbove={shop.freeShippingAbove}
              minOrderAmount={shop.minOrderAmount}
              locale={locale}
              labels={{
                about:         t("infoCard.about"),
                showMore:      t("showMore"),
                showLess:      t("showLess"),
                delivery:      t("infoCard.delivery"),
                freeShipping:  t("infoCard.freeShipping", { amount: shop.freeShippingAbove ?? 0 }),
                minOrder:      t("infoCard.minOrder", { amount: shop.minOrderAmount ?? 0 }),
                address:       t("infoCard.address"),
                viewOnMaps:    t("infoCard.viewOnMaps"),
                website:       t("infoCard.website"),
                instagram:     t("infoCard.instagram"),
                facebook:      t("infoCard.facebook"),
                deliveryLabels,
              }}
            />
          </section>

          {hasHours && (
            <section id="shop-hours" className="scroll-mt-28">
              <ShopOpeningHours
                hours={shop.hours}
                labels={{
                  title:     t("hours.title"),
                  closed:    t("hours.closed"),
                  open24h:   t("hours.open24h"),
                  openNow:   t("hours.openNow"),
                  closedNow: t("hours.closedNow"),
                }}
              />
            </section>
          )}
        </div>
      </div>

      {/* Location — full width */}
      {hasLocation && (
        <>
          <Separator className="my-10" />
          <ShopLocationSection
            address={shop.address}
            location={shop.location}
            labels={{
              title:      t("location.title"),
              viewOnMaps: t("location.viewOnMaps"),
            }}
          />
        </>
      )}

      {/* Guidni Review — full width */}
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

      {/* Reviews — full width */}
      <Separator className="my-10" />
      <section id="shop-reviews" className="scroll-mt-28 space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">{t("reviewsTitle")}</h2>
        {avgRating !== null && reviews.length > 0 && (
          <RatingSummary
            averageRating={avgRating}
            nbReviews={reviews.length}
            reviews={reviews}
            labels={{ outOf: t("outOf"), reviews: t("reviewsCount") }}
          />
        )}
        <ReviewsSection
          listingId={shop.id}
          relationType="SHOP"
          reviews={reviews}
          noReviewsLabel={t("noReviews")}
          canReview={canReview}
        />
      </section>

      {/* Similar shops — full width */}
      {relatedShops.length > 0 && (
        <>
          <Separator className="my-10" />
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">{t("similarShops")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedShops.map((s) => (
                <ShopCard
                  key={s.id}
                  id={s.id}
                  slug={s.slug}
                  name={s.name}
                  arabicName={s.arabicName}
                  category={s.category}
                  categoryLabel={getShopCategoryLabel(s.category, locale)}
                  city={s.city ?? s.destination?.city ?? null}
                  country={s.country}
                  note={s.note}
                  nbReviews={s.nbReviews}
                  coverPhoto={s.coverPhoto ?? s.images[0]?.url ?? null}
                  logo={s.logo}
                  deliveryMethods={s.deliveryMethods as never}
                  productImages={s.products.flatMap((p) => p.images.map((img) => img.url))}
                  locale={locale}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
