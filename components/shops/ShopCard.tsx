import Link from "next/link";
import Image from "next/image";
import { FiMapPin, FiStar } from "react-icons/fi";
import { FaStore } from "react-icons/fa6";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { BadgeList } from "@/components/badges/BadgeList";
import type { BadgeKey } from "@prisma/client";

type DeliveryMethod = "PICKUP" | "LOCAL_DELIVERY" | "NATIONWIDE" | "INTERNATIONAL";

const DELIVERY_LABELS: Record<DeliveryMethod, string> = {
  PICKUP:         "Pickup",
  LOCAL_DELIVERY: "Local delivery",
  NATIONWIDE:     "Nationwide",
  INTERNATIONAL:  "International",
};

interface Props {
  id:              string;
  slug:            string;
  name:            string;
  arabicName?:     string | null;
  category:        string;
  categoryLabel:   string;
  city?:           string | null;
  country:         string;
  note?:           string | null;
  nbReviews:       number;
  coverPhoto?:     string | null;
  logo?:           string | null;
  deliveryMethods: DeliveryMethod[];
  productImages:   string[];
  locale:          string;
  badges?:         BadgeKey[];
}

export function ShopCard({
  id, slug, name, arabicName, categoryLabel, city, country,
  note, nbReviews, coverPhoto, logo, deliveryMethods, productImages, locale, badges,
}: Props) {
  const rating     = note ? parseFloat(note) : null;
  const displayMethods = deliveryMethods.slice(0, 2);

  return (
    <Link
      href={`/${locale}/shops/${slug}`}
      className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col"
    >
      {/* Cover */}
      <div className="relative h-44 bg-gray-100">
        {coverPhoto ? (
          <Image
            src={coverPhoto}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FaStore className="h-14 w-14 text-gray-200" />
          </div>
        )}
        {/* Wishlist */}
        <div className="absolute top-3 right-3">
          <WishlistButton listingId={id} relationType="SHOP" locale={locale} size="sm" />
        </div>
        {/* Badge icons overlay — bottom-left */}
        {badges && badges.length > 0 && (
          <div className="absolute bottom-2 left-2">
            <BadgeList badges={badges} iconOnly />
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 gap-1.5">
        {/* Logo + category */}
        <div className="flex items-center gap-2">
          {logo ? (
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-100 shrink-0">
              <Image src={logo} alt={name} fill className="object-cover" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <FaStore className="h-4 w-4 text-primary" />
            </div>
          )}
          <span className="text-xs font-medium text-primary bg-primary/8 px-2 py-0.5 rounded-full">
            {categoryLabel}
          </span>
        </div>

        {/* Name */}
        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1 group-hover:text-primary transition-colors">
          {name}
        </h3>

        {/* Location + rating */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <FiMapPin className="h-3.5 w-3.5 shrink-0" />
            {city ? `${city}, ${country}` : country}
          </span>
          {rating !== null && nbReviews > 0 && (
            <span className="flex items-center gap-0.5">
              <FiStar className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              <span className="font-medium text-gray-700">{rating.toFixed(1)}</span>
              <span className="text-gray-400">({nbReviews})</span>
            </span>
          )}
        </div>

        {/* Delivery */}
        {displayMethods.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {displayMethods.map((m) => (
              <span
                key={m}
                className="text-xs text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full"
              >
                {DELIVERY_LABELS[m]}
              </span>
            ))}
            {deliveryMethods.length > 2 && (
              <span className="text-xs text-gray-400 px-1">+{deliveryMethods.length - 2}</span>
            )}
          </div>
        )}

        {/* Product preview images */}
        {productImages.length > 0 && (
          <div className="flex gap-1 mt-1">
            {productImages.slice(0, 3).map((url, i) => (
              <div key={i} className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                <Image src={url} alt="" fill className="object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
