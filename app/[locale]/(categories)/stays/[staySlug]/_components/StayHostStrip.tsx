import { BadgeCheck } from "lucide-react";

type Props = {
  hostName: string;
  hostLanguages?: string | null;
  profileImage?: string | null;
  isVerified: boolean;
  memberSince: string;
  labels: {
    hostedBy: string;
    speaks: string;
    memberSince: string;
  };
};

export function StayHostStrip({
  hostName,
  hostLanguages,
  profileImage,
  isVerified,
  memberSince,
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
      </div>
    </div>
  );
}
