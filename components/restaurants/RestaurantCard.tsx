import Link from "next/link";
import Image from "next/image";
import { FiMapPin, FiStar } from "react-icons/fi";
import { IoRestaurant } from "react-icons/io5";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import type { RestaurantListItem } from "@/lib/actions/restaurants";
import { BadgeList } from "@/components/badges/BadgeList";
import type { BadgeKey } from "@prisma/client";

const TYPE_LABELS: Record<string, string> = {
  RESTAURANT:  "Restaurant",
  CAFEE_SHOP:  "Café",
  BOTH:        "Restaurant & Café",
};

interface Props {
  restaurant: RestaurantListItem;
  locale: string;
  initialIsWishlisted?: boolean;
  badges?: BadgeKey[];
}

export function RestaurantCard({ restaurant, locale, initialIsWishlisted = false, badges }: Props) {
  const name = locale === "ar" && restaurant.arabicName
    ? restaurant.arabicName
    : restaurant.name;

  const imageUrl = restaurant.coverPhoto ?? restaurant.images[0]?.url ?? null;

  const location = [
    restaurant.destination?.city ?? restaurant.city,
    restaurant.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Link href={`/${locale}/restaurants/${restaurant.slug}`} className="block group">
      <div className="rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow h-full flex flex-col bg-white">
        {/* Image — flush to top edges, clipped by parent overflow-hidden */}
        <div className="relative h-44 w-full shrink-0 bg-gray-100">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <IoRestaurant className="h-10 w-10 text-gray-300" />
            </div>
          )}
          <span className="absolute top-2 left-2 bg-white/90 text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
            <IoRestaurant className="h-3 w-3" />
            {TYPE_LABELS[restaurant.type] ?? restaurant.type}
          </span>
          <div className="absolute top-2 right-2">
            <WishlistButton
              listingId={restaurant.id}
              relationType="RESTAURANT"
              initialIsWishlisted={initialIsWishlisted}
            />
          </div>
          {badges && badges.length > 0 && (
            <div className="absolute bottom-2 left-2">
              <BadgeList badges={badges} iconOnly />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-3.5 flex flex-col flex-1">
          <h3 className="font-semibold text-gray-800 line-clamp-1 text-sm leading-snug">{name}</h3>

          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
            <FiMapPin className="h-3 w-3 shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </div>

          {restaurant.category && (
            <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{restaurant.category}</p>
          )}

          <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-gray-100 mt-3">
            <span className="text-xs text-gray-500">
              {restaurant.reservationsEnabled ? "Reservations available" : "Walk-in only"}
            </span>
            {restaurant.note && parseFloat(restaurant.note) > 0 && (
              <div className="flex items-center gap-0.5 text-xs text-gray-700">
                <FiStar className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                <span>{parseFloat(restaurant.note).toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
