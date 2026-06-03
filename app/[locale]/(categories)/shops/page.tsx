import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { FaStore } from "react-icons/fa6";
import { FiPackage } from "react-icons/fi";
import { getShopsPaginated, getProductsPaginated } from "@/lib/actions/shops";
import { getDestinationSlug } from "@/lib/actions/destination-cookie";
import { getDestinationBySlug } from "@/lib/actions/destinations";
import { getBadgesForListings } from "@/lib/actions/badges";
import { ShopCard } from "@/components/shops/ShopCard";
import { ProductCard } from "@/components/shops/ProductCard";
import { CategoryPageHero } from "@/components/shared/CategoryPageHero";
import { Pagination } from "@/components/shared/Pagination";
import { ShopModeToggle } from "./_components/ShopModeToggle";
import { ShopSearch } from "./_components/ShopSearch";
import { ShopFilterSheet } from "./_components/ShopFilterSheet";
import { ShopFilterChips } from "./_components/ShopFilterChips";
import { getShopCategoryLabel } from "@/lib/utils/shop-categories";

type Params       = Promise<{ locale: string }>;
type SearchParams = Promise<{
  mode?:     string;
  category?: string;
  handmade?: string;
  q?:        string;
  page?:     string;
}>;

export async function generateMetadata({ params }: { params: Params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ShopsPage" });
  return { title: "Shops · Guidni", description: t("subtitle") };
}

export default async function ShopsPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { locale }                                         = await params;
  const { mode, category, handmade, q, page: pageParam }  = await searchParams;
  const t                                                  = await getTranslations({ locale, namespace: "ShopsPage" });
  const destination                                        = await getDestinationSlug();
  const page                                               = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const mode_      = mode === "products" ? "products" : "shops";
  const categories = category ? category.split(",").filter(Boolean) : [];

  const [shopsResult, productsResult, destinationRecord] = await Promise.all([
    mode_ === "shops"
      ? getShopsPaginated({ destinationSlug: destination, categories, search: q, page })
      : null,
    mode_ === "products"
      ? getProductsPaginated({
          destinationSlug: destination,
          categories,
          handmade: handmade === "true",
          search: q,
          page,
        })
      : null,
    getDestinationBySlug(destination),
  ]);

  const shops           = shopsResult?.shops ?? [];
  const total           = shopsResult?.total ?? 0;
  const totalPages      = shopsResult?.totalPages ?? 1;
  const allProducts     = (productsResult?.products ?? []).map((p) => ({
    id:           p.id,
    slug:         p.slug,
    shopSlug:     p.shop.slug,
    name:         p.name,
    arabicName:   p.arabicName ?? null,
    shopName:     p.shop.name,
    price:        p.price,
    comparePrice: p.comparePrice,
    isHandmade:   p.isHandmade,
    imageUrl:     p.images[0]?.url ?? null,
  }));
  const productTotal     = productsResult?.total ?? 0;
  const productTotalPages = productsResult?.totalPages ?? 1;

  const badgesMap = shops.length > 0
    ? await getBadgesForListings(shops.map((s) => s.id), "SHOP")
    : {};

  const destinationCity = destinationRecord?.city ?? null;

  return (
    <div className="pb-16 sm:pb-12">

      {/* Hero — clean, no search */}
      <CategoryPageHero
        title={t("titlePrefix")}
        accent={destinationCity ?? t("titleFallback")}
        subtitle={t("subtitle")}
      />

      {/* Mode toggle */}
      <div className="flex justify-center py-4 border-b border-gray-100">
        <ShopModeToggle
          mode={mode_}
          shopsLabel={t("browseShops")}
          productsLabel={t("browseProducts")}
        />
      </div>

      {/* Search + Filter row — under mode toggle */}
      <div className="mx-auto w-full max-w-screen-xl px-4 md:px-20 py-3 border-b border-gray-100">
        <div className="flex justify-center">
          <Suspense>
            <div className="flex items-center gap-2 w-full max-w-xl">
              <div className="flex-1 min-w-0">
                <ShopSearch
                  placeholder={mode_ === "shops" ? t("searchShopsPlaceholder") : t("searchProductsPlaceholder")}
                  clearLabel={t("clearSearch")}
                  defaultValue={q}
                  paramKey="q"
                />
              </div>
              <ShopFilterSheet
                mode={mode_}
                locale={locale}
                allLabel={t("allCategories")}
                filtersLabel={t("filtersLabel")}
                clearLabel={t("clearFilters")}
                handmadeLabel={t("handmadeOnly")}
              />
            </div>
          </Suspense>
        </div>
      </div>

      <section className="mx-auto w-full max-w-screen-xl px-4 md:px-20 py-8">

        {/* Active filter chips */}
        <Suspense>
          <div className="mb-4">
            <ShopFilterChips
              mode={mode_}
              locale={locale}
              clearAllLabel={t("clearFilters")}
              handmadeLabel={t("handmadeOnly")}
            />
          </div>
        </Suspense>

        {/* Result count */}
        <div className="mb-6">
          <p className="text-sm text-gray-500">
            {mode_ === "shops"
              ? t("shopsCount", { count: total })
              : t("productsCount", { count: productTotal })}
          </p>
        </div>

        {/* Shops mode */}
        {mode_ === "shops" && (
          shops.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-3 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                <FaStore className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-xl font-semibold text-gray-800">{t("emptyShops")}</p>
              <p className="text-sm text-muted-foreground max-w-xs">{t("emptyHint")}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {shops.map((shop) => (
                  <ShopCard
                    key={shop.id}
                    id={shop.id}
                    slug={shop.slug}
                    name={shop.name}
                    arabicName={shop.arabicName}
                    category={shop.category}
                    categoryLabel={getShopCategoryLabel(shop.category, locale)}
                    city={shop.city ?? shop.destination?.city ?? null}
                    country={shop.country}
                    note={shop.note}
                    nbReviews={shop.nbReviews}
                    coverPhoto={shop.coverPhoto ?? shop.images[0]?.url ?? null}
                    logo={shop.logo}
                    deliveryMethods={shop.deliveryMethods as never}
                    productImages={shop.products.flatMap((p) => p.images.map((img) => img.url))}
                    locale={locale}
                    badges={badgesMap[shop.id]}
                  />
                ))}
              </div>
              <Suspense>
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  previousLabel={t("previous")}
                  nextLabel={t("next")}
                />
              </Suspense>
            </>
          )
        )}

        {/* Products mode */}
        {mode_ === "products" && (
          allProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-3 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                <FiPackage className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-xl font-semibold text-gray-800">{t("emptyProducts")}</p>
              <p className="text-sm text-muted-foreground max-w-xs">{t("emptyHint")}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {allProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    slug={product.slug}
                    shopSlug={product.shopSlug}
                    name={product.name}
                    shopName={product.shopName}
                    price={product.price}
                    comparePrice={product.comparePrice}
                    isHandmade={product.isHandmade}
                    imageUrl={product.imageUrl}
                    locale={locale}
                    handmadeLabel={t("handmade")}
                  />
                ))}
              </div>
              {productTotalPages > 1 && (
                <Suspense>
                  <Pagination
                    currentPage={page}
                    totalPages={productTotalPages}
                    previousLabel={t("previous")}
                    nextLabel={t("next")}
                  />
                </Suspense>
              )}
            </>
          )
        )}

      </section>
    </div>
  );
}
