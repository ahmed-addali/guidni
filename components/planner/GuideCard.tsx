import Image from "next/image";
import Link from "next/link";
import { FiStar, FiMapPin, FiBookOpen } from "react-icons/fi";
import { FaCheckCircle } from "react-icons/fa";

type GuideCardProps = {
  slug: string;
  displayName: string;
  tagline?: string | null;
  avatarUrl?: string | null;
  specializations: string[];
  languages: string[];
  note?: string | null;
  nbReviews: number;
  planCount: number;
  planCountLabel?: string;
  isVerified: boolean;
  destination?: { city: string; slug: string } | null;
  locale: string;
};

export function GuideCard({
  slug,
  displayName,
  tagline,
  avatarUrl,
  specializations,
  languages,
  note,
  nbReviews,
  planCount,
  planCountLabel,
  isVerified,
  destination,
  locale,
}: GuideCardProps) {
  const rating = note ? parseFloat(note) : null;

  return (
    <Link
      href={`/${locale}/planner/guides/${slug}`}
      className="group bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow flex flex-col gap-4"
    >
      {/* Avatar + name */}
      <div className="flex items-start gap-4">
        <div className="relative h-14 w-14 rounded-full overflow-hidden bg-gray-100 shrink-0">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={displayName} fill className="object-cover" sizes="56px" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-gray-400 text-xl font-bold">
              {displayName.charAt(0)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{displayName}</p>
            {isVerified && <FaCheckCircle className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
          </div>
          {tagline && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{tagline}</p>}
          {destination && (
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
              <FiMapPin className="h-3 w-3 shrink-0" />
              <span>{destination.city}</span>
            </div>
          )}
        </div>
      </div>

      {/* Specializations */}
      {specializations.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {specializations.slice(0, 3).map((s) => (
            <span key={s} className="px-2 py-0.5 bg-primary/8 text-primary text-xs rounded-full font-medium capitalize">
              {s.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-500 border-t border-gray-100 pt-3">
        {rating !== null && (
          <div className="flex items-center gap-1">
            <FiStar className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
            <span className="font-medium text-gray-700">{rating.toFixed(1)}</span>
            {nbReviews > 0 && <span className="text-gray-400">({nbReviews})</span>}
          </div>
        )}
        <div className="flex items-center gap-1">
          <FiBookOpen className="h-3.5 w-3.5 text-gray-400" />
          <span>{planCountLabel ?? `${planCount} plan${planCount !== 1 ? "s" : ""}`}</span>
        </div>
        {languages.length > 0 && (
          <span className="ml-auto text-xs text-gray-400">{languages.slice(0, 2).join(" · ")}</span>
        )}
      </div>
    </Link>
  );
}
