"use server";

import { cache } from "react";
import { prisma } from "@/lib/db";

// ─────────────────────────────────────────────────────────────
// Public read
// ─────────────────────────────────────────────────────────────

export const getGuides = cache(async (filters?: {
  destinationId?: string;
  specialization?: string;
  language?: string;
  isFeatured?: boolean;
}) => {
  return prisma.guideProfile.findMany({
    where: {
      isActive: true,
      ...(filters?.isFeatured !== undefined && { isFeatured: filters.isFeatured }),
      ...(filters?.destinationId && { destinationId: filters.destinationId }),
      ...(filters?.specialization && {
        specializations: { has: filters.specialization },
      }),
      ...(filters?.language && {
        languages: { has: filters.language },
      }),
    },
    select: {
      id:              true,
      slug:            true,
      displayName:     true,
      tagline:         true,
      avatarUrl:       true,
      coverUrl:        true,
      specializations: true,
      languages:       true,
      country:         true,
      note:            true,
      nbReviews:       true,
      planCount:       true,
      isVerified:      true,
      isFeatured:      true,
      createdAt:       true,
      destination:     { select: { city: true, country: true, slug: true } },
    },
    orderBy: [{ isFeatured: "desc" }, { nbReviews: "desc" }, { createdAt: "asc" }],
  });
});

export const getGuideBySlug = cache(async (slug: string) => {
  return prisma.guideProfile.findUnique({
    where: { slug, isActive: true },
    include: {
      destination: { select: { id: true, city: true, country: true, slug: true } },
      plans: {
        where: { isPublic: true, planType: { not: "USER_SAVED" } },
        select: {
          id:           true,
          title:        true,
          duration:     true,
          planType:     true,
          price:        true,
          purchaseCount:true,
          viewCount:    true,
          summary:      true,
          tags:         true,
          difficulty:   true,
          suitableFor:  true,
          season:       true,
          preferences:  true,
          createdAt:    true,
          destination:  { select: { city: true, slug: true } },
        },
        orderBy: [{ purchaseCount: "desc" }, { viewCount: "desc" }],
      },
    },
  });
});

export const getFeaturedGuides = cache(async (destinationId?: string) => {
  return prisma.guideProfile.findMany({
    where: {
      isActive: true,
      isFeatured: true,
      ...(destinationId && { destinationId }),
    },
    select: {
      id:              true,
      slug:            true,
      displayName:     true,
      tagline:         true,
      avatarUrl:       true,
      specializations: true,
      languages:       true,
      note:            true,
      nbReviews:       true,
      planCount:       true,
      isVerified:      true,
      destination:     { select: { city: true, slug: true } },
    },
    orderBy: { totalSales: "desc" },
    take: 6,
  });
});

export type GuidePlanSort = "popular" | "newest" | "price_asc" | "price_desc" | "duration_asc";

