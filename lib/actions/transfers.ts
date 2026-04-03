"use server";

import { cache } from "react";
import { prisma } from "@/lib/db";

export const getTransfers = cache(
  async (destinationSlug?: string, type?: string) => {
    return prisma.transfer.findMany({
      where: {
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
    where: { slug },
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
