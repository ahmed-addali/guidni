"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { RelationType, BadgeKey, GuidniReviewStatus } from "@prisma/client";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "ADMIN")
    return { ok: false as const, error: "Unauthorized" };
  return { ok: true as const, userId: session.user.id };
}

export async function assignBadge(
  relationId: string,
  relationType: RelationType,
  badgeKey: BadgeKey,
  note?: string
) {
  const a = await requireAdmin();
  if (!a.ok) return { success: false as const, error: a.error };

  await prisma.listingBadge.upsert({
    where: { badgeKey_relationType_relationId: { badgeKey, relationType, relationId } },
    update: { assignedBy: a.userId, note: note ?? null },
    create: { badgeKey, relationType, relationId, assignedBy: a.userId, note: note ?? null },
  });
  return { success: true as const };
}

export async function removeBadge(
  relationId: string,
  relationType: RelationType,
  badgeKey: BadgeKey
) {
  const a = await requireAdmin();
  if (!a.ok) return { success: false as const, error: a.error };

  await prisma.listingBadge.deleteMany({ where: { badgeKey, relationType, relationId } });
  return { success: true as const };
}

export async function getAllGuidniReviews() {
  const a = await requireAdmin();
  if (!a.ok) return [];
  return prisma.guidniReview.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getGuidniReviewById(reviewId: string) {
  const a = await requireAdmin();
  if (!a.ok) return null;
  return prisma.guidniReview.findUnique({
    where: { id: reviewId },
    include: { images: { select: { id: true, url: true, alt: true } } },
  });
}

export async function addGuidniReviewImage(reviewId: string, url: string) {
  const a = await requireAdmin();
  if (!a.ok) return { success: false as const, error: a.error };
  await prisma.images.create({ data: { url, guidniReviewId: reviewId } });
  return { success: true as const };
}

export async function removeGuidniReviewImage(imageId: string) {
  const a = await requireAdmin();
  if (!a.ok) return { success: false as const, error: a.error };
  await prisma.images.delete({ where: { id: imageId } });
  return { success: true as const };
}

export async function createOrUpdateGuidniReview(
  relationId: string,
  relationType: RelationType,
  data: {
    reviewerName?: string;
    reviewerTitle?: string;
    visitedAt?: Date;
    season?: string;
    summaryQuote?: string;
    fullReview?: string;
    whatWeLoved?: string;
    worthKnowing?: string;
    bestFor?: string;
    scoreAccuracy?: number;
    scoreQuality?: number;
    scoreValue?: number;
    scorePresent?: number;
    scoreHost?: number;
    tiktokUrl?: string;
    instagramUrl?: string;
    facebookUrl?: string;
  }
) {
  const a = await requireAdmin();
  if (!a.ok) return { success: false as const, error: a.error };

  const scores = [
    data.scoreAccuracy,
    data.scoreQuality,
    data.scoreValue,
    data.scorePresent,
    data.scoreHost,
  ].filter((s): s is number => s !== undefined);
  const scoreTotal =
    scores.length > 0
      ? Math.round(scores.reduce((acc, b) => acc + b, 0) / scores.length)
      : undefined;

  const review = await prisma.guidniReview.upsert({
    where: { relationType_relationId: { relationType, relationId } },
    update: { ...data, scoreTotal: scoreTotal ?? null, assignedTo: a.userId },
    create: { relationType, relationId, ...data, scoreTotal: scoreTotal ?? null, assignedTo: a.userId },
  });
  return { success: true as const, data: review };
}

export async function updateGuidniReviewStatus(
  reviewId: string,
  status: GuidniReviewStatus
) {
  const a = await requireAdmin();
  if (!a.ok) return { success: false as const, error: a.error };

  const updated = await prisma.guidniReview.update({
    where: { id: reviewId },
    data: {
      status,
      publishedAt: status === "PUBLISHED" ? new Date() : undefined,
    },
  });

  // When published, ensure the REVIEWED_BY_GUIDNI badge exists
  if (status === "PUBLISHED") {
    await prisma.listingBadge.upsert({
      where: {
        badgeKey_relationType_relationId: {
          badgeKey: "REVIEWED_BY_GUIDNI",
          relationType: updated.relationType,
          relationId: updated.relationId,
        },
      },
      update: {},
      create: {
        badgeKey: "REVIEWED_BY_GUIDNI",
        relationType: updated.relationType,
        relationId: updated.relationId,
        assignedBy: a.userId,
      },
    });
  }

  // When withdrawn, remove the badge
  if (status === "WITHDRAWN") {
    await prisma.listingBadge.deleteMany({
      where: {
        badgeKey: "REVIEWED_BY_GUIDNI",
        relationType: updated.relationType,
        relationId: updated.relationId,
      },
    });
  }

  return { success: true as const };
}

export async function getListingsForBadgeAdmin() {
  const a = await requireAdmin();
  if (!a.ok) return { activities: [], stays: [], restaurants: [], shops: [], transfers: [] };

  const [activities, stays, restaurants, shops, transfers] = await Promise.all([
    prisma.activity.findMany({
      select: { id: true, slug: true, title: true, images: { select: { url: true }, take: 1 } },
      orderBy: { title: "asc" },
    }),
    prisma.stay.findMany({
      select: { id: true, slug: true, title: true, images: { select: { url: true }, take: 1 } },
      orderBy: { title: "asc" },
    }),
    prisma.restaurant.findMany({
      select: { id: true, slug: true, name: true, coverPhoto: true, images: { select: { url: true }, take: 1 } },
      orderBy: { name: "asc" },
    }),
    prisma.shop.findMany({
      select: { id: true, slug: true, name: true, coverPhoto: true, images: { select: { url: true }, take: 1 } },
      orderBy: { name: "asc" },
    }),
    prisma.transfer.findMany({
      select: { id: true, slug: true, title: true, images: { select: { url: true }, take: 1 } },
      orderBy: { title: "asc" },
    }),
  ]);

  const allIds = [
    ...activities.map((x) => x.id),
    ...stays.map((x) => x.id),
    ...restaurants.map((x) => x.id),
    ...shops.map((x) => x.id),
    ...transfers.map((x) => x.id),
  ];

  const badges = await prisma.listingBadge.findMany({
    where: { relationId: { in: allIds } },
    select: { badgeKey: true, relationType: true, relationId: true },
  });

  const badgeMap: Record<string, string[]> = {};
  for (const b of badges) {
    const key = `${b.relationType}:${b.relationId}`;
    if (!badgeMap[key]) badgeMap[key] = [];
    badgeMap[key].push(b.badgeKey);
  }

  return {
    activities:  activities.map((x) => ({ ...x, coverPhoto: null as null, badges: badgeMap[`ACTIVITY:${x.id}`] ?? [] })),
    stays:       stays.map((x) => ({ ...x, coverPhoto: null as null, badges: badgeMap[`STAY:${x.id}`] ?? [] })),
    restaurants: restaurants.map((x) => ({ id: x.id, slug: x.slug, title: x.name, images: x.images, coverPhoto: x.coverPhoto, badges: badgeMap[`RESTAURANT:${x.id}`] ?? [] })),
    shops:       shops.map((x) => ({ id: x.id, slug: x.slug, title: x.name, images: x.images, coverPhoto: x.coverPhoto, badges: badgeMap[`SHOP:${x.id}`] ?? [] })),
    transfers:   transfers.map((x) => ({ ...x, coverPhoto: null as null, badges: badgeMap[`TRANSFER:${x.id}`] ?? [] })),
  };
}
