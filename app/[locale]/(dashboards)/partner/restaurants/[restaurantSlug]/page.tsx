import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FiChevronLeft } from "react-icons/fi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPartnerRestaurantBySlug } from "@/lib/actions/partner-restaurants";
import { getPartnerRestaurantReservations } from "@/lib/actions/restaurant-reservations";
import { DetailsTab }      from "./_components/DetailsTab";
import { MenuTab }         from "./_components/MenuTab";
import { HoursTab }        from "./_components/HoursTab";
import { ImagesTab }       from "./_components/ImagesTab";
import { ReservationsTab } from "./_components/ReservationsTab";
import { QrTab }           from "./_components/QrTab";

type Params = Promise<{ locale: string; restaurantSlug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { restaurantSlug } = await params;
  const restaurant = await getPartnerRestaurantBySlug(restaurantSlug);
  return { title: `${restaurant?.name ?? "Restaurant"} · Partner Dashboard` };
}

export default async function EditRestaurantPage({ params }: { params: Params }) {
  const { locale, restaurantSlug } = await params;
  const [restaurant, t] = await Promise.all([
    getPartnerRestaurantBySlug(restaurantSlug),
    getTranslations({ locale, namespace: "RestaurantPage" }),
  ]);
  if (!restaurant) notFound();

  const reservations = await getPartnerRestaurantReservations(restaurant.id);

  return (
    <div className="space-y-6 max-w-screen-lg">
      <Link
        href={`/${locale}/partner/restaurants`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
      >
        <FiChevronLeft className="h-4 w-4" />
        Restaurants
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 truncate">{restaurant.name}</h1>
        <p className="text-sm text-gray-400 mt-1">Manage your restaurant listing.</p>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="menu">Menu ({restaurant.menu.length})</TabsTrigger>
          <TabsTrigger value="hours">Hours</TabsTrigger>
          <TabsTrigger value="images">Images ({restaurant.images.length})</TabsTrigger>
          <TabsTrigger value="reservations">
            Reservations ({reservations.length})
          </TabsTrigger>
          <TabsTrigger value="qr">QR Codes</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <DetailsTab restaurant={restaurant} />
          </div>
        </TabsContent>

        <TabsContent value="menu">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <MenuTab restaurantId={restaurant.id} menu={restaurant.menu as any} />
          </div>
        </TabsContent>

        <TabsContent value="hours">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <HoursTab restaurantId={restaurant.id} initialHours={restaurant.hours as any} />
          </div>
        </TabsContent>

        <TabsContent value="images">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <ImagesTab restaurantId={restaurant.id} images={restaurant.images} />
          </div>
        </TabsContent>

        <TabsContent value="reservations">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <ReservationsTab initialReservations={reservations} />
          </div>
        </TabsContent>

        <TabsContent value="qr">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <QrTab
              restaurantSlug={restaurant.slug}
              locale={locale}
              labels={{
                title:        t("qrTab.title"),
                description:  t("qrTab.description"),
                tableLabel:   t("qrTab.tableLabel"),
                general:      t("qrTab.general"),
                previewLabel: t("qrTab.previewLabel"),
                linkLabel:    t("qrTab.linkLabel"),
                download:     t("qrTab.download"),
                tableMode:    t("qrTab.tableMode"),
                generalMode:  t("qrTab.generalMode"),
              }}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
