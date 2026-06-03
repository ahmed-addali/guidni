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
    priceMin,
    priceMax,
    minGuests,
  }: {
    destinationSlug?: string;
    categories?: string[];
    search?: string;
    page?: number;
    perPage?: number;
    priceMin?: number;
    priceMax?: number;
    minGuests?: number;
  }) => {
    const where = {
      ...(destinationSlug && { destination: { slug: destinationSlug } }),
      ...(categories && categories.length > 0 && { category: { in: categories } }),
      ...(search && {
        title: { contains: search, mode: "insensitive" as const },
      }),
      ...((priceMin !== undefined || priceMax !== undefined) && {
        price: {
          ...(priceMin !== undefined && { gte: priceMin }),
          ...(priceMax !== undefined && { lte: priceMax }),
        },
      }),
      ...(minGuests !== undefined && minGuests > 1 && { guestCount: { gte: minGuests } }),
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

/** Expands a check-in / check-out range into individual YYYY-MM-DD strings.
 *  Convention: checkIn is blocked, checkOut is the departure day (not blocked — new guest can check in). */
function expandReservationDates(checkIn: Date, checkOut: Date): string[] {
  const dates: string[] = [];
  const cur = new Date(Date.UTC(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate()));
  const end = new Date(Date.UTC(checkOut.getFullYear(), checkOut.getMonth(), checkOut.getDate()));
  while (cur < end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

/** Returns all unavailable dates for a stay (public booking card + availability calendar).
 *  `blocked`   = manually blocked by partner
 *  `confirmed` = CONFIRMED reservation night ranges
 *  `pending`   = PENDING reservation night ranges (soft-blocked)
 */
export const getUnavailableDates = cache(
  async (stayId: string): Promise<{ blocked: string[]; confirmed: string[]; pending: string[] }> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [blockedRows, reservations] = await Promise.all([
      prisma.stayBlockedDate.findMany({
        where: { stayId },
        select: { date: true },
        orderBy: { date: "asc" },
      }),
      prisma.staysReservation.findMany({
        where: {
          stayId,
          status: { in: ["PENDING", "CONFIRMED"] },
          checkOut: { gte: today },
        },
        select: { checkIn: true, checkOut: true, status: true },
      }),
    ]);

    const blocked = blockedRows.map((d) => d.date.toISOString().slice(0, 10));

    const confirmed: string[] = [];
    const pending: string[] = [];

    for (const r of reservations) {
      const dates = expandReservationDates(r.checkIn, r.checkOut);
      if (r.status === "CONFIRMED") confirmed.push(...dates);
      else pending.push(...dates);
    }

    return { blocked, confirmed, pending };
  }
);

export const getHostResponseTime = cache(async (stayId: string): Promise<"quickly" | "within_day" | null> => {
  const reservations = await prisma.staysReservation.findMany({
    where: { stayId, confirmedAt: { not: null } },
    select: { createdAt: true, confirmedAt: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (reservations.length === 0) return null;

  const avgMs =
    reservations.reduce((sum, r) => sum + (r.confirmedAt!.getTime() - r.createdAt.getTime()), 0) /
    reservations.length;

  const avgHours = avgMs / (1000 * 60 * 60);
  if (avgHours < 1) return "quickly";
  if (avgHours < 24) return "within_day";
  return null;
});

export const getBlockedDatesForStay = cache(async (stayId: string): Promise<string[]> => {
  const dates = await prisma.stayBlockedDate.findMany({
    where: { stayId },
    select: { date: true },
    orderBy: { date: "asc" },
  });
  return dates.map((d) => d.date.toISOString().slice(0, 10));
});

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
