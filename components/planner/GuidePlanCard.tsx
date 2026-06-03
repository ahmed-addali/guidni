import Link from "next/link";
import Image from "next/image";
import { FiStar, FiClock } from "react-icons/fi";
import { FaCircleCheck } from "react-icons/fa6";
import { Lock } from "lucide-react";

const DIFFICULTY_COLORS: Record<string, string> = {
  easy:     "bg-green-50 text-green-700",
  moderate: "bg-amber-50 text-amber-700",
  active:   "bg-red-50 text-red-600",
};

type Plan = {
  id: string;
  title: string | null;
  duration: number;
  planType: string;
  price: number | null;
  purchaseCount: number;
  viewCount: number;
  summary: string | null;
  tags: string[];
  difficulty: string | null;
  suitableFor: string[];
  destination: { city: string; slug: string } | null;
  guide: {
    slug: string;
    displayName: string;
    avatarUrl?: string | null;
    coverUrl?: string | null;
    isVerified: boolean;
  } | null;
};

type Rating = { avg: number; count: number } | undefined;

type Props = {
  plan: Plan;
  locale: string;
  rating?: Rating;
};

export function GuidePlanCard({ plan, locale, rating }: Props) {
  const isFree = plan.planType === "GUIDE_FREE";
  const coverUrl = plan.guide?.coverUrl ?? null;
  const guideSlug = plan.guide?.slug ?? "";

  return (
    <Link
      href={`/${locale}/planner/${plan.id}`}
      className="group flex flex-col bg-white border border-gray-100 rounded-2xl hover:shadow-md hover:border-gray-200 transition-all"
    >
      {/* Cover strip */}
      <div className="relative h-32 bg-slate-100 rounded-t-2xl overflow-hidden shrink-0">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={plan.title ?? "Plan cover"}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-slate-100" />
            <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id={`gpc-dots-${plan.id}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.5" fill="#1e3a8a" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#gpc-dots-${plan.id})`} />
            </svg>
          </>
        )}

        {/* Dim overlay so badges are always readable */}
        {coverUrl && <div className="absolute inset-0 bg-black/20" />}

        {/* Duration badge — top left */}
        <div className="absolute top-2.5 left-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm text-gray-700 text-[11px] font-semibold rounded-full px-2.5 py-1">
          <FiClock className="h-3 w-3" />
          {plan.duration} {plan.duration === 1 ? "day" : "days"}
        </div>

        {/* Price badge — top right */}
        {isFree ? (
          <span className="absolute top-2.5 right-3 text-[11px] font-bold px-2.5 py-1 rounded-full bg-green-500 text-white">
            Free
          </span>
        ) : (
          <span className="absolute top-2.5 right-3 flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary text-white">
            <Lock className="h-2.5 w-2.5" />
            TND {plan.price}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-4 pt-3 pb-3 flex flex-col gap-2 flex-1">
        {/* Destination + difficulty */}
        <div className="flex items-center gap-2 flex-wrap">
          {plan.destination && (
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
              {plan.destination.city}
            </span>
          )}
          {plan.difficulty && (
            <>
              {plan.destination && <span className="text-gray-200 text-[11px]">·</span>}
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${DIFFICULTY_COLORS[plan.difficulty] ?? "bg-gray-100 text-gray-500"}`}>
                {plan.difficulty}
              </span>
            </>
          )}
        </div>

        {/* Title + summary */}
        <div>
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
            {plan.title ?? `${plan.duration}-Day ${plan.destination?.city ?? ""} Plan`}
          </h3>
          {plan.summary && (
            <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mt-1">
              {plan.summary}
            </p>
          )}
        </div>

        {/* Tags */}
        {plan.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {plan.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full capitalize"
              >
                {tag}
              </span>
            ))}
            {plan.tags.length > 3 && (
              <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full">
                +{plan.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer: guide + rating + stats */}
      <div className="border-t border-gray-100 px-4 py-2.5 flex items-center justify-between gap-3 mt-auto">
        {/* Guide strip */}
        {plan.guide && (
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="relative h-6 w-6 rounded-full overflow-hidden bg-gray-100 shrink-0">
              {plan.guide.avatarUrl ? (
                <Image
                  src={plan.guide.avatarUrl}
                  alt={plan.guide.displayName}
                  fill
                  className="object-cover"
                  sizes="24px"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-gray-400">
                  {plan.guide.displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span className="text-xs text-gray-600 truncate">{plan.guide.displayName}</span>
            {plan.guide.isVerified && (
              <FaCircleCheck className="h-3 w-3 text-blue-600 shrink-0" />
            )}
          </div>
        )}

        {/* Rating + purchases */}
        <div className="flex items-center gap-2.5 shrink-0 ml-auto">
          {rating && rating.count > 0 && (
            <div className="flex items-center gap-1">
              <FiStar className="h-3 w-3 text-amber-400 fill-amber-400" />
              <span className="text-xs font-semibold text-gray-700">{rating.avg.toFixed(1)}</span>
              <span className="text-xs text-gray-400">({rating.count})</span>
            </div>
          )}
          {plan.purchaseCount > 0 && (
            <span className="text-xs text-gray-400">
              {plan.purchaseCount} {plan.purchaseCount === 1 ? "trip" : "trips"}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
