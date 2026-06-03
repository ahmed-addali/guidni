"use server";

import { cache } from "react";
import { prisma } from "@/lib/db";

export const getTransfers = cache(
  async (destinationSlug?: string, type?: string) => {
    return prisma.transfer.findMany({
      where: {
        status: "ACTIVE",
        ...(destinationSlug
          ? { destination: { slug: destinationSlug } }
          : {}),
        ...(type ? { type: type as never } : {}),
      },
      include: {
        images: { select: { id: true, url: true }, take: 1 },
        destination: { select: { slug: true, city: true } },
      },
      orderBy: [{ featuredInHome: "desc" }, { createdAt: "desc" }],
    });
  }
);

const DEFAULT_TRANSFERS_PER_PAGE = 12;

export const getTransfersPaginated = cache(
  async ({
    destinationSlug,
    type,
    search,
    page = 1,
    perPage = DEFAULT_TRANSFERS_PER_PAGE,
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
    const [transfers, total] = await Promise.all([
      prisma.transfer.findMany({
        where,
        include: {
          images: { select: { id: true, url: true }, take: 1 },
          destination: { select: { slug: true, city: true } },
        },
        orderBy: [{ featuredInHome: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.transfer.count({ where }),
    ]);
    return { transfers, total, page, perPage, totalPages: Math.ceil(total / perPage) };
  }
);

export const getTransferBySlug = cache(async (slug: string) => {
  return prisma.transfer.findUnique({
    where: { slug, status: "ACTIVE" },
    include: {
      images: { select: { id: true, url: true } },
      businessProfile: { select: { name: true, country: true, isVerified: true, createdAt: true, profileImage: true } },
      destination: { select: { city: true, country: true, slug: true } },
    },
  });
});

export const getRelatedTransfers = cache(
  async (transferId: string, destinationId: string, limit = 6) => {
    return prisma.transfer.findMany({
      where: {
        status: "ACTIVE",
        destinationId,
        id: { not: transferId },
      },
      include: {
        images: { select: { id: true, url: true }, take: 1 },
        destination: { select: { slug: true, city: true } },
      },
      orderBy: [{ featuredInHome: "desc" }, { createdAt: "desc" }],
      take: limit,
    });
  }
);

export const getFeaturedTransfers = cache(async (destinationSlug?: string) => {
  return prisma.transfer.findMany({
    where: {
      status: "ACTIVE",
      featuredInHome: true,
      ...(destinationSlug
        ? { destination: { slug: destinationSlug } }
        : {}),
    },
    include: {
      images: { select: { id: true, url: true }, take: 1 },
    },
    take: 6,
  });
});

/**
 * Returns only partner-manually-blocked dates (full-day blocks).
 * Reservations are NOT included here because a transfer day can hold multiple
 * bookings at different times — time-level conflict detection happens client-side.
 */
export const getPublicTransferUnavailableDates = cache(
  async (transferId: string): Promise<string[]> => {
    const blocked = await prisma.transferBlockedDate.findMany({
      where: { transferId },
      select: { date: true },
    });
    return blocked.map((d) => d.date.toISOString().slice(0, 10));
  }
);

/**
 * Returns all active (PENDING/CONFIRMED) bookings for a transfer with their
 * date, time, and hoursRequested so the booking widget can detect time-range
 * conflicts for CHAUFFEUR-type transfers.
 */
export const getTransferBookedSlots = cache(
  async (transferId: string): Promise<{ date: string; time: string; hoursRequested: number }[]> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reservations = await prisma.transferReservation.findMany({
      where: {
        transferId,
        status: { in: ["PENDING", "CONFIRMED"] },
        date: { gte: today },
      },
      select: { date: true, time: true, hoursRequested: true },
    });

    return reservations.map((r) => ({
      date: r.date.toISOString().slice(0, 10),
      time: r.time,
      hoursRequested: r.hoursRequested ?? 1,
    }));
  }
);
