import { type AgentTier } from "@prisma/client";

interface Props {
  tier: AgentTier;
  size?: "sm" | "md";
}

const TIER_CONFIG: Record<AgentTier, { label: string; className: string; icon: string }> = {
  STARTER: { label: "Starter", className: "bg-gray-100 text-gray-600 border-gray-200",     icon: "✦" },
  PRO:     { label: "Pro",     className: "bg-blue-50  text-blue-700  border-blue-100",     icon: "★" },
  ELITE:   { label: "Elite",   className: "bg-amber-50 text-amber-700 border-amber-200",    icon: "◆" },
};

export function AgentTierBadge({ tier, size = "md" }: Props) {
  const cfg = TIER_CONFIG[tier] ?? TIER_CONFIG.STARTER;
  const sizeClass = size === "sm"
    ? "text-[10px] px-1.5 py-0.5 gap-0.5"
    : "text-xs px-2 py-0.5 gap-1";

  return (
    <span className={`inline-flex items-center font-semibold rounded-full border ${cfg.className} ${sizeClass}`}>
      <span>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}
