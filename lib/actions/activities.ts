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
        ...(destinationSlug && { destination: { slug: destinationSlug } }),
        ...(category && { category: { contains: category } }),
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

export const getActivitiesPaginated = cache(
  async ({
    destinationSlug,
    categories,
    search,
    page = 1,
    perPage = DEFAULT_ACTIVITIES_PER_PAGE,
  }: {
    destinationSlug?: string;
    categories?: string[];
    search?: string;
    page?: number;
    perPage?: number;
  }) => {
    const where = {
      ...(destinationSlug && { destination: { slug: destinationSlug } }),
      ...(categories && categories.length > 0 && { category: { in: categories } }),
      ...(search && {
        title: { contains: search, mode: "insensitive" as const },
      }),
    };

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: {
          images: { select: { id: true, url: true }, take: 3 },
          destination: { select: { slug: true, city: true, country: true } },
        },
        orderBy: { title: "asc" },
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
  return prisma.activity.findUnique({
    where: { slug },
    include: {
      images: { select: { id: true, url: true } },
      destination: { select: { slug: true, city: true, country: true } },
      businessProfile: { select: { name: true, profileImage: true, createdAt: true, isVerified: true } },
      fixedInPasses:    { select: { id: true }, take: 1 },
      optionalInPasses: { select: { id: true }, take: 1 },
    },
  });
});
