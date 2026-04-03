import Link from "next/link";
import { Compass } from "lucide-react";
import type { getAttractionBySlug } from "@/lib/actions/attractions";

type Activity = NonNullable<Awaited<ReturnType<typeof getAttractionBySlug>>>["activities"][number];

interface Props {
  activities: Activity[];
  locale: string;
  title: string;
}

const ACTIVITY_GRADIENTS: Record<string, string> = {
  adventure: "from-orange-400 to-red-500",
  culture: "from-purple-400 to-pink-500",
  water: "from-cyan-400 to-blue-500",
  nature: "from-green-400 to-teal-500",
  food: "from-yellow-400 to-amber-500",
};

export function RelatedActivities({ activities, locale, title }: Props) {
  if (activities.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-blue-50 rounded-xl text-blue-500">
          <Compass className="h-4 w-4" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {activities.map((activity) => {
          const imageUrl = activity.images[0]?.url;
          const gradient = ACTIVITY_GRADIENTS[activity.category?.toLowerCase() ?? ""] ?? "from-primary to-blue-600";

          return (
            <Link
              key={activity.id}
              href={`/${locale}/activities/${activity.slug}`}
              className="group flex gap-3 bg-white border border-gray-100 rounded-xl p-3 hover:shadow-md transition-shadow"
            >
              <div className="relative h-20 w-24 shrink-0 rounded-lg overflow-hidden">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={activity.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${gradient}`} />
                )}
              </div>
              <div className="flex-1 min-w-0 py-1">
                <p className="font-medium text-gray-900 text-sm line-clamp-2 leading-snug">
                  {activity.title}
                </p>
                {activity.duration && (
                  <p className="text-xs text-gray-500 mt-1">{activity.duration}</p>
                )}
                <p className="text-sm font-semibold text-primary mt-1">
                  {activity.price} TND
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
