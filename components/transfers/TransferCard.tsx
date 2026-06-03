import Link from "next/link";
import Image from "next/image";
import { TbRoute } from "react-icons/tb";
import { FiUsers, FiMapPin } from "react-icons/fi";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { BadgeList } from "@/components/badges/BadgeList";
import type { BadgeKey } from "@prisma/client";

type TransferType = "AIRPORT_TRANSFER" | "TAXI" | "CHAUFFEUR" | "SHUTTLE";

const TYPE_LABELS: Record<TransferType, string> = {
  AIRPORT_TRANSFER: "Airport Transfer",
  TAXI:             "City Taxi",
  CHAUFFEUR:        "Private Chauffeur",
  SHUTTLE:          "Shuttle",
};

interface Props {
  id:              string;
  slug:            string;
  title:           string;
  type:            TransferType;
  pricePerTrip?:   number | null;
  pricePerHour?:   number | null;
  pricePerPerson?: number | null;
  capacity:        number;
  city?:           string | null;
  country:         string;
  locale:          string;
  coverImage?:     string | null;
  initialIsWishlisted?: boolean;
  badges?:         BadgeKey[];
}

function getPriceLabel(
  type: TransferType,
  pricePerTrip?: number | null,
  pricePerHour?: number | null,
  pricePerPerson?: number | null
): string {
  switch (type) {
    case "CHAUFFEUR":
      return pricePerHour ? `${pricePerHour} TND/hr` : "Price on request";
    case "SHUTTLE":
      if (pricePerPerson) return `${pricePerPerson} TND/person`;
      return pricePerTrip ? `${pricePerTrip} TND/trip` : "Price on request";
    default:
      return pricePerTrip ? `${pricePerTrip} TND` : "Price on request";
  }
}

export function TransferCard({
  id, slug, title, type, pricePerTrip, pricePerHour, pricePerPerson,
  capacity, city, country, locale, coverImage, initialIsWishlisted, badges,
}: Props) {
  return (
    <Link
      href={`/${locale}/transport/transfers/${slug}`}
      className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col"
    >
      <div className="relative h-48 bg-gray-100">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <TbRoute className="h-16 w-16 text-gray-300" />
          </div>
        )}
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-700 px-2.5 py-1 rounded-full border border-gray-200">
          {TYPE_LABELS[type]}
        </span>
        <WishlistButton
          listingId={id}
          relationType="TRANSFER"
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

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
          <FiMapPin className="h-3.5 w-3.5 shrink-0" />
          <span>{city ? `${city}, ${country}` : country}</span>
        </div>
        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
          <FiUsers className="h-3.5 w-3.5 shrink-0" />
          <span>Up to {capacity} passenger{capacity !== 1 ? "s" : ""}</span>
        </div>
        <div className="mt-auto pt-3">
          <span className="text-base font-bold text-gray-900">
            {getPriceLabel(type, pricePerTrip, pricePerHour, pricePerPerson)}
          </span>
        </div>
      </div>
    </Link>
  );
}
