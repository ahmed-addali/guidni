import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { FiStar } from "react-icons/fi";
import { IoRestaurant } from "react-icons/io5";
import { getRestaurantBySlug } from "@/lib/actions/restaurants";
import { getManualBadges } from "@/lib/actions/badges";
import { getAutoBadges } from "@/lib/utils/badge-utils";
import { BadgeList } from "@/components/badges/BadgeList";
import { MenuTab } from "../_components/MenuTab";

type Params = Promise<{ locale: string; slug: string }>;
type SearchParams = Promise<{ table?: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) return {};
  return { title: `${restaurant.name} — Menu` };
}

export default async function PublicMenuPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { locale, slug } = await params;
  const { table } = await searchParams;

  const [restaurant, t] = await Promise.all([
    getRestaurantBySlug(slug),
    getTranslations({ locale, namespace: "RestaurantPage" }),
  ]);

  if (!restaurant) notFound();

  const manualBadges = await getManualBadges(restaurant.id, "RESTAURANT");
  const autoBadges = getAutoBadges({ note: restaurant.note, nbReviews: restaurant.nbReviews });
  const allBadges = [...manualBadges, ...autoBadges];

  const name =
    locale === "ar" && restaurant.arabicName ? restaurant.arabicName : restaurant.name;

  const coverImage = restaurant.coverPhoto ?? restaurant.images[0]?.url ?? null;
  const rating = restaurant.note ? parseFloat(restaurant.note) : 0;

  return (
    <div className="min-h-screen bg-white">
      {/* ── Header ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/restaurants/${slug}`}
              className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>

            {/* Logo / cover thumbnail */}
            {coverImage ? (
              <div className="relative h-10 w-10 rounded-full overflow-hidden shrink-0">
                <Image src={coverImage} alt={name} fill className="object-cover" sizes="40px" />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <IoRestaurant className="h-4 w-4 text-gray-400" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{name}</p>
              {/* Rating + badge icons */}
              {rating > 0 && restaurant.nbReviews > 0 ? (
                <Link
                  href={`/${locale}/restaurants/${slug}#reviews-section`}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:underline"
                >
                  <FiStar className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium text-gray-700">{rating.toFixed(1)}</span>
                  <span>· {restaurant.nbReviews} {t("reviews")}</span>
                  {allBadges.length > 0 && (
                    <>
                      <span className="text-gray-300">·</span>
                      <BadgeList badges={allBadges} iconOnly />
                    </>
                  )}
                </Link>
              ) : (
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-gray-400">{t("menuPage.fullMenu")}</p>
                  {allBadges.length > 0 && (
                    <>
                      <span className="text-gray-300">·</span>
                      <BadgeList badges={allBadges} iconOnly />
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Table badge */}
            {table && (
              <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                {t("menuPage.table", { n: table })}
              </span>
            )}
          </div>

        </div>
      </div>

      {/* ── Menu ── */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <MenuTab
          menu={restaurant.menu}
          labels={{
            noMenu:  t("menu.noMenu"),
            groupBy: t("menu.groupBy"),
            showAll: t("menu.showAll"),
            other:   t("menu.other"),
          }}
        />
      </div>

      {/* ── Footer ── */}
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-xs text-gray-300">{t("menuPage.poweredBy")}</p>
      </div>
    </div>
  );
}
