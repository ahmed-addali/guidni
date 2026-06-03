import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { getShopBySlug, getProductsByShop } from "@/lib/actions/shops";
import { ProductsListClient } from "./_components/ProductsListClient";
import { getShopCategoryLabel } from "@/lib/utils/shop-categories";

type Params = Promise<{ locale: string; shopSlug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { shopSlug, locale } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) return {};
  const name = locale === "ar" && shop.arabicName ? shop.arabicName : shop.name;
  return { title: `${name} — Products · Guidni` };
}

export default async function ShopProductsPage({ params }: { params: Params }) {
  const { locale, shopSlug } = await params;

  const [shop, t] = await Promise.all([
    getShopBySlug(shopSlug),
    getTranslations({ locale, namespace: "ShopProductsPage" }),
  ]);

  if (!shop) notFound();

  const rawProducts = await getProductsByShop(shop.id);

  const name         = locale === "ar" && shop.arabicName ? shop.arabicName : shop.name;
  const categoryLabel = getShopCategoryLabel(shop.category, locale);

  const products = rawProducts.map((p) => ({
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

  return (
    <div className="max-w-screen-xl mx-auto px-4 md:px-20 py-8 pb-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-6 flex-wrap">
        <Link href={`/${locale}/shops`} className="hover:text-gray-700 transition-colors">
          {t("breadcrumb.shops")}
        </Link>
        <span>/</span>
        <Link href={`/${locale}/shops/${shopSlug}`} className="hover:text-gray-700 transition-colors">
          {name}
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{t("breadcrumb.products")}</span>
      </nav>

      {/* Shop strip */}
      <div className="flex items-center gap-4 mb-8">
        {shop.logo && (
          <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-gray-100 shrink-0">
            <Image src={shop.logo} alt={name} fill className="object-cover" sizes="56px" />
          </div>
        )}
        <div>
          <p className="text-xs text-gray-400 mb-0.5">{categoryLabel}</p>
          <h1 className="text-xl font-bold text-gray-900">{name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {products.length} {t("productCount")}
          </p>
        </div>
      </div>

      {/* Client grid with search + filters */}
      <ProductsListClient
        shopSlug={shopSlug}
        shopName={name}
        products={products}
        locale={locale}
        labels={{
          all:       t("all"),
          search:    t("search"),
          noResults: t("noResults"),
          handmade:  t("handmade"),
        }}
      />
    </div>
  );
}
