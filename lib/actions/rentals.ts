"use server";

import { cache } from "react";
import { prisma } from "@/lib/db";

export const getRentals = cache(async (destinationSlug?: string, type?: string) => {
  return prisma.rental.findMany({
    where: {
      status: "ACTIVE",
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
      status: "ACTIVE" as const,
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
    where: { slug, status: "ACTIVE" },
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
        status: "ACTIVE",
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
      status: "ACTIVE",
      featuredInHome: true,
      ...(destinationSlug ? { destination: { slug: destinationSlug } } : {}),
    },
    include: { images: { take: 1 } },
    take: 6,
  });
});

export const getPublicRentalUnavailableDates = cache(
  async (rentalId: string): Promise<string[]> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [blockedRows, reservations] = await Promise.all([
      prisma.rentalBlockedDate.findMany({
        where: { rentalId },
        select: { date: true },
      }),
      prisma.rentalReservation.findMany({
        where: {
          rentalId,
          status: { in: ["PENDING", "CONFIRMED"] },
          endDate: { gte: today },
        },
        select: { startDate: true, endDate: true },
      }),
    ]);

    const blocked = blockedRows.map((d) => d.date.toISOString().slice(0, 10));

    const reserved: string[] = [];
    for (const r of reservations) {
      const start = new Date(r.startDate);
      const end   = new Date(r.endDate);
      const cur   = new Date(start);
      while (cur <= end) {
        reserved.push(cur.toISOString().slice(0, 10));
        cur.setDate(cur.getDate() + 1);
      }
    }

    return [...new Set([...blocked, ...reserved])];
  }
);
