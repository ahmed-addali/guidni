import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Separator } from "@/components/ui/separator";
import { getProductBySlug, getShopProducts } from "@/lib/actions/shops";
import { getReviews, hasCompletedBooking, hasReviewed } from "@/lib/actions/reviews";
import { ImageGallery } from "@/components/shared/ImageGallery";
import { DescriptionWithToggle } from "@/components/shared/DescriptionWithToggle";
import { ReviewsSection } from "@/components/activities/ReviewsSection";
import { RatingSummary } from "@/components/shared/RatingSummary";
import { ShareButton } from "@/app/[locale]/(categories)/stays/[staySlug]/_components/ShareButton";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { ProductBuyCard } from "./_components/ProductBuyCard";
import { ProductShopStrip } from "./_components/ProductShopStrip";
import { ProductAnchorNav } from "./_components/ProductAnchorNav";
import { ProductQuickFacts } from "./_components/ProductQuickFacts";
import { ProductMobileBar } from "./_components/ProductMobileBar";
import { MoreFromShop } from "./_components/MoreFromShop";
import { getShopCategoryLabel, getProductCategoryLabel } from "@/lib/utils/shop-categories";

type Params = Promise<{ locale: string; shopSlug: string; productSlug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { shopSlug, productSlug } = await params;
  const product = await getProductBySlug(shopSlug, productSlug);
  if (!product) return {};
  return {
    title: `${product.name} · ${product.shop.name} · Guidni`,
    description: product.description.slice(0, 160),
  };
}

