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

export const getGuidePlans = cache(async (filters?: {
  destinationId?: string;
  planType?: "GUIDE_FREE" | "GUIDE_PAID";
  tag?: string;
  suitableFor?: string;
  maxDuration?: number;
}) => {
  return prisma.plan.findMany({
    where: {
      isPublic: true,
      planType: { in: ["GUIDE_FREE", "GUIDE_PAID"] },
      guideId: { not: null },
      ...(filters?.destinationId && { destinationId: filters.destinationId }),
      ...(filters?.planType && { planType: filters.planType }),
      ...(filters?.tag && { tags: { has: filters.tag } }),
      ...(filters?.suitableFor && { suitableFor: { has: filters.suitableFor } }),
      ...(filters?.maxDuration !== undefined && { duration: { lte: filters.maxDuration } }),
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
      preferences:  true,
      createdAt:    true,
      destination:  { select: { city: true, slug: true } },
      guide: {
        select: {
          slug:        true,
          displayName: true,
          avatarUrl:   true,
          isVerified:  true,
        },
      },
    },
    orderBy: [{ purchaseCount: "desc" }, { viewCount: "desc" }],
    take: 50,
  });
});
