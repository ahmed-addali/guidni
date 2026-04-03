import Image from "next/image";
import { FiMapPin, FiStar } from "react-icons/fi";
import { FaStore } from "react-icons/fa6";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { ShareButton } from "@/app/[locale]/(categories)/stays/[staySlug]/_components/ShareButton";

interface Props {
  id:            string;
  name:          string;
  categoryLabel: string;
  city?:         string | null;
  country:       string;
  note?:         string | null;
  nbReviews:     number;
  isOpen:        boolean;
  coverPhoto?:   string | null;
  logo?:         string | null;
  locale:        string;
  openLabel:     string;
  closedLabel:   string;
  shareLabel:    string;
  copiedLabel:   string;
}

export function ShopHero({
  id, name, categoryLabel, city, country, note, nbReviews, isOpen,
  coverPhoto, logo, locale, openLabel, closedLabel, shareLabel, copiedLabel,
}: Props) {
  const rating = note ? parseFloat(note) : null;

  return (
    <div className="relative h-72 sm:h-[440px] rounded-2xl overflow-hidden bg-gray-100">
      {/* Cover */}
      {coverPhoto ? (
        <Image
          src={coverPhoto}
          alt={name}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 1280px) 100vw, 1280px"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <FaStore className="h-20 w-20 text-gray-200" />
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

      {/* Action buttons — top right */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ShareButton
          title={name}
          shareLabel={shareLabel}
          copiedLabel={copiedLabel}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white transition-all"
        />
        <WishlistButton listingId={id} relationType="SHOP" locale={locale} />
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 flex items-end gap-4">
        {/* Logo */}
        {logo && (
          <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-white/80 shrink-0 mb-0.5">
            <Image src={logo} alt={name} fill className="object-cover" sizes="64px" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-0.5 rounded-full border border-white/30">
              {categoryLabel}
            </span>
            <span
              className={`text-xs font-medium px-2.5 py-0.5 rounded-full backdrop-blur-sm ${
                isOpen
                  ? "bg-green-500/25 text-green-200 border border-green-400/40"
                  : "bg-red-500/25 text-red-200 border border-red-400/40"
              }`}
            >
              {isOpen ? openLabel : closedLabel}
            </span>
          </div>

          {/* Name */}
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight truncate">
            {name}
          </h1>

          {/* Location + rating */}
          <div className="flex items-center gap-4 mt-1.5 text-white/80 text-sm flex-wrap">
            <span className="flex items-center gap-1">
              <FiMapPin className="h-3.5 w-3.5 shrink-0" />
              {city ? `${city}, ${country}` : country}
            </span>
            {rating !== null && nbReviews > 0 && (
              <span className="flex items-center gap-1">
                <FiStar className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                <span className="font-semibold text-white">{rating.toFixed(1)}</span>
                <span>({nbReviews})</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
