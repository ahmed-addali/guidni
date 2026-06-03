"use server";

import { cache } from "react";
import { prisma } from "@/lib/db";

// cache() deduplicates calls within the same render pass
export const getDestinations = cache(async (featuredOnly = false) => {
  return prisma.destination.findMany({
    where: {
      active: true,
      ...(featuredOnly ? { featured: true } : {}),
    },
    include: {
      images: { select: { url: true } },
      _count: {
        select: { activities: true, stays: true, restaurants: true },
      },
    },
    orderBy: [{ featured: "desc" }, { country: "asc" }, { city: "asc" }],
  });
});

export const getDestinationBySlug = cache(async (slug: string) => {
  return prisma.destination.findUnique({
    where: { slug, active: true },
    include: {
      images: { select: { url: true } },
    },
  });
});
