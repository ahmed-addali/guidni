import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getDestinations } from "@/lib/actions/destinations";
import { getDestinationSlug } from "@/lib/actions/destination-cookie";
import { PlannerWizard } from "../_components/PlannerWizard";
import { FaRobot } from "react-icons/fa6";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Trip Planner — Guidni",
  description: "Get a personalized day-by-day itinerary in seconds, powered by AI.",
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AIPlannerPage({ params }: Props) {
  const { locale } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/planner/ai`);
  }

  const t = await getTranslations({ locale, namespace: "AIPlannerPage" });

  const [destinations, destinationSlug] = await Promise.all([
    getDestinations(),
    getDestinationSlug(),
  ]);

  const currentDest =
    destinations.find((d) => d.slug === destinationSlug) ?? destinations[0];

  const destinationOptions = destinations.map((d) => ({
    id:      d.id,
    slug:    d.slug,
    city:    d.city,
    country: d.country,
  }));

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">

      {/* Back link */}
      <Link
        href={`/${locale}/planner`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backLink")}
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shrink-0">
          <FaRobot className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{t("subtitle")}</p>
        </div>
      </div>

      {/* Wizard */}
      <Suspense fallback={null}>
        <PlannerWizard
          destinations={destinationOptions}
          locale={locale}
          defaultDestinationId={currentDest?.id}
          defaultDestinationName={currentDest ? `${currentDest.city}, ${currentDest.country}` : ""}
          defaultDestinationCity={currentDest?.city}
        />
      </Suspense>

    </div>
  );
}
