import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { getStaysPaginated } from "@/lib/actions/stays";
import { getDestinationSlug } from "@/lib/actions/destination-cookie";
import { getDestinationBySlug } from "@/lib/actions/destinations";
import { getBadgesForListings } from "@/lib/actions/badges";
import { StayCard } from "@/components/stays/StayCard";
import { StaySearch } from "@/components/stays/StaySearch";
import { StayFilterSheet } from "@/components/stays/StayFilterSheet";
import { StayFilterChips } from "@/components/stays/StayFilterChips";
import { StayViewToggle } from "@/components/stays/StayViewToggle";
import { StayMapView } from "@/components/stays/StayMapView";
import { CategoryPageHero } from "@/components/shared/CategoryPageHero";
import { Pagination } from "@/components/shared/Pagination";
import { IoBedOutline } from "react-icons/io5";

type SearchParams = Promise<{
  category?: string;
  search?: string;
  page?: string;
  priceMin?: string;
  priceMax?: string;
  minGuests?: string;
  view?: string;
}>;
type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "StaysPage" });
  return { title: t("titleDefault"), description: t("subtitle") };
}

export default async function StaysPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  const { category, search, page: pageParam, priceMin: priceMinParam, priceMax: priceMaxParam, minGuests: minGuestsParam, view } = await searchParams;
  const isMapView = view === "map";
  const t = await getTranslations({ locale, namespace: "StaysPage" });

  const destination = await getDestinationSlug();
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const categories = category ? category.split(",").filter(Boolean) : [];
  const priceMin = priceMinParam ? parseInt(priceMinParam, 10) || undefined : undefined;
  const priceMax = priceMaxParam ? parseInt(priceMaxParam, 10) || undefined : undefined;
  const minGuests = minGuestsParam ? parseInt(minGuestsParam, 10) || undefined : undefined;

  const [{ stays, total, totalPages }, destinationRecord] = await Promise.all([
    getStaysPaginated({ destinationSlug: destination, categories, search, page, priceMin, priceMax, minGuests }),
    getDestinationBySlug(destination),
  ]);

  const badgesMap = await getBadgesForListings(
    stays.map((s) => s.id),
    "STAY"
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
              <StaySearch
                placeholder={t("searchPlaceholder")}
                clearLabel={t("clearSearch")}
                defaultValue={search}
              />
            </div>
            <StayFilterSheet
              locale={locale}
              allLabel={t("allStays")}
              filtersLabel={t("filtersLabel")}
              clearLabel={t("clearFilters")}
              labels={{
                filterCategories: t("filterCategories"),
                filterPrice: t("filterPrice"),
                filterPriceMin: t("filterPriceMin"),
                filterPriceMax: t("filterPriceMax"),
                filterGuests: t("filterGuests"),
                filterGuestsAny: t("filterGuestsAny"),
              }}
            />
          </div>
        </Suspense>
      </CategoryPageHero>

      <section className="mx-auto w-full max-w-screen-xl px-4 md:px-20 py-8">
        {/* Active filter chips */}
        <Suspense>
          <div className="mb-4">
            <StayFilterChips
            locale={locale}
            clearAllLabel={t("clearFilters")}
            priceChipLabel={t("chipPrice")}
            guestsChipLabel={t("chipGuests")}
          />
          </div>
        </Suspense>

        {/* Result count + view toggle */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <p className="text-sm text-gray-500">
            {t("resultsCount", { count: total })}
          </p>
          <Suspense>
            <StayViewToggle gridLabel={t("viewGrid")} mapLabel={t("viewMap")} />
          </Suspense>
        </div>

        {/* Content: grid or map */}
        {stays.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
              <IoBedOutline className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-xl font-semibold text-gray-800">{t("noStays")}</p>
            <p className="text-sm text-muted-foreground max-w-xs">{t("noStaysHint")}</p>
          </div>
        ) : isMapView ? (
          <StayMapView
            stays={stays}
            locale={locale}
            perNight={t("perNight")}
            currency={t("currency")}
            viewLabel={t("viewMap")}
            noCoordsBanner={t("mapNoCoords")}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {stays.map((stay) => (
                <StayCard
                  key={stay.id}
                  stay={stay}
                  locale={locale}
                  perNight={t("perNight")}
                  currency={t("currency")}
                  badges={badgesMap[stay.id]}
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
