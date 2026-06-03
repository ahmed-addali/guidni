import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { getGuides } from "@/lib/actions/guides";
import { getDestinationSlug } from "@/lib/actions/destination-cookie";
import { getDestinations } from "@/lib/actions/destinations";
import { GuideCard } from "@/components/planner/GuideCard";
import { GuideFilters } from "./_components/GuideFilters";
import { CategoryPageHero } from "@/components/shared/CategoryPageHero";
import { FaCompass } from "react-icons/fa6";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ spec?: string; sort?: string; q?: string }>;
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

  const sort  = sp.sort ?? "featured";
  const query = sp.q?.trim().toLowerCase() ?? "";

  const filtered = query
    ? guides.filter((g) =>
        g.displayName.toLowerCase().includes(query) ||
        (g.tagline ?? "").toLowerCase().includes(query) ||
        g.languages.some((l) => l.toLowerCase().includes(query))
      )
    : guides;

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "plans")  return b.planCount - a.planCount;
    if (sort === "rated")  return (parseFloat(b.note ?? "0") || 0) - (parseFloat(a.note ?? "0") || 0);
    if (sort === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return 0;
  });

  return (
    <div className="pb-16">
      <CategoryPageHero
        title={t("headingPrefix")}
        accent={currentDest?.city ?? t("headingFallbackCity")}
        subtitle={t("subheading")}
      />

      <section className="mx-auto w-full max-w-screen-xl px-4 md:px-20 py-8">
        {/* Filters */}
        <Suspense fallback={null}>
          <GuideFilters activeSpec={sp.spec} activeSort={sort} activeQuery={query} />
        </Suspense>

        {/* Results */}
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <FaCompass className="h-6 w-6 text-gray-400" />
            </div>
            {sp.spec ? (
              <>
                <p className="text-xl font-semibold text-gray-800">{t("noGuidesSpec")}</p>
                <p className="text-sm text-muted-foreground mt-2 max-w-xs">{t("noGuidesSpecHint")}</p>
              </>
            ) : (
              <>
                <p className="text-xl font-semibold text-gray-800">{t("noGuides")}</p>
                <p className="text-sm text-muted-foreground mt-2 max-w-xs">{t("noGuidesHint")}</p>
              </>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-6">
              {t("guideCount", { count: sorted.length })}
              {sp.spec ? ` · ${sp.spec.replace(/_/g, " ")}` : ""}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {sorted.map((guide) => (
                <GuideCard
                  key={guide.id}
                  slug={guide.slug}
                  displayName={guide.displayName}
                  tagline={guide.tagline}
                  avatarUrl={guide.avatarUrl}
                  coverUrl={guide.coverUrl}
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
      </section>
    </div>
  );
}
