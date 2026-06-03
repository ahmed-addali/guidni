"use server";

import { cache } from "react";
import { prisma } from "@/lib/db";
import {
  ACTIVITY_CATEGORY_TO_INTERESTS,
  ATTRACTION_CATEGORY_TO_INTERESTS,
  RENTAL_CATEGORY_TAGS,
  SHOP_CATEGORY_TO_INTERESTS,
  TRANSFER_TYPE_TAGS,
} from "./category-map";
import type { PlanItem, PlannerData, PlanShopData } from "./types";

// ─────────────────────────────────────────────────────────────
// Normalizers — DB record → PlanItem
// ─────────────────────────────────────────────────────────────

function parseRating(note: string | null | undefined): number | undefined {
  if (!note) return undefined;
  const n = parseFloat(note);
  return isNaN(n) ? undefined : n;
}

function normalizeActivities(
  rows: Awaited<ReturnType<typeof fetchActivities>>
): PlanItem[] {
  return rows.map((a) => {
    const categoryTags = ACTIVITY_CATEGORY_TO_INTERESTS[a.categories?.[0]?.toLowerCase() ?? ""] ?? [];
    return {
      id: a.id,
      type: "ACTIVITY" as const,
      slug: a.slug,
      name: a.title,
      arabicName: a.arabicTitle ?? undefined,
      imageUrl: a.images[0]?.url,
      location: a.location ?? undefined,
      price: a.price,
      priceLabel: "per person",
      durationMinutes: a.durationMinutes ?? parseActivityDuration(a.duration),
      intensity: (a.intensity as "low" | "medium" | "high") ?? "medium",
      tags: [...(a.tags ?? []), ...(categoryTags as string[])],
      idealTime: (a.bestTimeOfDay as PlanItem["idealTime"]) ?? "any",
      familyFriendly: a.tags?.includes("family") || a.tags?.includes("kids"),
      bookingUrl: `/activities/${a.slug}`,
      nbReviews: a.nbReviews,
      rating: parseRating(a.note),
    };
  });
}

function normalizeAttractions(
  rows: Awaited<ReturnType<typeof fetchAttractions>>
): PlanItem[] {
  return rows.map((a) => {
    const categoryTags =
      ATTRACTION_CATEGORY_TO_INTERESTS[a.category?.toLowerCase() ?? ""] ?? [];
    return {
      id: a.id,
      type: "ATTRACTION" as const,
      slug: a.slug,
      name: a.title,
      imageUrl: a.images[0]?.url,
      location: a.location,
      price: a.hasFee ? (a.feeAmount ?? 0) : 0,
      priceLabel: a.hasFee ? "entry fee" : "free",
      durationMinutes: 90,
      intensity: "low" as const,
      tags: [...(categoryTags as string[]), a.category?.toLowerCase() ?? ""],
      idealTime: "morning" as const,
      familyFriendly: ["park", "museum", "beach"].includes(
        a.category?.toLowerCase() ?? ""
      ),
      bookingUrl: `/destinations/${a.slug}`,
    };
  });
}

function normalizeRestaurants(
  rows: Awaited<ReturnType<typeof fetchRestaurants>>
): PlanItem[] {
  return rows.map((r) => {
    const attrTags = r.attributes.flatMap(
      (attr) => ([] as string[]) // interest ids via RESTAURANT_ATTRIBUTE_TO_INTERESTS handled in engine
    );
    return {
      id: r.id,
      type: "RESTAURANT" as const,
      slug: r.slug,
      name: r.name,
      arabicName: r.arabicName ?? undefined,
      imageUrl: r.coverPhoto ?? r.images[0]?.url,
      location: r.city,
      price: 0,
      priceLabel: "estimated per person",
      durationMinutes: 90,
      intensity: "low" as const,
      tags: [...r.foodTypes, ...r.dietTypes, r.type?.toLowerCase() ?? ""],
      idealTime: "any" as const,
      familyFriendly: r.attributes.includes("family_friendly"),
      bookingUrl: `/restaurants/${r.slug}`,
      meals: r.meals?.split(",").map((m) => m.trim()) ?? ["Lunch", "Dinner"],
      attributes: r.attributes,
      hours: r.hours,
      nbReviews: r.nbReviews,
      rating: parseRating(r.note),
    };
  });
}