export default async function ProductDetailPage({ params }: { params: Params }) {
  const { locale, shopSlug, productSlug } = await params;

  const [product, t] = await Promise.all([
    getProductBySlug(shopSlug, productSlug),
    getTranslations({ locale, namespace: "ProductPage" }),
  ]);

  if (!product) notFound();

  const [reviews, completedBooking, alreadyReviewed, moreProducts] = await Promise.all([
    getReviews(product.id, "PRODUCT"),
    hasCompletedBooking(product.id, "PRODUCT"),
    hasReviewed(product.id, "PRODUCT"),
    getShopProducts(product.shopId, product.id),
  ]);

  const name =
    locale === "ar" && product.arabicName ? product.arabicName : product.name;
  const description =
    locale === "ar" && product.arabicDescription
      ? product.arabicDescription
      : product.description;

  const images = product.images;
  const coverImage = images[0]?.url ?? null;

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

  const canReview = completedBooking && !alreadyReviewed;

  const shopCategoryLabel = getShopCategoryLabel(product.shop.category, locale);
  const productCategoryLabel = getProductCategoryLabel(product.category, locale);

  const deliveryLabels: Record<string, string> = {
    PICKUP:         t("delivery.pickup"),
    LOCAL_DELIVERY: t("delivery.local"),
    NATIONWIDE:     t("delivery.nationwide"),
    INTERNATIONAL:  t("delivery.international"),
  };

  return (
    <>
    <div className="max-w-screen-xl mx-auto px-4 md:px-20 py-8 pb-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-5 flex-wrap">
        <Link href={`/${locale}/shops`} className="hover:text-gray-700 transition-colors">
          {t("breadcrumb.shops")}
        </Link>
        <span>/</span>
        <Link
          href={`/${locale}/shops/${shopSlug}`}
          className="hover:text-gray-700 transition-colors"
        >
          {product.shop.name}
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium truncate max-w-[200px]">{name}</span>
      </nav>

      {/* Title + actions */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-xs font-medium text-primary bg-primary/8 px-2.5 py-0.5 rounded-full">
              {productCategoryLabel}
            </span>
            {product.isHandmade && (
              <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                {t("handmade")}
              </span>
            )}
            {product.isLocalOnly && (
              <span className="text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                {t("localOnly")}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{name}</h1>
          {avgRating !== null && reviews.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              ★ <span className="font-medium text-gray-700">{avgRating.toFixed(1)}</span>
              {" "}· {reviews.length} {t("reviewsCount")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ShareButton
            title={name}
            shareLabel={t("share")}
            copiedLabel={t("shareCopied")}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white transition-all"
          />
          <WishlistButton
            listingId={product.id}
            relationType="PRODUCT"
            locale={locale}
          />
        </div>
      </div>

      {/* Gallery */}
      {images.length > 0 && (
        <ImageGallery
          images={images}
          title={name}
          allPhotosLabel={t("allPhotos")}
          photosLabel={t("photos")}
        />
      )}

      {/* Anchor navigation — after gallery */}
      <ProductAnchorNav
        labels={{
          overview: t("anchorNav.overview"),
          details:  t("anchorNav.details"),
          reviews:  t("anchorNav.reviews"),
        }}
      />

      {/* Two-column layout */}
        <div className="grid lg:grid-cols-[1fr_360px] gap-10 mt-8">
          {/* Left */}
          <div>
            {/* Shop strip */}
            <ProductShopStrip
              shopSlug={shopSlug}
              shopName={product.shop.name}
              shopLogo={product.shop.logo}
              categoryLabel={shopCategoryLabel}
              locale={locale}
              visitLabel={t("visitShop")}
            />

            <Separator className="my-6" />

            {/* Overview */}
            <section id="product-overview" className="scroll-mt-28 space-y-6">
              {/* Stock badge */}
              <span
                className={`inline-block text-sm font-medium ${
                  product.stock === 0
                    ? "text-red-500"
                    : product.stock <= 5
                    ? "text-amber-600"
                    : "text-green-600"
                }`}
              >
                {product.stock === 0
                  ? t("outOfStock")
                  : product.stock <= 5
                  ? t("onlyLeft").replace("{count}", product.stock.toString())
                  : t("inStock")}
              </span>

              {/* Description */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">{t("description")}</h2>
                <DescriptionWithToggle
                  text={description}
                  showMoreLabel={t("showMore")}
                  showLessLabel={t("showLess")}
                />
              </div>

              {/* Tags */}
              {product.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </section>

            <Separator className="my-8" />

            {/* Details */}
            <section id="product-details" className="scroll-mt-28 space-y-6">
              {/* Quick facts */}
              {(product.material || product.origin || product.weight) && (
                <ProductQuickFacts
                  material={product.material}
                  origin={product.origin}
                  weight={product.weight}
                  labels={{
                    material: t("details.material"),
                    origin:   t("details.origin"),
                    weight:   t("details.weight"),
                  }}
                />
              )}

              {/* Delivery info */}
              {product.shop.deliveryMethods.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">{t("deliveryTitle")}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {product.shop.deliveryMethods.map((m) => (
                      <span
                        key={m}
                        className="text-xs text-gray-600 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full"
                      >
                        {deliveryLabels[m] ?? m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Right: Buy card */}
          <ProductBuyCard
            productId={product.id}
            shopId={product.shop.id}
            shopName={product.shop.name}
            productName={name}
            price={product.price}
            comparePrice={product.comparePrice}
            stock={product.stock}
            deliveryMethods={product.shop.deliveryMethods as never}
            imageUrl={coverImage}
            locale={locale}
            labels={{
              inStock:       t("inStock"),
              outOfStock:    t("outOfStock"),
              onlyLeft:      t("onlyLeft", { count: product.stock }),
              addToCart:     t("addToCart"),
              buyNow:        t("buyNow"),
              added:         t("added"),
              quantity:      t("quantity"),
              delivery:      t("deliveryTitle"),
              safeCheckout:  t("safeCheckout"),
              deliveryLabels,
            }}
          />
        </div>

        {/* Reviews — full width */}
        <Separator className="my-10" />
        <section id="product-reviews" className="scroll-mt-28 space-y-6">
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
            listingId={product.id}
            relationType="PRODUCT"
            reviews={reviews}
            noReviewsLabel={t("noReviews")}
            canReview={canReview}
          />
        </section>

        {/* More from shop — full width */}
        {moreProducts.length > 0 && (
          <>
            <Separator className="my-10" />
            <MoreFromShop
              shopSlug={shopSlug}
              shopName={product.shop.name}
              products={moreProducts.map((p) => ({
                id:           p.id,
                slug:         p.slug,
                name:         p.name,
                price:        p.price,
                comparePrice: p.comparePrice,
                isHandmade:   p.isHandmade,
                imageUrl:     p.images[0]?.url ?? null,
              }))}
              locale={locale}
              title={t("moreFrom", { shop: product.shop.name })}
              viewAllLabel={t("viewAll")}
              handmadeLabel={t("handmade")}
            />
          </>
        )}
    </div>

    <ProductMobileBar
      productId={product.id}
      shopId={product.shop.id}
      shopName={product.shop.name}
      productName={name}
      price={product.price}
      imageUrl={coverImage}
      stock={product.stock}
      locale={locale}
      labels={{
        addToCart:  t("addToCart"),
        added:      t("added"),
        outOfStock: t("outOfStock"),
      }}
    />
    </>
  );
}