export const getGuidePlans = cache(async (filters?: {
  destinationId?: string;
  planType?: "GUIDE_FREE" | "GUIDE_PAID" | "all";
  tag?: string;
  suitableFor?: string;
  difficulty?: string;
  maxDuration?: number;
  minDuration?: number;
  maxPrice?: number;
  search?: string;
  sort?: GuidePlanSort;
}) => {
  const sort = filters?.sort ?? "popular";

  const orderBy = (() => {
    switch (sort) {
      case "newest":      return [{ createdAt: "desc" as const }];
      case "price_asc":   return [{ price: "asc" as const }];
      case "price_desc":  return [{ price: "desc" as const }];
      case "duration_asc": return [{ duration: "asc" as const }];
      default:            return [{ purchaseCount: "desc" as const }, { viewCount: "desc" as const }];
    }
  })();

  return prisma.plan.findMany({
    where: {
      isPublic: true,
      planType: filters?.planType && filters.planType !== "all"
        ? filters.planType
        : { in: ["GUIDE_FREE", "GUIDE_PAID"] },
      guideId: { not: null },
      ...(filters?.destinationId && { destinationId: filters.destinationId }),
      ...(filters?.tag && { tags: { has: filters.tag } }),
      ...(filters?.suitableFor && { suitableFor: { has: filters.suitableFor } }),
      ...(filters?.difficulty && { difficulty: filters.difficulty }),
      ...(filters?.maxDuration !== undefined && { duration: { lte: filters.maxDuration } }),
      ...(filters?.minDuration !== undefined && { duration: { gte: filters.minDuration } }),
      ...(filters?.maxPrice !== undefined && { price: { lte: filters.maxPrice } }),
      ...(filters?.search && {
        OR: [
          { title: { contains: filters.search, mode: "insensitive" as const } },
          { summary: { contains: filters.search, mode: "insensitive" as const } },
          { tags: { has: filters.search.toLowerCase() } },
        ],
      }),
    },
    select: {
      id:           true,
      title:        true,
      duration:     true,
      planType:     true,
      price:        true,
      purchaseCount:true,
      viewCount:    true,
      summary:      true,
      tags:         true,
      difficulty:   true,
      suitableFor:  true,
      season:       true,
      createdAt:    true,
      destination:  { select: { city: true, slug: true } },
      guide: {
        select: {
          slug:        true,
          displayName: true,
          avatarUrl:   true,
          coverUrl:    true,
          isVerified:  true,
        },
      },
      _count: { select: { purchases: true } },
    },
    orderBy,
    take: 100,
  });
});

/** Other public guide plans at the same destination, excluding a specific plan. */
export const getRelatedGuidePlans = cache(async (
  destinationId: string,
  excludePlanId: string,
  take = 4
) => {
  return prisma.plan.findMany({
    where: {
      isPublic:    true,
      planType:    { in: ["GUIDE_FREE", "GUIDE_PAID"] },
      guideId:     { not: null },
      destinationId,
      id:          { not: excludePlanId },
    },
    select: {
      id:           true,
      title:        true,
      duration:     true,
      planType:     true,
      price:        true,
      purchaseCount:true,
      viewCount:    true,
      summary:      true,
      suitableFor:  true,
      difficulty:   true,
      destination:  { select: { city: true } },
      guide: {
        select: { slug: true, displayName: true, avatarUrl: true, isVerified: true },
      },
    },
    orderBy: [{ purchaseCount: "desc" }, { viewCount: "desc" }],
    take,
  });
});

/** Other active guides at the same destination, excluding a specific guide. */
/**
 * Returns a map of planId → { avg: number, count: number } for an array of plan IDs.
 * Used to show star ratings on plan cards without N+1 queries.
 */
export async function getPlanRatings(
  planIds: string[]
): Promise<Record<string, { avg: number; count: number }>> {
  if (planIds.length === 0) return {};

  const reviews = await prisma.review.groupBy({
    by: ["relationId"],
    where: {
      relationId: { in: planIds },
      relationType: "PLAN",
    },
    _avg: { rating: true },
    _count: { rating: true },
  });

  return Object.fromEntries(
    reviews.map((r) => [
      r.relationId,
      { avg: Math.round((r._avg.rating ?? 0) * 10) / 10, count: r._count.rating },
    ])
  );
}

export const getRelatedGuides = cache(async (
  destinationId: string,
  excludeGuideId: string,
  take = 3
) => {
  return prisma.guideProfile.findMany({
    where: {
      isActive:      true,
      destinationId,
      id:            { not: excludeGuideId },
    },
    select: {
      id:              true,
      slug:            true,
      displayName:     true,
      tagline:         true,
      avatarUrl:       true,
      specializations: true,
      languages:       true,
      nbReviews:       true,
      planCount:       true,
      isVerified:      true,
      destination:     { select: { city: true } },
    },
    orderBy: { totalSales: "desc" },
    take,
  });
});
