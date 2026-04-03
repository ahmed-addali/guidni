import Link from "next/link";
import { FiMapPin } from "react-icons/fi";
import type { getRelatedAttractions } from "@/lib/actions/attractions";

type Attraction = Awaited<ReturnType<typeof getRelatedAttractions>>[number];

interface Props {
  attractions: Attraction[];
  destinationSlug: string;
  locale: string;
  title: string;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  beach: "from-cyan-400 to-blue-500",
  culture: "from-purple-400 to-pink-500",
  nature: "from-green-400 to-teal-500",
  religion: "from-indigo-400 to-purple-500",
  history: "from-amber-400 to-orange-500",
};

export function RelatedAttractions({ attractions, destinationSlug, locale, title }: Props) {
  if (attractions.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold text-gray-900 mb-5">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {attractions.map((item) => {
          const imageUrl = item.images[0]?.url;
          const gradient = CATEGORY_GRADIENTS[item.category?.toLowerCase() ?? ""] ?? "from-primary to-blue-600";

          return (
            <Link
              key={item.id}
              href={`/${locale}/destinations/${destinationSlug}/attractions/${item.slug}`}
              className="group block bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative h-32 overflow-hidden">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${gradient}`} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm text-gray-900 line-clamp-1">{item.title}</p>
                <div className="flex items-center gap-1 mt-1">
                  <FiMapPin className="h-3 w-3 text-gray-400 shrink-0" />
                  <p className="text-xs text-gray-500 line-clamp-1">{item.location}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
