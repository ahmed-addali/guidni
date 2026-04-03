"use server";

import { cache } from "react";
import { prisma } from "@/lib/db";
import type { RelationType, BadgeKey } from "@prisma/client";

export type BadgeKeyValue = BadgeKey;

export const getManualBadges = cache(
  async (relationId: string, relationType: RelationType): Promise<BadgeKey[]> => {
    const badges = await prisma.listingBadge.findMany({
      where: { relationId, relationType },
      select: { badgeKey: true },
    });
    return badges.map((b) => b.badgeKey);
  }
);

/** Bulk fetch for listing pages — returns a map of `id → BadgeKey[]` */
export async function getBadgesForListings(
  ids: string[],
  relationType: RelationType
): Promise<Record<string, BadgeKey[]>> {
  if (ids.length === 0) return {};
  const rows = await prisma.listingBadge.findMany({
    where: { relationType, relationId: { in: ids } },
    select: { relationId: true, badgeKey: true },
  });
  const map: Record<string, BadgeKey[]> = {};
  for (const row of rows) {
    (map[row.relationId] ??= []).push(row.badgeKey);
  }
  return map;
}

export const getGuidniReview = cache(
  async (relationId: string, relationType: RelationType) => {
    return prisma.guidniReview.findFirst({
      where: { relationId, relationType, status: "PUBLISHED" },
      include: { images: { select: { id: true, url: true, alt: true } } },
    });
  }
);
