"use server";

import { cache } from "react";
import { prisma } from "@/lib/db";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export type RestaurantListItem = {
  id: string;
  slug: string;
  name: string;
  arabicName: string | null;
  type: string;
  category: string | null;
  meals: string | null;
  foodTypes: string[];
  dietTypes: string[];
  attributes: string[];
  city: string;
  country: string;
  note: string | null;
  nbReviews: number;
  coverPhoto: string | null;
  logo: string | null;
  reservationsEnabled: boolean;
  featuredInHome: boolean;
  destination: { slug: string; city: string } | null;
  images: { url: string }[];
};

// ─────────────────────────────────────────
// Queries
// ─────────────────────────────────────────

export const getAllRestaurants = cache(async (destinationSlug?: string) => {
  return prisma.restaurant.findMany({
    where: destinationSlug
      ? { destination: { slug: destinationSlug } }
      : undefined,
    orderBy: [{ featuredInHome: "desc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      arabicName: true,
      type: true,
      category: true,
      meals: true,
      foodTypes: true,
      dietTypes: true,
      attributes: true,
      city: true,
      country: true,
      note: true,
      nbReviews: true,
      coverPhoto: true,
      logo: true,
      reservationsEnabled: true,
      featuredInHome: true,
      destination: { select: { slug: true, city: true } },
      images: { select: { url: true }, take: 1 },
    },
  }) as Promise<RestaurantListItem[]>;
});

const DEFAULT_RESTAURANTS_PER_PAGE = 12;

const restaurantListSelect = {
  id: true,
  slug: true,
  name: true,
  arabicName: true,
  type: true,
  category: true,
  meals: true,
  foodTypes: true,
  dietTypes: true,
  attributes: true,
  city: true,
  country: true,
  note: true,
  nbReviews: true,
  coverPhoto: true,
  logo: true,
  reservationsEnabled: true,
  featuredInHome: true,
  destination: { select: { slug: true, city: true } },
  images: { select: { url: true }, take: 1 },
} as const;

export type RestaurantFilters = {
  destinationSlug?: string;
  typeList?: string[];
  cuisineList?: string[];
  mealList?: string[];
  foodTypeList?: string[];
  dietList?: string[];
  attributeList?: string[];
  reservation?: boolean;
  search?: string;
};

export const getRestaurantsPaginated = cache(
  async ({
    destinationSlug,
    typeList = [],
    cuisineList = [],
    mealList = [],
    foodTypeList = [],
    dietList = [],
    attributeList = [],
    reservation,
    search,
    page = 1,
    perPage = DEFAULT_RESTAURANTS_PER_PAGE,
  }: RestaurantFilters & { page?: number; perPage?: number }) => {
    const { expandCuisines } = await import("@/lib/utils/restaurant-cuisines");
    const expandedCuisines = cuisineList.length > 0 ? [...expandCuisines(cuisineList)] : [];

    const where = {
      AND: [
        destinationSlug ? { destination: { slug: destinationSlug } } : undefined,
        typeList.length > 0 ? { type: { in: typeList } } : undefined,
        expandedCuisines.length > 0
          ? { category: { in: expandedCuisines } }
          : undefined,
        mealList.length > 0
          ? { OR: mealList.map((m) => ({ meals: { contains: m } })) }
          : undefined,
        foodTypeList.length > 0 ? { foodTypes: { hasSome: foodTypeList } } : undefined,
        dietList.length > 0 ? { dietTypes: { hasSome: dietList } } : undefined,
        attributeList.length > 0
          ? { attributes: { hasSome: attributeList } }
          : undefined,
        reservation ? { reservationsEnabled: true } : undefined,
        search
          ? { name: { contains: search, mode: "insensitive" as const } }
          : undefined,
      ].filter(Boolean) as object[],
    };

    const [restaurants, total] = await Promise.all([
      prisma.restaurant.findMany({
        where,
        select: restaurantListSelect,
        orderBy: [{ featuredInHome: "desc" }, { name: "asc" }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.restaurant.count({ where }),
    ]);

    return {
      restaurants: restaurants as RestaurantListItem[],
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }
);

const featuredRestaurantSelect = {
  id: true,
  slug: true,
  name: true,
  arabicName: true,
  type: true,
  category: true,
  meals: true,
  foodTypes: true,
  dietTypes: true,
  attributes: true,
  city: true,
  country: true,
  note: true,
  nbReviews: true,
  coverPhoto: true,
  logo: true,
  reservationsEnabled: true,
  featuredInHome: true,
  destination: { select: { slug: true, city: true } },
  images: { select: { url: true }, take: 1 },
} as const;

export const getFeaturedRestaurants = cache(async (destinationSlug?: string) => {
  const restaurants = await prisma.restaurant.findMany({
    where: {
      featuredInHome: true,
      ...(destinationSlug ? { destination: { slug: destinationSlug } } : {}),
    },
    take: 8,
    orderBy: { name: "asc" },
    select: featuredRestaurantSelect,
  });

  // Fallback: if no featured, return first 8
  if (restaurants.length === 0) {
    return prisma.restaurant.findMany({
      take: 8,
      orderBy: { name: "asc" },
      select: featuredRestaurantSelect,
    });
  }

  return restaurants;
});

export const getRestaurantBySlug = cache(async (slug: string) => {
  return prisma.restaurant.findUnique({
    where: { slug },
    include: {
      images: true,
      menu: {
        where: { visible: true },
        orderBy: { category: "asc" },
        include: { images: { select: { url: true }, take: 1 } },
      },
      hours: true,
      businessProfile: {
        select: { name: true, profileImage: true, isVerified: true, createdAt: true },
      },
      destination: { select: { slug: true, city: true, country: true } },
    },
  });
});

export const getRelatedRestaurants = cache(async (
  restaurantId: string,
  destinationId: string,
  limit = 6,
) => {
  return prisma.restaurant.findMany({
    where: { destinationId, id: { not: restaurantId } },
    take: limit,
    orderBy: { note: "desc" },
    select: {
      id: true,
      slug: true,
      name: true,
      arabicName: true,
      type: true,
      category: true,
      meals: true,
      foodTypes: true,
      dietTypes: true,
      attributes: true,
      city: true,
      country: true,
      note: true,
      nbReviews: true,
      coverPhoto: true,
      logo: true,
      reservationsEnabled: true,
      featuredInHome: true,
      destination: { select: { slug: true, city: true } },
      images: { select: { url: true }, take: 1 },
    },
  }) as Promise<RestaurantListItem[]>;
});