function normalizeTransfers(
  rows: Awaited<ReturnType<typeof fetchTransfers>>
): PlanItem[] {
  return rows.map((t) => {
    const typeTags = TRANSFER_TYPE_TAGS[t.type] ?? [];
    const price = t.pricePerTrip ?? t.pricePerHour ?? 0;
    const priceLabel =
      t.pricePerTrip
        ? "per trip"
        : t.pricePerHour
        ? "per hour"
        : "per person";
    return {
      id: t.id,
      type: "TRANSFER" as const,
      slug: t.slug,
      name: t.title,
      arabicName: t.arabicTitle ?? undefined,
      imageUrl: t.images[0]?.url,
      price,
      priceLabel,
      durationMinutes: 30,
      intensity: "low" as const,
      tags: typeTags,
      idealTime: "any" as const,
      familyFriendly: t.isChildSeat,
      bookingUrl: `/transport/transfers/${t.slug}`,
      transferType: t.type,
      capacity: t.capacity,
      isAC: t.isAC,
      isMeetGreet: t.isMeetGreet,
      isChildSeat: t.isChildSeat,
      nbReviews: t.nbReviews,
      rating: parseRating(t.note),
    };
  });
}

function normalizeRentals(
  rows: Awaited<ReturnType<typeof fetchRentals>>
): PlanItem[] {
  return rows.map((r) => {
    const rentalCategory = r.type?.toLowerCase() ?? "car";
    const typeTags = RENTAL_CATEGORY_TAGS[rentalCategory] ?? ["rental"];
    return {
      id: r.id,
      type: "RENTAL" as const,
      slug: r.slug,
      name: r.title,
      arabicName: r.arabicTitle ?? undefined,
      imageUrl: r.images[0]?.url,
      price: r.pricePerDay,
      priceLabel: "per day",
      durationMinutes: 0,
      intensity: "low" as const,
      tags: [...typeTags, rentalCategory],
      idealTime: "any" as const,
      familyFriendly: r.capacity >= 4,
      bookingUrl: `/transport/rentals/${r.slug}`,
      capacity: r.capacity,
    };
  });
}

function normalizeShops(
  rows: Awaited<ReturnType<typeof fetchShops>>
): PlanShopData[] {
  return rows.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    category: s.category,
    imageUrl: s.coverPhoto ?? s.images[0]?.url,
    location: s.city ?? undefined,
    products: s.products.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      imageUrl: p.images[0]?.url,
      tags: [...p.tags, p.category ?? ""],
      isHandmade: p.isHandmade,
    })),
  }));
}

// ─────────────────────────────────────────────────────────────
// Raw Prisma fetchers
// ─────────────────────────────────────────────────────────────

function fetchActivities(destinationId: string) {
  return prisma.activity.findMany({
    where: { destinationId },
    take: 100,
    select: {
      id: true, slug: true, title: true, arabicTitle: true,
      categories: true, price: true, duration: true,
      durationMinutes: true, bestTimeOfDay: true,
      intensity: true, tags: true,
      location: true, note: true, nbReviews: true,
      images: { select: { url: true }, take: 1 },
    },
  });
}

function fetchAttractions(destinationId: string) {
  return prisma.attraction.findMany({
    where: { destinationId },
    take: 100,
    select: {
      id: true, slug: true, title: true, category: true,
      hasFee: true, feeAmount: true, location: true,
      images: { select: { url: true }, take: 1 },
    },
  });
}

function fetchRestaurants(destinationId: string) {
  return prisma.restaurant.findMany({
    where: { destinationId },
    take: 100,
    select: {
      id: true, slug: true, name: true, arabicName: true,
      type: true, meals: true, foodTypes: true, dietTypes: true,
      attributes: true, city: true, note: true, nbReviews: true,
      coverPhoto: true,
      hours: {
        select: {
          day: true, opening: true, closing: true,
          isClosed: true, isFullDayOpening: true,
        },
      },
      images: { select: { url: true }, take: 1 },
    },
  });
}

