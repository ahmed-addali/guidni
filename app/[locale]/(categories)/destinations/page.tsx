import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { MapPin, Compass, BedDouble, UtensilsCrossed } from "lucide-react";
import { getDestinations } from "@/lib/actions/destinations";
import { MaxWidthWrapper } from "@/components/shared/MaxWidthWrapper";
import { DestinationFilters } from "./_components/DestinationFilters";
import { cn } from "@/lib/utils";

// Fallback gradient per destination slug
const DESTINATION_GRADIENTS: Record<string, string> = {
  djerba:   "from-cyan-400 to-blue-500",
  hammamet: "from-teal-400 to-emerald-500",
  tunis:    "from-amber-400 to-orange-500",
  paris:    "from-pink-400 to-rose-500",
  nice:     "from-violet-400 to-purple-500",
  dubai:    "from-yellow-400 to-amber-500",
};
const DEFAULT_GRADIENT = "from-primary to-blue-600";

// Country flag emojis
const COUNTRY_FLAGS: Record<string, string> = {
  Tunisia:      "🇹🇳",
  France:       "🇫🇷",
  UAE:          "🇦🇪",
  Morocco:      "🇲🇦",
  Spain:        "🇪🇸",
  Italy:        "🇮🇹",
  Greece:       "🇬🇷",
  Egypt:        "🇪🇬",
  Turkey:       "🇹🇷",
  Portugal:     "🇵🇹",
  Jordan:       "🇯🇴",
};

type SearchParams = Promise<{ country?: string; q?: string }>;

