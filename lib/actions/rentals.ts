"use server";

import { cache } from "react";
import { prisma } from "@/lib/db";

export const getRentals = cache(async (destinationSlug?: string, type?: string) => {
  return prisma.rental.findMany({
    where: {
      ...(destinationSlug ? { destination: { slug: destinationSlug } } : {}),
      ...(type ? { type: type as never } : {}),
    },
    include: { images: { take: 1 } },
    orderBy: { pricePerDay: "asc" },
  });
});

const DEFAULT_RENTALS_PER_PAGE = 12;

export const getRentalsPaginated = cache(
  async ({
    destinationSlug,
    type,
    search,
    page = 1,
    perPage = DEFAULT_RENTALS_PER_PAGE,
  }: {
    destinationSlug?: string;
    type?: string;
    search?: string;
    page?: number;
    perPage?: number;
  }) => {
    const where = {
      ...(destinationSlug ? { destination: { slug: destinationSlug } } : {}),
      ...(type ? { type: type as never } : {}),
      ...(search
        ? { title: { contains: search, mode: "insensitive" as const } }
        : {}),
    };
    const [rentals, total] = await Promise.all([
      prisma.rental.findMany({
        where,
        include: { images: { take: 1 } },
        orderBy: { pricePerDay: "asc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.rental.count({ where }),
    ]);
    return { rentals, total, page, perPage, totalPages: Math.ceil(total / perPage) };
  }
);

export const getRentalBySlug = cache(async (slug: string) => {
  return prisma.rental.findUnique({
    where: { slug },
    include: {
      images: { select: { id: true, url: true } },
      businessProfile: { select: { name: true, country: true, isVerified: true, createdAt: true, profileImage: true } },
      destination: { select: { city: true, country: true, slug: true } },
    },
  });
});

export const getRelatedRentals = cache(
  async (rentalId: string, destinationId: string, limit = 6) => {
    return prisma.rental.findMany({
      where: {
        destinationId,
        id: { not: rentalId },
      },
      include: {
        images: { select: { id: true, url: true }, take: 1 },
      },
      orderBy: { pricePerDay: "asc" },
      take: limit,
    });
  }
);

export const getFeaturedRentals = cache(async (destinationSlug?: string) => {
  return prisma.rental.findMany({
    where: {
      featuredInHome: true,
      ...(destinationSlug ? { destination: { slug: destinationSlug } } : {}),
    },
    include: { images: { take: 1 } },
    take: 6,
  });
});
