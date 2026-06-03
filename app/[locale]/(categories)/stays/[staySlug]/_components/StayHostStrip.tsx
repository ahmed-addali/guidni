import { BadgeCheck, Zap, Clock } from "lucide-react";

type Props = {
  hostName: string;
  hostLanguages?: string | null;
  profileImage?: string | null;
  isVerified: boolean;
  memberSince: string;
  responseTime?: "quickly" | "within_day" | null;
  labels: {
    hostedBy: string;
    speaks: string;
    memberSince: string;
    respondsQuickly?: string;
    respondsWithinDay?: string;
  };
};

export function StayHostStrip({
  hostName,
  hostLanguages,
  profileImage,
  isVerified,
  memberSince,
  responseTime,
  labels,
}: Props) {
  const initials = hostName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const langs = hostLanguages
    ? hostLanguages.split(",").map((l) => l.trim()).join(", ")
    : null;

  return (
    <div className="flex items-start gap-4">
      {/* Avatar */}
      {profileImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profileImage}
          alt={hostName}
          className="h-12 w-12 rounded-full object-cover shrink-0"
        />
      ) : (
        <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-base shrink-0">
          {initials || "?"}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-gray-900 text-base leading-tight">
            {labels.hostedBy}
          </p>
          {isVerified && (
            <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{labels.memberSince} {memberSince}</p>
        {langs && (
          <p className="text-xs text-gray-400 mt-1">
            {labels.speaks}: {langs}
          </p>
        )}
        {responseTime === "quickly" && labels.respondsQuickly && (
          <div className="flex items-center gap-1 mt-1.5">
            <Zap className="h-3 w-3 text-green-500 shrink-0" />
            <span className="text-xs text-green-600 font-medium">{labels.respondsQuickly}</span>
          </div>
        )}
        {responseTime === "within_day" && labels.respondsWithinDay && (
          <div className="flex items-center gap-1 mt-1.5">
            <Clock className="h-3 w-3 text-blue-500 shrink-0" />
            <span className="text-xs text-blue-600 font-medium">{labels.respondsWithinDay}</span>
          </div>
        )}
      </div>
    </div>
  );
}
