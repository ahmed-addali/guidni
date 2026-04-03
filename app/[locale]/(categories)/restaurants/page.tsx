import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { getRestaurantsPaginated } from "@/lib/actions/restaurants";
import { getDestinationSlug } from "@/lib/actions/destination-cookie";
import { getDestinationBySlug } from "@/lib/actions/destinations";
import { getBadgesForListings } from "@/lib/actions/badges";
import { RestaurantCard } from "@/components/restaurants/RestaurantCard";
import { RestaurantIntentTabs } from "./_components/RestaurantIntentTabs";
import { RestaurantFilterSheet } from "./_components/RestaurantFilters";
import { RestaurantFilterChips } from "./_components/RestaurantFilterChips";
import { RestaurantSearch } from "./_components/RestaurantSearch";
import { CategoryPageHero } from "@/components/shared/CategoryPageHero";
import { Pagination } from "@/components/shared/Pagination";
import { IoRestaurant } from "react-icons/io5";

type SearchParams = Promise<{
  type?:        string;
  cuisine?:     string;
  meal?:        string;
  foodType?:    string;
  diet?:        string;
  attributes?:  string;
  reservation?: string;
  search?:      string;
  page?:        string;
}>;
type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "RestaurantsPage" });
  return { title: t("titleDefault"), description: t("subtitle") };
}

export default async function RestaurantsPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  const {
    type, cuisine, meal, foodType, diet, attributes, reservation, search, page: pageParam,
  } = await searchParams;
  const t = await getTranslations({ locale, namespace: "RestaurantsPage" });

  const destination = await getDestinationSlug();
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const typeList      = type       ? type.split(",").filter(Boolean)       : [];
  const cuisineList   = cuisine    ? cuisine.split(",").filter(Boolean)    : [];
  const mealList      = meal       ? meal.split(",").filter(Boolean)       : [];
  const foodTypeList  = foodType   ? foodType.split(",").filter(Boolean)   : [];
  const dietList      = diet       ? diet.split(",").filter(Boolean)       : [];
  const attributeList = attributes ? attributes.split(",").filter(Boolean) : [];

  const [{ restaurants, total, totalPages }, destinationRecord] = await Promise.all([
    getRestaurantsPaginated({
      destinationSlug: destination,
      typeList,
      cuisineList,
      mealList,
      foodTypeList,
      dietList,
      attributeList,
      reservation: reservation === "true",
      search,
      page,
    }),
    getDestinationBySlug(destination),
  ]);

  const badgesMap = await getBadgesForListings(
    restaurants.map((r) => r.id),
    "RESTAURANT"
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
              <RestaurantSearch
                placeholder={t("searchPlaceholder")}
                clearLabel={t("clearSearch")}
                defaultValue={search}
              />
            </div>
            <RestaurantFilterSheet />
          </div>
        </Suspense>
      </CategoryPageHero>

      {/* Intent tabs */}
      <Suspense>
        <RestaurantIntentTabs />
      </Suspense>

      {/* Results */}
      <section className="mx-auto w-full max-w-screen-xl px-4 md:px-20 mt-2">

        {/* Active filter chips */}
        <Suspense>
          <div className="mb-4">
            <RestaurantFilterChips />
          </div>
        </Suspense>

        {/* Result count */}
        <div className="mb-6">
          <p className="text-sm text-gray-500">
            {t("resultsCount", { count: total })}
          </p>
        </div>

        {restaurants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
              <IoRestaurant className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-xl font-semibold text-gray-800">{t("noResults")}</p>
            <p className="text-sm text-muted-foreground max-w-xs">{t("noResultsHint")}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {restaurants.map((r) => (
                <RestaurantCard key={r.id} restaurant={r} locale={locale} badges={badgesMap[r.id]} />
              ))}
            </div>

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
