import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { getGuides } from "@/lib/actions/guides";
import { getDestinationSlug } from "@/lib/actions/destination-cookie";
import { getDestinations } from "@/lib/actions/destinations";
import { GuideCard } from "@/components/planner/GuideCard";
import { GuideFilters } from "./_components/GuideFilters";
import { FaCompass } from "react-icons/fa6";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ spec?: string; sort?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "GuidesListing" });
  return {
    title: `${t("pageLabel")} — Guidni`,
    description: t("subheading"),
  };
}

export default async function GuidesListingPage({ params, searchParams }: Props) {
  const [{ locale }, sp, destinations, slug] = await Promise.all([
    params,
    searchParams,
    getDestinations(),
    getDestinationSlug(),
  ]);

  const [t, tCard] = await Promise.all([
    getTranslations({ locale, namespace: "GuidesListing" }),
    getTranslations({ locale, namespace: "GuideCard" }),
  ]);

  const currentDest = destinations.find((d) => d.slug === slug) ?? destinations[0];

  const guides = await getGuides({
    destinationId: currentDest?.id,
    specialization: sp.spec,
  });

  const sort = sp.sort ?? "featured";
  const sorted = [...guides].sort((a, b) => {
    if (sort === "plans")  return b.planCount - a.planCount;
    if (sort === "rated")  return (parseFloat(b.note ?? "0") || 0) - (parseFloat(a.note ?? "0") || 0);
    if (sort === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return 0;
  });

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-10">
      {/* Back link */}
      <Link
        href={`/${locale}/planner`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-8 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("backLink")}
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <FaCompass className="h-5 w-5 text-blue-600" />
          <p className="text-sm font-medium text-blue-600">{t("pageLabel")}</p>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
          {t("headingPrefix")}{" "}
          <span className="text-blue-600">{currentDest?.city ?? t("headingFallbackCity")}</span>
        </h1>
        <p className="text-gray-400 text-sm mt-2 max-w-lg">{t("subheading")}</p>
      </div>

      {/* Filters */}
      <Suspense fallback={null}>
        <GuideFilters activeSpec={sp.spec} activeSort={sort} />
      </Suspense>

      {/* Results */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FaCompass className="h-10 w-10 text-gray-200 mb-4" />
          {sp.spec ? (
            <>
              <p className="text-gray-500 font-medium">{t("noGuidesSpec")}</p>
              <p className="text-gray-400 text-sm mt-1">{t("noGuidesSpecHint")}</p>
            </>
          ) : (
            <>
              <p className="text-gray-500 font-medium">{t("noGuides")}</p>
              <p className="text-gray-400 text-sm mt-1">{t("noGuidesHint")}</p>
            </>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-4">
            {t("guideCount", { count: sorted.length })}
            {sp.spec ? ` · ${sp.spec.replace(/_/g, " ")}` : ""}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sorted.map((guide) => (
              <GuideCard
                key={guide.id}
                slug={guide.slug}
                displayName={guide.displayName}
                tagline={guide.tagline}
                avatarUrl={guide.avatarUrl}
                specializations={guide.specializations}
                languages={guide.languages}
                note={guide.note}
                nbReviews={guide.nbReviews}
                planCount={guide.planCount}
                planCountLabel={tCard("planCount", { count: guide.planCount })}
                isVerified={guide.isVerified}
                destination={guide.destination}
                locale={locale}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
