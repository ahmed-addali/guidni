import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { MapPin, Compass, BedDouble, UtensilsCrossed } from "lucide-react";
import { getDestinationBySlug } from "@/lib/actions/destinations";
import { getDestinationGuide } from "@/lib/data/destination-guides";
import { MaxWidthWrapper } from "@/components/shared/MaxWidthWrapper";
import { GuideNav } from "./_components/GuideNav";
import { OverviewSection } from "./_components/OverviewSection";
import { AttractionsSection } from "./_components/AttractionsSection";
import { WeatherSection } from "./_components/WeatherSection";
import { FoodSection } from "./_components/FoodSection";
import { TransportSection } from "./_components/TransportSection";
import { BudgetSection } from "./_components/BudgetSection";
import { SafetySection } from "./_components/SafetySection";
import { PackingSection } from "./_components/PackingSection";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const destination = await getDestinationBySlug(slug);
  if (!destination) return {};
  return {
    title: `${destination.city} Travel Guide · Guidni`,
    description: destination.description ?? undefined,
  };
}

export default async function DestinationGuidePage({ params }: Props) {
  const { slug } = await params;

  const [destination, locale, t] = await Promise.all([
    getDestinationBySlug(slug),
    getLocale(),
    getTranslations("DestinationGuide"),
  ]);

  if (!destination) notFound();

  const guideData = getDestinationGuide(slug);
  const guide =
    guideData?.[locale as "en" | "fr" | "ar"] ?? guideData?.en ?? null;

  const navSections = guide
    ? [
        { id: "overview", label: t("overview") },
        { id: "attractions", label: t("attractions") },
        { id: "weather", label: t("weather") },
        { id: "food", label: t("food") },
        { id: "transport", label: t("transport") },
        { id: "budget", label: t("budget") },
        { id: "safety", label: t("safety") },
        { id: "packing", label: t("packing") },
      ]
    : [];

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative h-80 sm:h-[500px] w-full overflow-hidden">
        {destination.coverImage ? (
          <img
            src={destination.coverImage}
            alt={destination.city}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-blue-700" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

        <div className="absolute bottom-0 left-0 right-0 pb-8 sm:pb-14">
          <MaxWidthWrapper>
            <div className="flex items-center gap-1.5 text-white/70 text-sm mb-2">
              <MapPin className="h-4 w-4" />
              <span>
                {destination.region
                  ? `${destination.region}, ${destination.country}`
                  : destination.country}
              </span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-2">
              {destination.city}
            </h1>
            {guide && (
              <p className="text-white/80 text-base sm:text-xl italic">
                &ldquo;{guide.tagline}&rdquo;
              </p>
            )}

            {/* Quick CTA pills on hero */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Link
                href={`/${locale}/activities?destination=${destination.slug}`}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-white/20 hover:bg-white/30 border border-white/30 text-white text-sm font-medium rounded-full backdrop-blur-sm transition-colors"
              >
                <Compass className="h-3.5 w-3.5" />
                {t("activities")}
              </Link>
              <Link
                href={`/${locale}/stays?destination=${destination.slug}`}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-white/20 hover:bg-white/30 border border-white/30 text-white text-sm font-medium rounded-full backdrop-blur-sm transition-colors"
              >
                <BedDouble className="h-3.5 w-3.5" />
                {t("stays")}
              </Link>
              <Link
                href={`/${locale}/restaurants?destination=${destination.slug}`}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-white/20 hover:bg-white/30 border border-white/30 text-white text-sm font-medium rounded-full backdrop-blur-sm transition-colors"
              >
                <UtensilsCrossed className="h-3.5 w-3.5" />
                {t("restaurants")}
              </Link>
            </div>
          </MaxWidthWrapper>
        </div>
      </div>

      {/* ── Sticky guide nav ─────────────────────────────────────────────── */}
      {guide && <GuideNav sections={navSections} />}

      <MaxWidthWrapper className="py-10">
        {guide ? (
          <div className="max-w-screen-lg">
            <OverviewSection guide={guide} />
            <AttractionsSection destinationSlug={slug} locale={locale} />
            <WeatherSection guide={guide} />
            <FoodSection guide={guide} />
            <TransportSection guide={guide} />
            <BudgetSection guide={guide} />
            <SafetySection guide={guide} />
            <PackingSection guide={guide} />

            {/* ── Explore CTA ───────────────────────────────────────────── */}
            <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-8 text-white text-center">
              <h3 className="text-2xl font-bold mb-2">
                {t("readyToExplore", { city: destination.city })}
              </h3>
              <p className="text-white/80 mb-6 max-w-lg mx-auto">
                {t("exploreSubtitle")}
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link
                  href={`/${locale}/activities?destination=${destination.slug}`}
                >
                  <button className="flex items-center gap-2 px-6 py-2.5 bg-white text-primary text-sm font-semibold rounded-xl hover:bg-white/90 transition-colors">
                    <Compass className="h-4 w-4" />
                    {t("activities")}
                  </button>
                </Link>
                <Link href={`/${locale}/stays?destination=${destination.slug}`}>
                  <button className="flex items-center gap-2 px-6 py-2.5 bg-white/20 text-white border border-white/30 text-sm font-semibold rounded-xl hover:bg-white/30 transition-colors">
                    <BedDouble className="h-4 w-4" />
                    {t("stays")}
                  </button>
                </Link>
                <Link
                  href={`/${locale}/restaurants?destination=${destination.slug}`}
                >
                  <button className="flex items-center gap-2 px-6 py-2.5 bg-white/20 text-white border border-white/30 text-sm font-semibold rounded-xl hover:bg-white/30 transition-colors">
                    <UtensilsCrossed className="h-4 w-4" />
                    {t("restaurants")}
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* ── Fallback when no rich guide data ───────────────────────── */
          <div className="max-w-2xl">
            {destination.description && (
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                {destination.description}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/${locale}/activities?destination=${destination.slug}`}
              >
                <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors">
                  <Compass className="h-4 w-4" />
                  {t("activities")} in {destination.city}
                </button>
              </Link>
              <Link href={`/${locale}/stays?destination=${destination.slug}`}>
                <button className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                  <BedDouble className="h-4 w-4" />
                  {t("stays")} in {destination.city}
                </button>
              </Link>
            </div>
          </div>
        )}
      </MaxWidthWrapper>
    </div>
  );
}