function fetchTransfers(destinationId: string) {
  return prisma.transfer.findMany({
    where: { destinationId },
    take: 50,
    select: {
      id: true, slug: true, title: true, arabicTitle: true,
      type: true, capacity: true,
      pricePerTrip: true, pricePerHour: true, pricePerPerson: true,
      isAC: true, isMeetGreet: true, isChildSeat: true,
      note: true, nbReviews: true,
      images: { select: { url: true }, take: 1 },
    },
  });
}

function fetchRentals(destinationId: string) {
  return prisma.rental.findMany({
    where: { destinationId },
    take: 50,
    select: {
      id: true, slug: true, title: true, arabicTitle: true,
      type: true, pricePerDay: true, capacity: true,
      images: { select: { url: true }, take: 1 },
    },
  });
}

function fetchShops(destinationId: string) {
  return prisma.shop.findMany({
    where: { destinationId },
    take: 50,
    select: {
      id: true, slug: true, name: true, category: true,
      coverPhoto: true, city: true,
      images: { select: { url: true }, take: 1 },
      products: {
        select: {
          id: true, slug: true, name: true, price: true,
          tags: true, category: true, isHandmade: true,
          images: { select: { url: true }, take: 1 },
        },
        take: 5,
        orderBy: { featured: "desc" },
      },
    },
  });
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/** Parse "2.5 hours" or "120 minutes" or "2" → minutes */
function parseActivityDuration(duration: string | null | undefined): number {
  if (!duration) return 120;
  const cleaned = duration.toLowerCase().replace(/[^0-9.]/g, "");
  const n = parseFloat(cleaned);
  if (isNaN(n)) return 120;
  // If value > 10, assume it's already in minutes
  return n > 10 ? Math.round(n) : Math.round(n * 60);
}

// ─────────────────────────────────────────────────────────────
// Stays — internal fetch for engine auto-selection
// ─────────────────────────────────────────────────────────────

async function fetchStays(destinationId: string) {
  return prisma.stay.findMany({
    where: { destinationId, approvalStatus: "APPROVED" },
    take: 40,
    orderBy: { averageRating: "desc" },
    select: {
      id: true, slug: true, title: true, price: true,
      city: true, category: true,
      images: { select: { url: true }, take: 1 },
    },
  });
}

function normalizeStays(
  rows: Awaited<ReturnType<typeof fetchStays>>
): PlanItem[] {
  return rows.map((s) => ({
    id:         s.id,
    type:       "STAY" as const,
    slug:       s.slug,
    name:       s.title,
    imageUrl:   s.images[0]?.url,
    location:   s.city ?? undefined,
    price:      s.price,
    priceLabel: "per night",
    tags:       [s.category],
    idealTime:  "any" as const,
  }));
}

// ─────────────────────────────────────────────────────────────
// Main export — cached per destination per request
// ─────────────────────────────────────────────────────────────

export const getPlannerData = cache(
  async (destinationId: string): Promise<PlannerData> => {
    const [
      activityRows,
      attractionRows,
      restaurantRows,
      transferRows,
      rentalRows,
      stayRows,
      shopRows,
    ] = await Promise.all([
      fetchActivities(destinationId),
      fetchAttractions(destinationId),
      fetchRestaurants(destinationId),
      fetchTransfers(destinationId),
      fetchRentals(destinationId).catch(() => []),
      fetchStays(destinationId).catch(() => []),
      fetchShops(destinationId),
    ]);

    return {
      activities:  normalizeActivities(activityRows),
      attractions: normalizeAttractions(attractionRows),
      restaurants: normalizeRestaurants(restaurantRows),
      transfers:   normalizeTransfers(transferRows),
      rentals:     normalizeRentals(rentalRows),
      stays:       normalizeStays(stayRows),
      shops:       normalizeShops(shopRows),
    };
  }
);
