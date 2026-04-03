import Image from "next/image";
import Link from "next/link";
import { FiMapPin, FiStar } from "react-icons/fi";
import { IoBedOutline } from "react-icons/io5";
import { MdPeople } from "react-icons/md";
import { getCategoryLabel } from "@/lib/utils/stay-categories";
import type { StayListItem } from "@/types/stay";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { BadgeList } from "@/components/badges/BadgeList";
import type { BadgeKey } from "@prisma/client";

interface StayCardProps {
  stay: StayListItem;
  locale: string;
  initialIsWishlisted?: boolean;
  badges?: BadgeKey[];
}

export function StayCard({ stay, locale, initialIsWishlisted, badges }: StayCardProps) {
  const loc = (locale as "en" | "fr" | "ar") ?? "en";
  const title = loc === "ar" && stay.arabicTitle ? stay.arabicTitle : stay.title;
  const coverImage = stay.images[0]?.url ?? null;
  const location = [stay.city, stay.country].filter(Boolean).join(", ");
  const primaryCategory = stay.category.split(",")[0].trim();
  const categoryLabel = getCategoryLabel(primaryCategory, loc);

  return (
    <Link
      href={`/${locale}/stays/${stay.slug}`}
      className="group block border border-gray-100 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <IoBedOutline className="h-12 w-12 text-gray-300" />
          </div>
        )}
        {/* Category badge */}
        <span className="absolute top-3 left-3 bg-white/90 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full border border-gray-200">
          {categoryLabel}
        </span>
        {/* Wishlist button */}
        <WishlistButton
          listingId={stay.id}
          relationType="STAY"
          initialIsWishlisted={initialIsWishlisted}
          className="absolute top-3 right-3"
        />
        {/* Badge icons overlay — bottom-left */}
        {badges && badges.length > 0 && (
          <div className="absolute bottom-2 left-2">
            <BadgeList badges={badges} iconOnly />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-gray-900 line-clamp-1 text-sm">{title}</h3>

        {location && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <FiMapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{location}</span>
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <MdPeople className="h-3.5 w-3.5" />
            {stay.guestCount}
          </span>
          <span className="flex items-center gap-1">
            <IoBedOutline className="h-3.5 w-3.5" />
            {stay.bedroomCount}
          </span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="font-bold text-gray-900">{stay.price} TND</span>
            <span className="text-xs text-gray-400 ml-1">/night</span>
          </div>
          {stay.averageRating && stay.averageRating > 0 ? (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <FiStar className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
              <span>{stay.averageRating.toFixed(1)}</span>
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
