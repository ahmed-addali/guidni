import Link from "next/link";
import { headers } from "next/headers";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getFeaturedShops, getFeaturedProducts } from "@/lib/actions/shops";
import { getDestinationSlug } from "@/lib/actions/destination-cookie";
import { getBadgesForListings } from "@/lib/actions/badges";
import { getRecommendedOrder } from "@/lib/recommendation/client";
import { ShopsCarousel }   from "./ShopsCarousel";
import { ProductsCarousel } from "./ProductsCarousel";

interface Props {
  locale: string;
}

export async function HomeShopsSection({ locale }: Props) {
  const destinationSlug = await getDestinationSlug();
  const [shops, products, t, session] = await Promise.all([
    getFeaturedShops(destinationSlug),
    getFeaturedProducts(destinationSlug),
    getTranslations({ locale, namespace: "HomePage.shops" }),
    auth.api.getSession({ headers: await headers() }).catch(() => null),
  ]);
  const shopBadgesMap = await getBadgesForListings(shops.map((s) => s.id), "SHOP");

  if (shops.length === 0 && products.length === 0) return null;

  // ── MAB-ranked ordering ──────────────────────────────────────
  const userId = session?.user?.id;

  const rankedShopIds = shops.length > 0
    ? await getRecommendedOrder("homepage_shop", "SHOP", destinationSlug, userId)
    : [];

  const sortedShops = rankedShopIds.length > 0
    ? rankedShopIds
        .map((id) => shops.find((s) => s.id === id))
        .filter(Boolean)
        .concat(shops.filter((s) => !rankedShopIds.includes(s.id)))
    : shops;

  const rankedProductIds = products.length > 0
    ? await getRecommendedOrder("homepage_product", "PRODUCT", destinationSlug, userId)
    : [];

  const sortedProducts = rankedProductIds.length > 0
    ? rankedProductIds
        .map((id) => products.find((p) => p.id === id))
        .filter(Boolean)
        .concat(products.filter((p) => !rankedProductIds.includes(p.id)))
    : products;

  return (
    <div className="divide-y divide-gray-100">
      {/* Local Shops carousel */}
      {sortedShops.length > 0 && (
        <section className="py-12 w-full">
          <div className="flex items-center justify-between mb-6 px-1">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{t("shopsTitle")}</h2>
              <p className="text-sm text-muted-foreground mt-1">{t("shopsSubtitle")}</p>
            </div>
            <Link
              href={`/${locale}/shops`}
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline shrink-0"
            >
              {t("viewAllShops")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ShopsCarousel shops={sortedShops as typeof shops} locale={locale} badgesMap={shopBadgesMap} />
        </section>
      )}

      {/* Handmade Picks carousel */}
      {sortedProducts.length > 0 && (
        <section className="py-12 w-full">
          <div className="flex items-center justify-between mb-6 px-1">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{t("productsTitle")}</h2>
              <p className="text-sm text-muted-foreground mt-1">{t("productsSubtitle")}</p>
            </div>
            <Link
              href={`/${locale}/shops?mode=products`}
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline shrink-0"
            >
              {t("viewAllProducts")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ProductsCarousel products={sortedProducts as typeof products} locale={locale} handmadeLabel={t("handmade")} />
        </section>
      )}
    </div>
  );
}
