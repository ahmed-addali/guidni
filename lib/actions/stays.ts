"use server";

import { cache } from "react";
import { prisma } from "@/lib/db";

// Primitive args so React cache() deduplicates correctly within a render pass
export const getStays = cache(
  async (
    destinationSlug?: string,
    category?: string,
    featured?: boolean,
    limit?: number
  ) => {
    return prisma.stay.findMany({
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

const DEFAULT_STAYS_PER_PAGE = 12;

export const getStaysPaginated = cache(
  async ({
    destinationSlug,
    categories,
    search,
    page = 1,
    perPage = DEFAULT_STAYS_PER_PAGE,
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

    const [stays, total] = await Promise.all([
      prisma.stay.findMany({
        where,
        include: {
          images: { select: { id: true, url: true }, take: 3 },
          destination: { select: { slug: true, city: true, country: true } },
        },
        orderBy: { title: "asc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.stay.count({ where }),
    ]);

    return {
      stays,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }
);

export const getStayBySlug = cache(async (slug: string) => {
  return prisma.stay.findUnique({
    where: { slug },
    include: {
      images: { select: { id: true, url: true } },
      destination: { select: { slug: true, city: true, country: true } },
      businessProfile: { select: { name: true, profileImage: true, createdAt: true, isVerified: true } },
    },
  });
});

export const getRelatedStays = cache(async (
  stayId: string,
  destinationId: string,
  limit = 6
) => {
  return prisma.stay.findMany({
    where: {
      destinationId,
      id: { not: stayId },
    },
    orderBy: { averageRating: "desc" },
    take: limit,
    include: {
      images:      { select: { id: true, url: true } },
      destination: { select: { slug: true, city: true, country: true } },
    },
  });
});

export const getStayById = cache(async (id: string) => {
  return prisma.stay.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      title: true,
      price: true,
      cleaningFee: true,
      serviceFee: true,
      cancelationPolicy: true,
      images: { select: { id: true, url: true }, take: 1 },
      destination: { select: { slug: true, city: true, country: true } },
    },
  });
});
