import Image from "next/image";
import Link from "next/link";
import { MapPin, Clock, Users, Calendar } from "lucide-react";
import { format } from "date-fns";
import { FaCheckCircle } from "react-icons/fa";
import type { UserPreferences } from "@/lib/planner/types";

const GROUP_LABELS: Record<string, string> = {
  solo:    "Solo",
  couple:  "Couple",
  family:  "Family",
  friends: "Friends",
};

type PlanSummary = {
  id: string;
  title: string | null;
  duration: number;
  isPublic: boolean;
  createdAt: Date;
  preferences: unknown;
  destination: { city: string; slug: string; country: string } | null;
  guide?: {
    slug: string;
    displayName: string;
    avatarUrl?: string | null;
    isVerified: boolean;
  } | null;
};

type Props = {
  plan: PlanSummary;
  locale: string;
};

export function PlanCard({ plan, locale }: Props) {
  const prefs = plan.preferences as UserPreferences | null;
  const city = plan.destination?.city ?? prefs?.destinationCity ?? "Unknown";
  const dateLabel = format(new Date(plan.createdAt), "MMM d, yyyy");

  return (
    <Link
      href={`/${locale}/planner/${plan.id}`}
      className="flex-shrink-0 w-56 bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-shadow block"
    >
      {/* Destination */}
      <div className="flex items-center gap-1.5 mb-2">
        <MapPin className="h-3.5 w-3.5 text-blue-600 shrink-0" />
        <span className="text-xs font-semibold text-blue-600 truncate">{city}</span>
      </div>

      {/* Title */}
      <p className="text-sm font-semibold text-gray-900 truncate mb-3 leading-snug">
        {plan.title ?? `${plan.duration}-Day Trip`}
      </p>

      {/* Meta */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Clock className="h-3 w-3 shrink-0" />
          <span>{plan.duration} day{plan.duration !== 1 ? "s" : ""}</span>
        </div>
        {prefs?.groupType && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Users className="h-3 w-3 shrink-0" />
            <span>{GROUP_LABELS[prefs.groupType] ?? prefs.groupType}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Calendar className="h-3 w-3 shrink-0" />
          <span>{dateLabel}</span>
        </div>
      </div>

      {/* Public badge (only when no guide attribution) */}
      {plan.isPublic && !plan.guide && (
        <span className="mt-3 inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100">
          Public
        </span>
      )}

      {/* Guide attribution strip */}
      {plan.guide && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
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
              <span className="h-full w-full flex items-center justify-center text-[10px] font-bold text-gray-500">
                {plan.guide.displayName.charAt(0)}
              </span>
            )}
          </div>
          <span className="text-[11px] text-gray-500 truncate">
            by <span className="font-medium text-gray-700">{plan.guide.displayName}</span>
          </span>
          {plan.guide.isVerified && (
            <FaCheckCircle className="h-3 w-3 text-blue-600 shrink-0 ml-auto" />
          )}
        </div>
      )}
    </Link>
  );
}
