import { getTranslations, getLocale } from "next-intl/server";
import { getAttractionsByDestination } from "@/lib/actions/attractions";
import { FiMapPin } from "react-icons/fi";
import Link from "next/link";

const CATEGORY_COLORS: Record<string, string> = {
  beach: "from-cyan-400 to-blue-500",
  history: "from-amber-400 to-orange-500",
  culture: "from-purple-400 to-pink-500",
  nature: "from-green-400 to-teal-500",
  art: "from-rose-400 to-pink-500",
  religion: "from-indigo-400 to-purple-500",
};

const DEFAULT_COLOR = "from-primary to-blue-600";

export async function AttractionsSection({
  destinationSlug,
  locale,
}: {
  destinationSlug: string;
  locale: string;
}) {
  const [t, attractions] = await Promise.all([
    getTranslations("DestinationGuide"),
    getAttractionsByDestination(destinationSlug, locale),
  ]);

  if (attractions.length === 0) return null;

  return (
    <section id="attractions" className="scroll-mt-20 mb-16">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-orange-50 rounded-xl text-orange-500">
          <FiMapPin className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          {t("attractions")}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {attractions.map((item) => {
          const imageUrl = item.images[0]?.url;
          const translation = item.translations[0];
          const title = translation?.title ?? item.title;
          const description = translation?.description ?? item.description;
          const gradient =
            CATEGORY_COLORS[item.category.toLowerCase()] ?? DEFAULT_COLOR;

          return (
            <Link
              key={item.id}
              href={`/${locale}/destinations/${destinationSlug}/attractions/${item.slug}`}
              className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Image / gradient fallback */}
              <div className="relative h-44 overflow-hidden">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div
                    className={`w-full h-full bg-gradient-to-br ${gradient} group-hover:scale-105 transition-transform duration-300`}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white font-bold text-sm line-clamp-1">
                    {title}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <FiMapPin className="h-3 w-3 text-white/70" />
                    <p className="text-white/70 text-xs">{item.location}</p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-4">
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                  {description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
