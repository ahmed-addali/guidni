import Link from "next/link";
import Image from "next/image";
import { FiStar } from "react-icons/fi";
import { FaBoxOpen } from "react-icons/fa6";
import { WishlistButton } from "@/components/wishlist/WishlistButton";

interface Props {
  id:           string;
  slug:         string;
  shopSlug:     string;
  name:         string;
  shopName:     string;
  price:        number;
  comparePrice?: number | null;
  isHandmade:   boolean;
  imageUrl?:    string | null;
  locale:       string;
  handmadeLabel?: string;
}

export function ProductCard({
  id, slug, shopSlug, name, shopName, price, comparePrice,
  isHandmade, imageUrl, locale, handmadeLabel = "Handmade",
}: Props) {
  const discount =
    comparePrice && comparePrice > price
      ? Math.round(((comparePrice - price) / comparePrice) * 100)
      : null;

  return (
    <Link
      href={`/${locale}/shops/${shopSlug}/products/${slug}`}
      className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FaBoxOpen className="h-12 w-12 text-gray-200" />
          </div>
        )}

        {/* Badges overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
          {isHandmade && (
            <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium px-2 py-0.5 rounded-full">
              {handmadeLabel}
            </span>
          )}
          {discount !== null && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              -{discount}%
            </span>
          )}
        </div>

        {/* Wishlist */}
        <div className="absolute top-2.5 right-2.5">
          <WishlistButton listingId={id} relationType="PRODUCT" locale={locale} size="sm" />
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-0.5 flex-1">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {name}
        </h3>
        <p className="text-xs text-gray-400 line-clamp-1">by {shopName}</p>

        <div className="mt-auto pt-2 flex items-baseline gap-1.5">
          <span className="text-sm font-bold text-gray-900">{price} TND</span>
          {comparePrice && comparePrice > price && (
            <span className="text-xs text-gray-400 line-through">{comparePrice} TND</span>
          )}
        </div>
      </div>
    </Link>
  );
}
