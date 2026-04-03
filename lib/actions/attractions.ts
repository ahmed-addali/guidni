"use server";

import { cache } from "react";
import { prisma } from "@/lib/db";

export const getAttractionsByDestination = cache(
  async (destinationSlug: string, locale: string) => {
    return prisma.attraction.findMany({
      where: { destination: { slug: destinationSlug } },
      include: {
        images: { take: 1, select: { url: true } },
        translations: {
          where: { locale },
          select: { title: true, description: true },
        },
      },
      take: 6,
      orderBy: { createdAt: "asc" },
    });
  }
);

export const getAttractionBySlug = cache(
  async (destinationSlug: string, attractionSlug: string) => {
    return prisma.attraction.findFirst({
      where: {
        slug: attractionSlug,
        destination: { slug: destinationSlug },
      },
      include: {
        images: true,
        translations: true,
        destination: { select: { slug: true, city: true, country: true } },
        activities: {
          select: {
            id: true,
            slug: true,
            title: true,
            arabicTitle: true,
            price: true,
            duration: true,
            category: true,
            images: { take: 1, select: { url: true } },
          },
        },
      },
    });
  }
);

export const getRelatedAttractions = cache(
  async (destinationId: string, category: string, excludeId: string) => {
    return prisma.attraction.findMany({
      where: {
        destinationId,
        category,
        id: { not: excludeId },
      },
      include: {
        images: { take: 1, select: { url: true } },
      },
      take: 4,
      orderBy: { createdAt: "asc" },
    });
  }
);
