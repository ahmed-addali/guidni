import Link from "next/link";
import { FiChevronLeft } from "react-icons/fi";
import { getTranslations } from "next-intl/server";
import { getMyBusinessProfile } from "@/lib/actions/partner";
import { getDestinations } from "@/lib/actions/destinations";
import { CreateTransferWizard } from "./_components/CreateTransferWizard";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PartnerTransfers" });
  return { title: t("newTransfer") };
}

export default async function NewTransferPage({ params }: { params: Params }) {
  const { locale } = await params;

  const [profile, destinations, t] = await Promise.all([
    getMyBusinessProfile(),
    getDestinations(),
    getTranslations({ locale, namespace: "PartnerTransfers" }),
  ]);

  return (
    <div className="space-y-6 max-w-screen-md">
      <Link
        href={`/${locale}/partner/transfers`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
      >
        <FiChevronLeft className="h-4 w-4" />
        {t("backToTransfers")}
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("newTransfer")}</h1>
        <p className="text-sm text-gray-400 mt-1">{t("newTransferSubtitle")}</p>
      </div>
      <CreateTransferWizard
        profileCountry={profile?.country}
        profileRegion={profile?.region}
        profilePhone={profile?.phone ?? undefined}
        destinations={destinations.map((d) => ({
          id:      d.id,
          label:   `${d.city}, ${d.country}`,
          city:    d.city,
          country: d.country,
          region:  d.region ?? "",
        }))}
      />
    </div>
  );
}
