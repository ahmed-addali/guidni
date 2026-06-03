import type { BadgeKey } from "@prisma/client";
import { BadgeChip } from "./BadgeChip";

const CARD_HIDDEN: BadgeKey[] = ["OWNER_OPERATED"];

interface Props {
  badges: BadgeKey[];
  size?: "sm" | "md";
  detailPage?: boolean;
  iconOnly?: boolean;
}

export function BadgeList({ badges, size = "md", detailPage = false, iconOnly = false }: Props) {
  const filtered = detailPage ? badges : badges.filter((k) => !CARD_HIDDEN.includes(k));
  if (filtered.length === 0) return null;
  const visible = filtered.slice(0, 3);
  return (
    <div className={iconOnly ? "flex gap-1" : "flex flex-wrap gap-2"}>
      {visible.map((key) => (
        <BadgeChip key={key} badgeKey={key} size={size} iconOnly={iconOnly} />
      ))}
    </div>
  );
}
