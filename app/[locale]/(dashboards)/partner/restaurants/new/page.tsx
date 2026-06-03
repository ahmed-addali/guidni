import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FiChevronLeft } from "react-icons/fi";
import { getMyBusinessProfile } from "@/lib/actions/partner";
import { getDestinations } from "@/lib/actions/destinations";
import { CreateRestaurantWizard } from "./_components/CreateRestaurantWizard";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PartnerDashboard.newRestaurant" });
  return { title: t("metaTitle") };
}

export default async function NewRestaurantPage({ params }: { params: Params }) {
  const { locale } = await params;
  const [profile, destinations, t] = await Promise.all([
    getMyBusinessProfile(),
    getDestinations(),
    getTranslations({ locale, namespace: "PartnerDashboard.newRestaurant" }),
  ]);

  return (
    <div className="space-y-6 max-w-screen-md">
      <div className="flex items-center gap-3">
        <Link
          href={`/${locale}/partner/restaurants`}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          <FiChevronLeft className="h-4 w-4" />
          {t("backLabel")}
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("pageTitle")}</h1>
        <p className="text-sm text-gray-400 mt-1">{t("pageSubtitle")}</p>
      </div>
      <CreateRestaurantWizard
        profileCountry={profile?.country}
        profileCity={profile?.region}
        profilePhone={profile?.phone ?? undefined}
        destinations={destinations.map((d) => ({ id: d.id, label: `${d.city}, ${d.country}`, city: d.city, country: d.country, region: d.region ?? "" }))}
      />
    </div>
  );
}
