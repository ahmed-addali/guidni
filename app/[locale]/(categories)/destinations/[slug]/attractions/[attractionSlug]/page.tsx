import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getAttractionBySlug, getRelatedAttractions } from "@/lib/actions/attractions";
import { MaxWidthWrapper } from "@/components/shared/MaxWidthWrapper";
import { AttractionPracticalInfo } from "./_components/AttractionPracticalInfo";
import { RelatedActivities } from "./_components/RelatedActivities";
import { RelatedAttractions } from "./_components/RelatedAttractions";

const CATEGORY_GRADIENTS: Record<string, string> = {
  beach: "from-cyan-400 to-blue-500",
  culture: "from-purple-400 to-pink-500",
  nature: "from-green-400 to-teal-500",
  religion: "from-indigo-400 to-purple-500",
  history: "from-amber-400 to-orange-500",
  entertainment: "from-rose-400 to-pink-500",
};

type Props = { params: Promise<{ slug: string; attractionSlug: string }> };

export default async function AttractionDetailPage({ params }: Props) {
  const { slug: destinationSlug, attractionSlug } = await params;

  const [attraction, locale, t] = await Promise.all([
    getAttractionBySlug(destinationSlug, attractionSlug),
    getLocale(),
    getTranslations("AttractionPage"),
  ]);

  if (!attraction) notFound();

  const relatedAttractions = await getRelatedAttractions(
    attraction.destinationId ?? "",
    attraction.category,
    attraction.id
  );

  const coverImage = attraction.images[0]?.url;
  const galleryImages = attraction.images.slice(1);
  const gradient =
    CATEGORY_GRADIENTS[attraction.category?.toLowerCase() ?? ""] ?? "from-primary to-blue-600";

  const destination = attraction.destination;
  const categoryLabel =
    t(`categoryBadge.${attraction.category as "culture" | "religion" | "beach" | "nature" | "history" | "entertainment"}`) ??
    attraction.category;

  // Translation-aware content
  const localeTranslation = attraction.translations.find((tr) => tr.locale === locale);
  const title = localeTranslation?.title ?? attraction.title;
  const description = localeTranslation?.description ?? attraction.description;
  const overview = localeTranslation?.overview ?? attraction.overview;

  // Practical info adapter for the component
  const tAdapter = (key: string) => t(key as Parameters<typeof t>[0]);

  return (
    <>
      {/* Hero */}
      <div className="relative h-72 sm:h-96 w-full overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <MaxWidthWrapper>
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-white/70 text-xs mb-3">
              <Link href={`/${locale}/destinations`} className="hover:text-white transition-colors">
                {t("breadcrumbDestinations")}
              </Link>
              <ChevronRight className="h-3 w-3" />
              {destination && (
                <>
                  <Link
                    href={`/${locale}/destinations/${destination.slug}`}
                    className="hover:text-white transition-colors"
                  >
                    {destination.city}
                  </Link>
                  <ChevronRight className="h-3 w-3" />
                </>
              )}
              <span className="text-white/50">{t("breadcrumbAttractions")}</span>
            </nav>

            <div className="flex items-end gap-3">
              <div>
                <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full mb-2">
                  {categoryLabel}
                </span>
                <h1 className="text-2xl sm:text-4xl font-bold text-white leading-tight">
                  {title}
                </h1>
              </div>
            </div>
          </MaxWidthWrapper>
        </div>
      </div>

      <MaxWidthWrapper className="py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
          {/* LEFT COLUMN */}
          <div className="space-y-10">
            {/* About */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t("about")}</h2>
              <p className="text-gray-700 leading-relaxed">{description}</p>
              {overview && (
                <p className="text-gray-600 leading-relaxed mt-4">{overview}</p>
              )}
            </section>

            {/* Image gallery */}
            {galleryImages.length > 0 && (
              <section>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {galleryImages.map((img, i) => (
                    <div key={img.id ?? i} className="aspect-video rounded-xl overflow-hidden">
                      <img
                        src={img.url}
                        alt={`${title} ${i + 2}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Related Activities (M2M) */}
            {attraction.activities.length > 0 && (
              <RelatedActivities
                activities={attraction.activities}
                locale={locale}
                title={t("relatedActivities")}
              />
            )}

            {/* Related Attractions */}
            {relatedAttractions.length > 0 && (
              <RelatedAttractions
                attractions={relatedAttractions}
                destinationSlug={destinationSlug}
                locale={locale}
                title={t("relatedAttractions")}
              />
            )}
          </div>

          {/* RIGHT COLUMN (sticky) */}
          <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            {/* Practical info card */}
            <AttractionPracticalInfo attraction={attraction} t={tAdapter} />

            {/* Book CTA card */}
            {attraction.activities.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5">
                <h3 className="font-semibold text-gray-900 mb-3">{t("ticketTitle")}</h3>
                <div className="space-y-2">
                  {attraction.activities.slice(0, 2).map((activity) => (
                    <Link
                      key={activity.id}
                      href={`/${locale}/activities/${activity.slug}`}
                      className="flex items-center justify-between w-full px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      <span className="line-clamp-1">{activity.title}</span>
                      <span className="shrink-0 ml-2">{activity.price} TND</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Back to destination */}
            {destination && (
              <Link
                href={`/${locale}/destinations/${destination.slug}`}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                {t("backToDestination", { city: destination.city })}
              </Link>
            )}
          </div>
        </div>
      </MaxWidthWrapper>
    </>
  );
}
