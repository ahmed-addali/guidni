import Link from "next/link";
import Image from "next/image";
import { TbCar } from "react-icons/tb";
import { FiUsers, FiMapPin } from "react-icons/fi";
import { WishlistButton } from "@/components/wishlist/WishlistButton";

type RentalType = "CAR" | "BIKE" | "SCOOTER" | "BOAT" | "OTHER";

const TYPE_LABELS: Record<RentalType, string> = {
  CAR:     "Car",
  BIKE:    "Bike",
  SCOOTER: "Scooter",
  BOAT:    "Boat",
  OTHER:   "Vehicle",
};

interface Props {
  id:                   string;
  slug:                 string;
  title:                string;
  type:                 RentalType;
  pricePerDay:          number;
  capacity:             number;
  brand?:               string | null;
  model?:               string | null;
  city?:                string | null;
  country:              string;
  locale:               string;
  coverImage?:          string | null;
  initialIsWishlisted?: boolean;
}

export function RentalCard({
  id, slug, title, type, pricePerDay, capacity, brand, model,
  city, country, locale, coverImage, initialIsWishlisted,
}: Props) {
  return (
    <Link
      href={`/${locale}/transport/rentals/${slug}`}
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
            <TbCar className="h-16 w-16 text-gray-300" />
          </div>
        )}
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-700 px-2.5 py-1 rounded-full border border-gray-200">
          {TYPE_LABELS[type]}
        </span>
        <WishlistButton
          listingId={id}
          relationType="RENTAL"
          initialIsWishlisted={initialIsWishlisted}
          className="absolute top-3 right-3"
        />
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        {(brand || model) && (
          <p className="text-xs text-gray-400 mt-0.5">{[brand, model].filter(Boolean).join(" · ")}</p>
        )}
        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
          <FiMapPin className="h-3.5 w-3.5 shrink-0" />
          <span>{city ? `${city}, ${country}` : country}</span>
        </div>
        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
          <FiUsers className="h-3.5 w-3.5 shrink-0" />
          <span>{capacity} {capacity === 1 ? "seat" : "seats"}</span>
        </div>
        <div className="mt-auto pt-3 flex items-baseline gap-1">
          <span className="text-base font-bold text-gray-900">{pricePerDay} TND</span>
          <span className="text-xs text-gray-400">/day</span>
        </div>
      </div>
    </Link>
  );
}
