"use server";

import { cache } from "react";
import { prisma } from "@/lib/db";

export const getActivities = cache(
  async (
    destinationSlug?: string,
    category?: string,
    featured?: boolean,
    limit?: number
  ) => {
    return prisma.activity.findMany({
      where: {
        status: "ACTIVE",
        ...(destinationSlug && { destination: { slug: destinationSlug } }),
        ...(category && { categories: { has: category } }),
        ...(featured === true && { featuredInHome: true }),
      },
      include: {
        images: { select: { id: true, url: true }, take: 3 },
        destination: { select: { slug: true, city: true, country: true } },
      },
      orderBy: { title: "asc" },
      ...(limit ? { take: limit } : {}),
    });
  }
);

const DEFAULT_ACTIVITIES_PER_PAGE = 12;

type SortBy = "popular" | "price_asc" | "price_desc" | "rating" | "newest";
type PriceRange = "0-50" | "50-150" | "150-300" | "300+";
type DurationPreset = "short" | "half" | "full" | "multi";

const PRICE_RANGES: Record<PriceRange, { gte?: number; lte?: number }> = {
  "0-50":    { lte: 50 },
  "50-150":  { gte: 50,  lte: 150 },
  "150-300": { gte: 150, lte: 300 },
  "300+":    { gte: 300 },
};

// durationMinutes ranges
const DURATION_RANGES: Record<DurationPreset, { gte?: number; lte?: number }> = {
  "short": { lte: 120 },       // ≤ 2h
  "half":  { gte: 121, lte: 360 }, // 2–6h
  "full":  { gte: 361, lte: 720 }, // 6–12h
  "multi": { gte: 721 },           // 12h+
};

const SORT_ORDER: Record<SortBy, object> = {
  popular:    { nbReviews: "desc" as const },
  price_asc:  { price:     "asc"  as const },
  price_desc: { price:     "desc" as const },
  rating:     { note:      "desc" as const },
  newest:     { createdAt: "desc" as const },
};

export const getActivitiesPaginated = cache(
  async ({
    destinationSlug,
    categories,
    search,
    priceRange,
    sortBy,
    duration,
    page = 1,
    perPage = DEFAULT_ACTIVITIES_PER_PAGE,
  }: {
    destinationSlug?: string;
    categories?: string[];
    search?: string;
    priceRange?: PriceRange;
    sortBy?: SortBy;
    duration?: DurationPreset;
    page?: number;
    perPage?: number;
  }) => {
    const priceFilter = priceRange ? PRICE_RANGES[priceRange] : undefined;
    const durationFilter = duration ? DURATION_RANGES[duration] : undefined;

    const where = {
      status: "ACTIVE" as const,
      ...(destinationSlug && { destination: { slug: destinationSlug } }),
      ...(categories && categories.length > 0 && { categories: { hasSome: categories } }),
      ...(search && { title: { contains: search, mode: "insensitive" as const } }),
      ...(priceFilter && { price: priceFilter }),
      ...(durationFilter && { durationMinutes: { ...durationFilter, not: null } }),
    };

    const orderBy = SORT_ORDER[sortBy ?? "popular"];

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        select: {
          id: true,
          slug: true,
          title: true,
          arabicTitle: true,
          categories: true,
          price: true,
          region: true,
          city: true,
          country: true,
          duration: true,
          note: true,
          latitude: true,
          longitude: true,
          images: { select: { id: true, url: true }, take: 3 },
          destination: { select: { slug: true, city: true, country: true } },
        },
        orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.activity.count({ where }),
    ]);

    return {
      activities,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }
);

export const getActivityById = cache(async (id: string) => {
  return prisma.activity.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      title: true,
      price: true,
      cancelation: true,
      images: { select: { id: true, url: true }, take: 1 },
      destination: { select: { slug: true, city: true, country: true } },
    },
  });
});

export const getRelatedActivities = cache(async (
  activityId: string,
  destinationId: string,
  limit = 6
) => {
  return prisma.activity.findMany({
    where: {
      status: "ACTIVE",
      destinationId,
      id: { not: activityId },
    },
    orderBy: { note: "desc" },
    take: limit,
    include: {
      images:      { select: { id: true, url: true } },
      destination: { select: { slug: true, city: true, country: true } },
    },
  });
});

export const getActivityBySlug = cache(async (slug: string) => {
  return prisma.activity.findFirst({
    where: { slug, status: "ACTIVE" },
    include: {
      images: { select: { id: true, url: true } },
      destination: { select: { slug: true, city: true, country: true } },
      businessProfile: { select: { name: true, profileImage: true, createdAt: true, isVerified: true } },
      fixedInPasses:    { select: { id: true }, take: 1 },
      optionalInPasses: { select: { id: true }, take: 1 },
    },
  });
});
