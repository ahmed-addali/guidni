import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import {
  FiChevronLeft, FiExternalLink,
  FiBarChart2, FiFileText, FiPackage, FiShoppingBag,
  FiImage, FiClock, FiStar, FiSettings,
} from "react-icons/fi";
import { auth } from "@/lib/auth";
import { getDestinations } from "@/lib/actions/destinations";
import { getReviews } from "@/lib/actions/reviews";
import { getGuidniReview } from "@/lib/actions/badges";
import { getMyShopBySlug } from "@/lib/actions/partner-shops";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ToggleTabs, ToggleTabsList, ToggleTabsTrigger, ToggleTabsContent } from "@/components/ui/toggle-tabs";
import { DetailsTab }  from "./_components/DetailsTab";
import { OverviewTab } from "./_components/OverviewTab";
import { ProductsTab } from "./_components/ProductsTab";
import { OrdersTab }   from "./_components/OrdersTab";
import { ImagesTab }   from "./_components/ImagesTab";
import { HoursTab }    from "./_components/HoursTab";
import { ReviewsTab }  from "./_components/ReviewsTab";
import { SettingsTab } from "./_components/SettingsTab";

type Params = Promise<{ locale: string; shopSlug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { locale, shopSlug } = await params;
  const t = await getTranslations({ locale, namespace: "PartnerDashboard.editShop" });
  const shop = await getMyShopBySlug(shopSlug);
  return { title: `${shop?.name ?? "Shop"} · ${t("metaTitleSuffix")}` };
}

export default async function EditShopPage({ params }: { params: Params }) {
  const { locale, shopSlug } = await params;

  // Auth + ownership check — getMyShopBySlug already filters by profileId,
  // so a null result means either not found or not owned by this user.
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) notFound();

  const [shop, destinations, t] = await Promise.all([
    getMyShopBySlug(shopSlug),
    getDestinations(),
    getTranslations({ locale, namespace: "PartnerDashboard.editShop" }),
  ]);

  if (!shop) notFound();

  const [reviews, guidniReview] = await Promise.all([
    getReviews(shop.id, "SHOP"),
    getGuidniReview(shop.id, "SHOP"),
  ]);

  const destList = destinations.map((d) => ({
    id:      d.id,
    city:    d.city,
    country: d.country,
    region:  d.region ?? null,
  }));

  const unansweredReviews = reviews.filter((r: any) => !r.response).length;

  return (
    <div className="space-y-6 max-w-screen-lg">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href={`/${locale}/partner/shops`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-2"
          >
            <FiChevronLeft className="h-4 w-4" />
            {t("backLabel")}
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{shop.name}</h1>
            {(shop as any).status !== "ACTIVE" && (
              <StatusBadge status={(shop as any).status} />
            )}
          </div>
          <p className="text-sm text-gray-400 mt-1">{t("pageSubtitle")}</p>
        </div>
        <a
          href={`/${locale}/shops/${shop.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 rounded-xl px-3 py-2 hover:text-blue-600 hover:border-blue-300 transition-colors shrink-0 mt-7"
        >
          <FiExternalLink className="h-4 w-4" />
          {t("previewLink")}
        </a>
      </div>

      <ToggleTabs defaultValue="overview" className="w-full">
        <ToggleTabsList className="flex-wrap">
          <ToggleTabsTrigger value="overview">
            <FiBarChart2 />
            {t("tabs.overview")}
          </ToggleTabsTrigger>

          <ToggleTabsTrigger value="details">
            <FiFileText />
            {t("tabs.details")}
          </ToggleTabsTrigger>

          <ToggleTabsTrigger value="products">
            <FiPackage />
            {t("tabs.products", { count: shop.products.length })}
            {shop.products.length > 0 && (
              <span className="ml-0.5 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium data-active:bg-gray-200">
                {shop.products.length}
              </span>
            )}
          </ToggleTabsTrigger>

          <ToggleTabsTrigger value="orders">
            <FiShoppingBag />
            {t("tabs.orders", { count: shop.orders.length })}
            {shop.orders.length > 0 && (
              <span className="ml-0.5 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium data-active:bg-gray-200">
                {shop.orders.length}
              </span>
            )}
          </ToggleTabsTrigger>

          <ToggleTabsTrigger value="images">
            <FiImage />
            {t("tabs.images", { count: shop.images.length })}
            {shop.images.length > 0 && (
              <span className="ml-0.5 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium data-active:bg-gray-200">
                {shop.images.length}
              </span>
            )}
          </ToggleTabsTrigger>

          <ToggleTabsTrigger value="hours">
            <FiClock />
            {t("tabs.hours")}
          </ToggleTabsTrigger>

          <ToggleTabsTrigger value="reviews">
            <FiStar />
            {t("tabs.reviews", { count: reviews.length })}
            {reviews.length > 0 && (
              <span className={`ml-0.5 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                unansweredReviews > 0
                  ? "bg-orange-100 text-orange-600"
                  : "bg-gray-100 text-gray-500"
              }`}>
                {reviews.length}
              </span>
            )}
          </ToggleTabsTrigger>

          <ToggleTabsTrigger value="settings">
            <FiSettings />
            {t("tabs.settings")}
          </ToggleTabsTrigger>
        </ToggleTabsList>

        <ToggleTabsContent value="overview">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <OverviewTab orders={shop.orders as never} products={shop.products} />
          </div>
        </ToggleTabsContent>

        <ToggleTabsContent value="details" keepMounted>
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <DetailsTab shop={shop as never} destinations={destList} />
          </div>
        </ToggleTabsContent>

        <ToggleTabsContent value="products">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <ProductsTab
              shopId={shop.id}
              shopSlug={shop.slug}
              locale={locale}
              products={shop.products as never}
            />
          </div>
        </ToggleTabsContent>

        <ToggleTabsContent value="orders">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <OrdersTab orders={shop.orders as never} />
          </div>
        </ToggleTabsContent>

        <ToggleTabsContent value="images" keepMounted>
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <ImagesTab shopId={shop.id} images={shop.images} />
          </div>
        </ToggleTabsContent>

        <ToggleTabsContent value="hours">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <HoursTab shopId={shop.id} initialHours={(shop as any).hours ?? []} />
          </div>
        </ToggleTabsContent>

        <ToggleTabsContent value="reviews">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <ReviewsTab
              reviews={reviews as never}
              guidniReview={guidniReview as never}
              shopId={shop.id}
            />
          </div>
        </ToggleTabsContent>

        <ToggleTabsContent value="settings">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <SettingsTab shop={{ id: shop.id, name: shop.name, status: shop.status }} locale={locale} />
          </div>
        </ToggleTabsContent>
      </ToggleTabs>
    </div>
  );
}
