import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { getActivitiesPaginated } from "@/lib/actions/activities";
import { getDestinationSlug } from "@/lib/actions/destination-cookie";
import { getDestinationBySlug } from "@/lib/actions/destinations";
import { getBadgesForListings } from "@/lib/actions/badges";
import { ActivityCard } from "@/components/activities/ActivityCard";
import { ActivitySearch } from "@/components/activities/ActivitySearch";
import { ActivityFilterSheet } from "@/components/activities/ActivityFilterSheet";
import { ActivityFilterChips } from "@/components/activities/ActivityFilterChips";
import { ActivityViewToggle } from "@/components/activities/ActivityViewToggle";
import { ActivityMapView } from "@/components/activities/ActivityMapView";
import { CategoryPageHero } from "@/components/shared/CategoryPageHero";
import { Pagination } from "@/components/shared/Pagination";
import { FiCompass } from "react-icons/fi";

type SearchParams = Promise<{
  category?: string;
  search?: string;
  page?: string;
  sort?: string;
  priceRange?: string;
  duration?: string;
  view?: string;
}>;
type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ActivitiesPage" });
  return { title: t("titleDefault"), description: t("subtitle") };
}

export default async function ActivitiesPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  const { category, search, page: pageParam, sort, priceRange, duration, view } = await searchParams;
  const isMapView = view === "map";
  const t = await getTranslations({ locale, namespace: "ActivitiesPage" });

  const destination = await getDestinationSlug();
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const categories = category ? category.split(",").filter(Boolean) : [];

  const [{ activities, total, totalPages }, destinationRecord] = await Promise.all([
    getActivitiesPaginated({
      destinationSlug: destination,
      categories,
      search,
      page,
      sortBy:     (sort       as "popular" | "price_asc" | "price_desc" | "rating" | "newest") || undefined,
      priceRange: (priceRange as "0-50" | "50-150" | "150-300" | "300+")                        || undefined,
      duration:   (duration   as "short" | "half" | "full" | "multi")                           || undefined,
    }),
    getDestinationBySlug(destination),
  ]);

  const badgesMap = await getBadgesForListings(
    activities.map((a) => a.id),
    "ACTIVITY"
  );

  const destinationCity = destinationRecord?.city ?? null;

  return (
    <div className="pb-16 sm:pb-12">
      <CategoryPageHero
        title={t("titlePrefix")}
        accent={destinationCity ?? t("titleFallback")}
        subtitle={t("subtitle")}
      >
        <Suspense>
          <div className="flex items-center gap-2 w-full max-w-xl">
            <div className="flex-1 min-w-0">
              <ActivitySearch
                placeholder={t("searchPlaceholder")}
                clearLabel={t("clearSearch")}
                defaultValue={search}
              />
            </div>
            <ActivityFilterSheet
              locale={locale}
              allLabel={t("allActivities")}
              filtersLabel={t("filtersLabel")}
              clearLabel={t("clearFilters")}
              sortLabel={t("sortLabel")}
              sortOptions={{
                popular:    t("sortPopular"),
                price_asc:  t("sortPriceAsc"),
                price_desc: t("sortPriceDesc"),
                rating:     t("sortRating"),
                newest:     t("sortNewest"),
              }}
              priceLabel={t("priceLabel")}
              priceOptions={{
                "0-50":    t("price0to50"),
                "50-150":  t("price50to150"),
                "150-300": t("price150to300"),
                "300+":    t("price300plus"),
              }}
              durationLabel={t("durationLabel")}
              durationOptions={{
                short: t("durationShort"),
                half:  t("durationHalf"),
                full:  t("durationFull"),
                multi: t("durationMulti"),
              }}
            />
          </div>
        </Suspense>
      </CategoryPageHero>

      <section className="mx-auto w-full max-w-screen-xl px-4 md:px-20 py-8">
        {/* Active filter chips */}
        <Suspense>
          <div className="mb-4">
            <ActivityFilterChips
              locale={locale}
              clearAllLabel={t("clearFilters")}
              sortOptions={{
                popular:    t("sortPopular"),
                price_asc:  t("sortPriceAsc"),
                price_desc: t("sortPriceDesc"),
                rating:     t("sortRating"),
                newest:     t("sortNewest"),
              }}
              priceOptions={{
                "0-50":    t("price0to50"),
                "50-150":  t("price50to150"),
                "150-300": t("price150to300"),
                "300+":    t("price300plus"),
              }}
              durationOptions={{
                short: t("durationShort"),
                half:  t("durationHalf"),
                full:  t("durationFull"),
                multi: t("durationMulti"),
              }}
            />
          </div>
        </Suspense>

        {/* Result count + view toggle */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <p className="text-sm text-gray-500">
            {t("resultsCount", { count: total })}
          </p>
          <Suspense>
            <ActivityViewToggle gridLabel={t("viewGrid")} mapLabel={t("viewMap")} />
          </Suspense>
        </div>

        {/* Map or Grid */}
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
              <FiCompass className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-xl font-semibold text-gray-800">
              {t("noActivities")}
            </p>
            <p className="text-sm text-muted-foreground max-w-xs">
              {t("noActivitiesHint")}
            </p>
          </div>
        ) : isMapView ? (
          <ActivityMapView activities={activities} locale={locale} />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {activities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  locale={locale}
                  badges={badgesMap[activity.id]}
                />
              ))}
            </div>

            {/* Pagination */}
            <Suspense>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                previousLabel={t("previous")}
                nextLabel={t("next")}
              />
            </Suspense>
          </>
        )}
      </section>
    </div>
  );
}
