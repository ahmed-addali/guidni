import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { getGuidePlans, getPlanRatings } from "@/lib/actions/guides";
import { getDestinations } from "@/lib/actions/destinations";
import { getDestinationSlug } from "@/lib/actions/destination-cookie";
import { GuidePlanCard } from "@/components/planner/GuidePlanCard";
import { GuidePlanFilters } from "./_components/GuidePlanFilters";
import { CategoryPageHero } from "@/components/shared/CategoryPageHero";
import { FaMapLocationDot } from "react-icons/fa6";
import Link from "next/link";
import type { GuidePlanSort } from "@/lib/actions/guides";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    type?: string;
    sort?: string;
    q?: string;
    difficulty?: string;
    for?: string;
    minDur?: string;
    maxDur?: string;
    maxPrice?: string;
  }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ locale }] = await Promise.all([params, searchParams]);
  const t = await getTranslations({ locale, namespace: "PlansListing" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
    },
  };
}

export default async function PlansMarketplacePage({ params, searchParams }: Props) {
  const [{ locale }, sp, destinations, destinationSlug] = await Promise.all([
    params,
    searchParams,
    getDestinations(),
    getDestinationSlug(),
  ]);

  const t = await getTranslations({ locale, namespace: "PlansListing" });

  const currentDest =
    destinations.find((d) => d.slug === destinationSlug) ?? destinations[0];

  const sort      = (sp.sort as GuidePlanSort | undefined) ?? "popular";
  const query     = sp.q?.trim() ?? "";
  const planType  = sp.type as "GUIDE_FREE" | "GUIDE_PAID" | undefined;
  const minDur    = sp.minDur  ? parseInt(sp.minDur, 10)   : undefined;
  const maxDur    = sp.maxDur  ? parseInt(sp.maxDur, 10)   : undefined;
  const maxPrice  = sp.maxPrice ? parseInt(sp.maxPrice, 10) : undefined;

  const plans = await getGuidePlans({
    destinationId: currentDest?.id,
    planType:      planType ?? "all",
    sort,
    search:        query || undefined,
    difficulty:    sp.difficulty || undefined,
    suitableFor:   sp.for || undefined,
    minDuration:   minDur,
    maxDuration:   maxDur,
    maxPrice,
  });

  const planIds = plans.map((p) => p.id);
  const ratings = planIds.length > 0 ? await getPlanRatings(planIds) : {};

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
          <GuidePlanFilters
            activeType={planType}
            activeSort={sort}
            activeQuery={query}
            activeDifficulty={sp.difficulty}
            activeSuitableFor={sp.for}
            activeMinDuration={minDur}
            activeMaxDuration={maxDur}
            activeMaxPrice={maxPrice}
          />
        </Suspense>

        {/* Results */}
        {plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
              <FaMapLocationDot className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-xl font-semibold text-gray-800">{t("noPlans")}</p>
            <p className="text-sm text-muted-foreground max-w-xs">{t("noPlansHint")}</p>
            {(planType || sp.difficulty || sp.for || minDur || maxDur || maxPrice) && (
              <Link
                href={`/${locale}/planner/plans`}
                className="mt-2 text-sm font-medium text-blue-600 hover:underline"
              >
                {t("clearFilters")}
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-6">
              {t("planCount", { count: plans.length })}
              {currentDest ? ` · ${currentDest.city}` : ""}
              {planType === "GUIDE_FREE" ? ` · ${t("typeFree")}` : ""}
              {planType === "GUIDE_PAID" ? ` · ${t("typePaid")}` : ""}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {plans.map((plan) => (
                <GuidePlanCard
                  key={plan.id}
                  plan={plan}
                  locale={locale}
                  rating={ratings[plan.id]}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
