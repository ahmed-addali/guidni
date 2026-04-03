import Link from "next/link";
import Image from "next/image";
import { FiMapPin, FiClock, FiStar } from "react-icons/fi";
import { getCategoryLabel } from "@/lib/utils/activity-categories";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { BadgeList } from "@/components/badges/BadgeList";
import type { BadgeKey } from "@prisma/client";

type ActivityCardProps = {
  activity: {
    id: string;
    slug: string;
    title: string;
    arabicTitle?: string | null;
    category: string;
    price: number;
    region: string;
    city?: string | null;
    country: string;
    duration?: string | null;
    note?: string | null;
    images: { id: string; url: string }[];
    destination?: { slug: string; city: string; country: string } | null;
  };
  locale: string;
  initialIsWishlisted?: boolean;
  badges?: BadgeKey[];
};

export function ActivityCard({ activity, locale, initialIsWishlisted, badges }: ActivityCardProps) {
  const title =
    locale === "ar" && activity.arabicTitle
      ? activity.arabicTitle
      : activity.title;
  const imageUrl = activity.images[0]?.url ?? "/images/empty-cover-img.jpg";
  const location = [
    activity.destination?.city ?? activity.city,
    activity.country,
  ]
    .filter(Boolean)
    .join(", ");

  // Only show the first category in the badge
  const primaryCategory = activity.category.split(",")[0].trim();
  const categoryLabel = getCategoryLabel(primaryCategory, locale);

  return (
    <Link href={`/${locale}/activities/${activity.slug}`} className="block group">
      <div className="rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow h-full flex flex-col bg-white">
        {/* Image — flush to top edges, clipped by parent overflow-hidden */}
        <div className="relative h-44 w-full shrink-0">
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <span className="absolute top-2 left-2 bg-white/90 text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full">
            {categoryLabel}
          </span>
          <WishlistButton
            listingId={activity.id}
            relationType="ACTIVITY"
            initialIsWishlisted={initialIsWishlisted}
            className="absolute top-2 right-2"
          />
          {badges && badges.length > 0 && (
            <div className="absolute bottom-2 left-2">
              <BadgeList badges={badges} iconOnly />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-3.5 flex flex-col flex-1">
          <h3 className="font-semibold text-gray-800 line-clamp-1 text-sm leading-snug">
            {title}
          </h3>
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
            <FiMapPin className="h-3 w-3 shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </div>
          <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-gray-100 mt-3">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 leading-none mb-0.5">From</span>
              <span className="font-bold text-gray-900 text-sm leading-none">
                {activity.price} TND
                <span className="text-xs font-normal text-gray-400"> / person</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {activity.duration && (
                <div className="flex items-center gap-0.5">
                  <FiClock className="h-3 w-3" />
                  <span>{activity.duration}</span>
                </div>
              )}
              {activity.note && (
                <div className="flex items-center gap-0.5 text-gray-700">
                  <FiStar className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  <span>{activity.note}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
