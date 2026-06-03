import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FiChevronLeft } from "react-icons/fi";
import { getMyBusinessProfile } from "@/lib/actions/partner";
import { getDestinations } from "@/lib/actions/destinations";
import { CreateActivityWizard } from "./_components/CreateActivityWizard";

type Params = Promise<{ locale: string }>;

export async function generateMetadata() {
  const t = await getTranslations("PartnerDashboard.newActivity");
  return { title: t("metaTitle") };
}

export default async function NewActivityPage({ params }: { params: Params }) {
  const { locale } = await params;
  const t = await getTranslations("PartnerDashboard.newActivity");
  const [profile, destinations] = await Promise.all([
    getMyBusinessProfile(),
    getDestinations(),
  ]);

  return (
    <div className="space-y-6 max-w-screen-md">
      <div className="flex items-center gap-3">
        <Link
          href={`/${locale}/partner/activities`}
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
      <CreateActivityWizard
        profileCountry={profile?.country}
        profileRegion={profile?.region}
        profilePhone={profile?.phone ?? undefined}
        destinations={destinations.map((d) => ({ id: d.id, label: `${d.city}, ${d.country}`, city: d.city, country: d.country, region: d.region ?? "" }))}
      />
    </div>
  );
}
