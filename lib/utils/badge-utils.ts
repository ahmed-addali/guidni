import type { BadgeKey } from "@prisma/client";

export function getAutoBadges({
  note,
  nbReviews,
}: {
  note: string | null | undefined;
  nbReviews: number;
}): BadgeKey[] {
  const auto: BadgeKey[] = [];
  const rating = note ? parseFloat(note) : 0;
  if (rating >= 4.7 && nbReviews >= 25) {
    auto.push("GUEST_FAVORITE");
  }
  return auto;
}
