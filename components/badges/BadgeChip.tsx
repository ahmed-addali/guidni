import { ShieldCheck, Star, BookOpen, UserCheck } from "lucide-react";
import type { BadgeKey } from "@prisma/client";

const BADGE_CONFIG: Record<
  BadgeKey,
  {
    label: string;
    icon: React.ElementType;
    className: string;
    iconOnlyClassName: string;
  }
> = {
  VERIFIED: {
    label: "Verified",
    icon: ShieldCheck,
    className: "bg-blue-50 text-blue-700 border-blue-200",
    iconOnlyClassName: "bg-blue-600 text-white",
  },
  GUEST_FAVORITE: {
    label: "Guest Favorite",
    icon: Star,
    className: "bg-amber-50 text-amber-700 border-amber-200",
    iconOnlyClassName: "bg-amber-500 text-white",
  },
  REVIEWED_BY_GUIDNI: {
    label: "Reviewed by Guidni",
    icon: BookOpen,
    className: "bg-primary/5 text-primary border-primary/20",
    iconOnlyClassName: "bg-primary text-white",
  },
  OWNER_OPERATED: {
    label: "Owner-Operated",
    icon: UserCheck,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    iconOnlyClassName: "bg-emerald-600 text-white",
  },
};

interface Props {
  badgeKey: BadgeKey;
  size?: "sm" | "md";
  iconOnly?: boolean;
}

export function BadgeChip({ badgeKey, size = "md", iconOnly = false }: Props) {
  const config = BADGE_CONFIG[badgeKey];
  if (!config) return null;
  const Icon = config.icon;

  if (iconOnly) {
    return (
      <span
        title={config.label}
        className={`inline-flex items-center justify-center rounded-full ${config.iconOnlyClassName} h-6 w-6`}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 border rounded-full font-medium ${config.className} ${
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      }`}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {config.label}
    </span>
  );
}
