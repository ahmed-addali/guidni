import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FiChevronLeft, FiExternalLink, FiFileText, FiImage, FiCalendar, FiGrid, FiSettings, FiStar } from "react-icons/fi";
import { BookOpen, Clock } from "lucide-react";
import { ToggleTabs, ToggleTabsList, ToggleTabsTrigger, ToggleTabsContent } from "@/components/ui/toggle-tabs";
import { getPartnerRestaurantBySlug, getRestaurantReviews } from "@/lib/actions/partner-restaurants";
import { getPartnerRestaurantReservations } from "@/lib/actions/restaurant-reservations";
import { getDestinations } from "@/lib/actions/destinations";
import { DetailsTab }      from "./_components/DetailsTab";
import { MenuTab }         from "./_components/MenuTab";
import { HoursTab }        from "./_components/HoursTab";
import { ImagesTab }       from "./_components/ImagesTab";
import { ReservationsTab } from "./_components/ReservationsTab";
import { QrTab }           from "./_components/QrTab";
import { ReviewsTab }      from "./_components/ReviewsTab";
import { SettingsTab }     from "./_components/SettingsTab";

type Params = Promise<{ locale: string; restaurantSlug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { locale, restaurantSlug } = await params;
  const [restaurant, t] = await Promise.all([
    getPartnerRestaurantBySlug(restaurantSlug),
    getTranslations({ locale, namespace: "PartnerDashboard.editRestaurant" }),
  ]);
  return { title: `${restaurant?.name ?? "Restaurant"} · ${t("metaTitleSuffix")}` };
}

export default async function EditRestaurantPage({ params }: { params: Params }) {
  const { locale, restaurantSlug } = await params;

  const [restaurant, t, tQr] = await Promise.all([
    getPartnerRestaurantBySlug(restaurantSlug),
    getTranslations({ locale, namespace: "PartnerDashboard.editRestaurant" }),
    getTranslations({ locale, namespace: "RestaurantPage" }),
  ]);
  if (!restaurant) notFound();

  const [reservations, { reviews, guidniReview }, destinations] = await Promise.all([
    getPartnerRestaurantReservations(restaurant.id),
    getRestaurantReviews(restaurant.id),
    getDestinations(),
  ]);
  const unanswered = reviews.filter((r) => !r.response).length;

  return (
    <div className="space-y-6 max-w-screen-lg">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href={`/${locale}/partner/restaurants`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-2"
          >
            <FiChevronLeft className="h-4 w-4" />
            {t("backLabel")}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 truncate">{restaurant.name}</h1>
          <p className="text-sm text-gray-400 mt-1">{t("headerSubtitle")}</p>
        </div>
        <a
          href={`/${locale}/restaurants/${restaurantSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 rounded-xl px-3 py-2 hover:text-blue-600 hover:border-blue-300 transition-colors shrink-0 mt-7"
        >
          <FiExternalLink className="h-4 w-4" />
          {t("previewLabel")}
        </a>
      </div>

      <ToggleTabs defaultValue="details">
        <ToggleTabsList>
          <ToggleTabsTrigger value="details">
            <FiFileText />
            {t("tabs.details")}
          </ToggleTabsTrigger>

          <ToggleTabsTrigger value="menu">
            <BookOpen className="h-4 w-4" />
            {t("tabs.menu")}
            {restaurant.menu.length > 0 && (
              <span className="ml-0.5 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">
                {restaurant.menu.length}
              </span>
            )}
          </ToggleTabsTrigger>

          <ToggleTabsTrigger value="hours">
            <Clock className="h-4 w-4" />
            {t("tabs.hours")}
          </ToggleTabsTrigger>

          <ToggleTabsTrigger value="images">
            <FiImage />
            {t("tabs.images")}
            {restaurant.images.length > 0 && (
              <span className="ml-0.5 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">
                {restaurant.images.length}
              </span>
            )}
          </ToggleTabsTrigger>

          <ToggleTabsTrigger value="reservations">
            <FiCalendar />
            {t("tabs.reservations")}
            {reservations.length > 0 && (
              <span className="ml-0.5 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">
                {reservations.length}
              </span>
            )}
          </ToggleTabsTrigger>

          <ToggleTabsTrigger value="reviews">
            <FiStar />
            {t("tabs.reviews")}
            {reviews.length > 0 && (
              <span className={`ml-0.5 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                unanswered > 0 ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500"
              }`}>
                {reviews.length}
              </span>
            )}
          </ToggleTabsTrigger>

          <ToggleTabsTrigger value="qr">
            <FiGrid />
            {t("tabs.qr")}
          </ToggleTabsTrigger>

          <ToggleTabsTrigger value="settings">
            <FiSettings />
            {t("tabs.settings")}
          </ToggleTabsTrigger>
        </ToggleTabsList>

        <ToggleTabsContent value="details" keepMounted>
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <DetailsTab restaurant={restaurant} destinations={destinations} />
          </div>
        </ToggleTabsContent>

        <ToggleTabsContent value="menu" keepMounted>
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <MenuTab restaurantId={restaurant.id} menu={restaurant.menu as any} />
          </div>
        </ToggleTabsContent>

        <ToggleTabsContent value="hours" keepMounted>
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <HoursTab restaurantId={restaurant.id} initialHours={restaurant.hours as any} />
          </div>
        </ToggleTabsContent>

        <ToggleTabsContent value="images" keepMounted>
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <ImagesTab restaurantId={restaurant.id} images={restaurant.images} />
          </div>
        </ToggleTabsContent>

        <ToggleTabsContent value="reservations">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <ReservationsTab initialReservations={reservations} locale={locale} />
          </div>
        </ToggleTabsContent>

        <ToggleTabsContent value="reviews">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <ReviewsTab
              reviews={reviews}
              guidniReview={guidniReview}
              restaurantId={restaurant.id}
            />
          </div>
        </ToggleTabsContent>

        <ToggleTabsContent value="qr">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <QrTab
              restaurantSlug={restaurant.slug}
              locale={locale}
              labels={{
                title:        tQr("qrTab.title"),
                description:  tQr("qrTab.description"),
                tableLabel:   tQr("qrTab.tableLabel"),
                general:      tQr("qrTab.general"),
                previewLabel: tQr("qrTab.previewLabel"),
                linkLabel:    tQr("qrTab.linkLabel"),
                download:     tQr("qrTab.download"),
                tableMode:    tQr("qrTab.tableMode"),
                generalMode:  tQr("qrTab.generalMode"),
              }}
            />
          </div>
        </ToggleTabsContent>

        <ToggleTabsContent value="settings">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <SettingsTab restaurantId={restaurant.id} />
          </div>
        </ToggleTabsContent>
      </ToggleTabs>
    </div>
  );
}