export default async function DestinationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { country, q } = await searchParams;

  const [destinations, locale, t] = await Promise.all([
    getDestinations(),
    getLocale(),
    getTranslations("Destinations"),
  ]);

  const countries = Array.from(new Set(destinations.map((d) => d.country))).sort();
  const featured  = destinations.filter((d) => d.featured);

  // Search scans ALL destinations regardless of country select.
  // Country select filters independently (and clears search, handled client-side).
  let filtered = destinations;
  if (q) {
    const ql = q.toLowerCase();
    filtered = filtered.filter((d) =>
      d.city.toLowerCase().includes(ql) ||
      d.country.toLowerCase().includes(ql)
    );
  } else if (country) {
    filtered = filtered.filter((d) => d.country === country);
  }

  const isFiltered = Boolean(country || q);

  // Featured hero: first featured becomes a wide banner, rest go in a 2-col row
  const [heroFeatured, ...restFeatured] = featured;

  return (
    <div className="pb-16">

      {/* ── Page header ── */}
      <section className="pt-12 pb-8 sm:pt-16 sm:pb-10 text-center max-w-2xl mx-auto px-4">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          {t("heroTitle")}{" "}
          <span className="text-blue-600">{t("heroAccent")}</span>
        </h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
          {t("heroSubtitle")}
        </p>

        {/* Search + country select — inline in header */}
        <div className="mt-6 flex justify-center">
          <Suspense>
            <DestinationFilters
              searchPlaceholder={t("searchPlaceholder")}
              clearLabel={t("clearSearch")}
              countryPlaceholder={t("countrySelectPlaceholder")}
              filterAll={t("filterAll")}
              countries={countries}
              flags={COUNTRY_FLAGS}
              defaultSearch={q}
              defaultCountry={country}
            />
          </Suspense>
        </div>
      </section>

      <MaxWidthWrapper>

        {/* ── Featured section — default view only ── */}
        {!isFiltered && featured.length > 0 && (
          <section className="mb-14">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">{t("featuredTitle")}</h2>
              <p className="text-sm text-muted-foreground mt-1">{t("featuredSubtitle")}</p>
            </div>

            {/* Hero banner — first featured destination */}
            {heroFeatured && (
              <div className="mb-4">
                <DestinationCard dest={heroFeatured} locale={locale} t={t} hero />
              </div>
            )}

            {/* Remaining featured — 2 or 3 col */}
            {restFeatured.length > 0 && (
              <div className={cn(
                "grid gap-4",
                restFeatured.length === 1
                  ? "grid-cols-1 max-w-sm"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              )}>
                {restFeatured.map((dest) => (
                  <DestinationCard key={dest.slug} dest={dest} locale={locale} t={t} featured />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── All / filtered results ── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {isFiltered ? (
                <>
                  {t("resultsCount", { count: filtered.length })}
                  {country && (
                    <span className="ml-2 text-blue-600">
                      {COUNTRY_FLAGS[country]} {country}
                    </span>
                  )}
                </>
              ) : (
                t("allDestinations")
              )}
            </h2>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-3 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                <Compass className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-xl font-semibold text-gray-800">{t("noResults")}</p>
              <p className="text-sm text-muted-foreground max-w-xs">{t("noResultsHint")}</p>
              <Link href={`/${locale}/destinations`} className="text-sm text-blue-600 hover:underline mt-1">
                {t("filterAll")}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((dest) => (
                <DestinationCard key={dest.slug} dest={dest} locale={locale} t={t} />
              ))}
            </div>
          )}
        </section>

      </MaxWidthWrapper>
    </div>
  );
}

// ─── DestinationCard ──────────────────────────────────────────────────────────

type DestinationWithCounts = Awaited<ReturnType<typeof getDestinations>>[number];

function DestinationCard({
  dest,
  locale,
  t,
  featured,
  hero,
}: {
  dest: DestinationWithCounts;
  locale: string;
  t: Awaited<ReturnType<typeof getTranslations<"Destinations">>>;
  featured?: boolean;
  hero?: boolean;
}) {
  const gradient = DESTINATION_GRADIENTS[dest.slug] ?? DEFAULT_GRADIENT;
  const counts   = dest._count;
  const flag     = COUNTRY_FLAGS[dest.country] ?? "";

  return (
    <Link
      href={`/${locale}/destinations/${dest.slug}`}
      className={cn(
        "group block rounded-2xl overflow-hidden relative",
        hero ? "aspect-[16/7] sm:aspect-[21/9]" : "aspect-[4/3]"
      )}
    >
      {/* Image / gradient background */}
      {dest.coverImage ? (
        <Image
          src={dest.coverImage}
          alt={dest.city}
          fill
          sizes={hero
            ? "(max-width: 640px) 100vw, 100vw"
            : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          }
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          priority={hero}
        />
      ) : (
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br group-hover:scale-105 transition-transform duration-500",
          gradient
        )} />
      )}

      {/* Gradient overlay — stronger at bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Featured badge */}
      {featured && (
        <div className="absolute top-3 left-3">
          <span className="bg-white/90 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">
            {t("featuredLabel")}
          </span>
        </div>
      )}

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
        <p className={cn("text-white font-bold leading-tight", hero ? "text-3xl sm:text-4xl" : "text-xl")}>
          {dest.city}
        </p>
        <div className="flex items-center gap-1 mt-1">
          <MapPin className="h-3.5 w-3.5 text-white/70 shrink-0" />
          <p className="text-white/70 text-sm">
            {flag && <span className="mr-1">{flag}</span>}
            {dest.country}
          </p>
        </div>

        {/* Count chips — inside overlay */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {counts.activities > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-white/90 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-2.5 py-0.5">
              <Compass className="h-3 w-3" />
              {t("activitiesCount", { count: counts.activities })}
            </span>
          )}
          {counts.stays > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-white/90 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-2.5 py-0.5">
              <BedDouble className="h-3 w-3" />
              {t("staysCount", { count: counts.stays })}
            </span>
          )}
          {counts.restaurants > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-white/90 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-2.5 py-0.5">
              <UtensilsCrossed className="h-3 w-3" />
              {t("restaurantsCount", { count: counts.restaurants })}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
