import Image from "next/image";
import Link from "next/link";
import { FiStar, FiMapPin, FiBookOpen } from "react-icons/fi";
import { FaCircleCheck } from "react-icons/fa6";

const SPEC_LABELS: Record<string, string> = {
  culture:         "Culture",
  food_drink:      "Food & Drink",
  adventures:      "Adventures",
  water_sports:    "Water Sports",
  nature_wildlife: "Nature",
  sightseeing:     "Sightseeing",
  shopping:        "Shopping",
  wellness:        "Wellness",
  family_friendly: "Family-friendly",
  workshops:       "Workshops",
};

type GuideCardProps = {
  slug:            string;
  displayName:     string;
  tagline?:        string | null;
  avatarUrl?:      string | null;
  coverUrl?:       string | null;
  specializations: string[];
  languages:       string[];
  note?:           string | null;
  nbReviews:       number;
  planCount:       number;
  planCountLabel?: string;
  isVerified:      boolean;
  destination?:    { city: string; slug: string } | null;
  locale:          string;
};

export function GuideCard({
  slug,
  displayName,
  tagline,
  avatarUrl,
  coverUrl,
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
      className="group bg-white border border-gray-100 rounded-2xl hover:shadow-md hover:border-gray-200 transition-all flex flex-col"
    >
      {/* Cover strip — overflow-hidden only here, not on the card wrapper */}
      <div className="relative h-24 bg-slate-100 rounded-t-2xl overflow-hidden shrink-0">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={displayName}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-slate-100" />
            <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id={`gc-dots-${slug}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.5" fill="#1e3a8a" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#gc-dots-${slug})`} />
            </svg>
          </>
        )}
      </div>

      {/* Avatar — outside cover div so it's not clipped by overflow-hidden */}
      <div className="-mt-6 pl-4 relative z-10">
        <div className="h-12 w-12 rounded-full ring-2 ring-white shadow-sm bg-white overflow-hidden">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={displayName} width={48} height={48} className="object-cover w-full h-full" />
          ) : (
            <div className="w-full h-full bg-primary/5 flex items-center justify-center">
              <span className="text-base font-bold text-primary select-none">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="pt-2 px-4 pb-4 flex flex-col gap-3 flex-1">

        {/* Name + verified + tagline */}
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-semibold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
              {displayName}
            </p>
            {isVerified && (
              <FaCircleCheck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            )}
          </div>
          {tagline && (
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 leading-relaxed">{tagline}</p>
          )}
          {destination && (
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
              <FiMapPin className="h-3 w-3 shrink-0" />
              <span>{destination.city}</span>
            </div>
          )}
        </div>

        {/* Specialization chips */}
        {specializations.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {specializations.slice(0, 3).map((s) => (
              <span
                key={s}
                className="px-2.5 py-0.5 bg-primary/8 text-primary text-[11px] font-medium rounded-full"
              >
                {SPEC_LABELS[s] ?? s.replace(/_/g, " ")}
              </span>
            ))}
            {specializations.length > 3 && (
              <span className="px-2.5 py-0.5 bg-gray-100 text-gray-400 text-[11px] rounded-full">
                +{specializations.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer stats */}
        <div className="flex items-center gap-3 text-xs text-gray-500 border-t border-gray-100 pt-3 mt-auto">
          {rating !== null ? (
            <div className="flex items-center gap-1">
              <FiStar className="h-3 w-3 text-amber-400 fill-amber-400" />
              <span className="font-semibold text-gray-700">{rating.toFixed(1)}</span>
              {nbReviews > 0 && <span className="text-gray-400">({nbReviews})</span>}
            </div>
          ) : null}
          <div className="flex items-center gap-1 text-gray-400">
            <FiBookOpen className="h-3 w-3" />
            <span>{planCountLabel ?? `${planCount} plan${planCount !== 1 ? "s" : ""}`}</span>
          </div>
          {languages.length > 0 && (
            <span className="ml-auto text-gray-400 truncate">{languages.slice(0, 2).join(" · ")}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
