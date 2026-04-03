"use server";

import { cache } from "react";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { RestaurantSchema, MenuItemSchema, HoursSchema } from "@/lib/validations/restaurant";
import { uniqueSlug } from "@/lib/utils/slugify";
import type { z } from "zod";

// ─── Helper: get verified partner profile ─────────────────────────────────────

async function getPartnerProfile() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  return prisma.businessProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export const getPartnerRestaurants = cache(async () => {
  const profile = await getPartnerProfile();
  if (!profile) return [];

  return prisma.restaurant.findMany({
    where: { profileId: profile.id },
    include: {
      images: { select: { id: true, url: true }, take: 1 },
      _count: { select: { reservations: true } },
    },
    orderBy: { name: "asc" },
  });
});

export const getPartnerRestaurantBySlug = cache(async (slug: string) => {
  const profile = await getPartnerProfile();
  if (!profile) return null;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      images: { select: { id: true, url: true } },
      menu:   { include: { images: { select: { id: true, url: true }, take: 1 } }, orderBy: { createdAt: "asc" } },
      hours:  { orderBy: { id: "asc" } },
    },
  });

  if (!restaurant || restaurant.profileId !== profile.id) return null;
  return restaurant;
});

// ─── Restaurant CRUD ──────────────────────────────────────────────────────────

export async function createRestaurant(rawData: unknown) {
  const profile = await getPartnerProfile();
  if (!profile) return { success: false, error: "No business profile" };

  const parsed = RestaurantSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation error" };
  }

  try {
    const slug = uniqueSlug(parsed.data.name);
    const { destinationId, ...rest } = parsed.data;
    await prisma.restaurant.create({
      data: {
        ...rest,
        slug,
        profileId: profile.id,
        ...(destinationId ? { destinationId } : {}),
      },
    });
    revalidatePath("/");
    return { success: true, slug };
  } catch (error) {
    console.error("createRestaurant error:", error);
    return { success: false, error: "Failed to create restaurant." };
  }
}

export async function updateRestaurant(restaurantId: string, rawData: unknown) {
  const profile = await getPartnerProfile();
  if (!profile) return { success: false, error: "No business profile" };

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { profileId: true },
  });
  if (!restaurant || restaurant.profileId !== profile.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = RestaurantSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation error" };
  }

  try {
    const { destinationId, ...rest } = parsed.data;
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { ...rest, ...(destinationId !== undefined ? { destinationId } : {}) },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("updateRestaurant error:", error);
    return { success: false, error: "Failed to update restaurant." };
  }
}

export async function deleteRestaurant(restaurantId: string) {
  const profile = await getPartnerProfile();
  if (!profile) return { success: false, error: "No business profile" };

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { profileId: true },
  });
  if (!restaurant || restaurant.profileId !== profile.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.restaurant.delete({ where: { id: restaurantId } });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("deleteRestaurant error:", error);
    return { success: false, error: "Failed to delete restaurant." };
  }
}

// ─── Menu CRUD ────────────────────────────────────────────────────────────────

export async function addMenuItem(restaurantId: string, rawData: unknown) {
  const profile = await getPartnerProfile();
  if (!profile) return { success: false, error: "No business profile" };

  const restaurant = await prisma.restaurant.findFirst({
    where: { id: restaurantId, profileId: profile.id },
    select: { id: true },
  });
  if (!restaurant) return { success: false, error: "Unauthorized" };

  const parsed = MenuItemSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation error" };
  }

  try {
    const item = await prisma.restaurantMenu.create({
      data: { ...parsed.data, restaurantId, visible: parsed.data.visible ?? true },
      include: { images: { select: { id: true, url: true }, take: 1 } },
    });
    revalidatePath("/");
    return { success: true, item };
  } catch (error) {
    console.error("addMenuItem error:", error);
    return { success: false, error: "Failed to add menu item." };
  }
}

export async function updateMenuItem(menuItemId: string, rawData: unknown) {
  const profile = await getPartnerProfile();
  if (!profile) return { success: false, error: "No business profile" };

  const item = await prisma.restaurantMenu.findUnique({
    where: { id: menuItemId },
    include: { restaurant: { select: { profileId: true } } },
  });
  if (!item || item.restaurant.profileId !== profile.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = MenuItemSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation error" };
  }

  try {
    await prisma.restaurantMenu.update({
      where: { id: menuItemId },
      data: parsed.data,
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("updateMenuItem error:", error);
    return { success: false, error: "Failed to update menu item." };
  }
}

export async function deleteMenuItem(menuItemId: string) {
  const profile = await getPartnerProfile();
  if (!profile) return { success: false, error: "No business profile" };

  const item = await prisma.restaurantMenu.findUnique({
    where: { id: menuItemId },
    include: { restaurant: { select: { profileId: true } } },
  });
  if (!item || item.restaurant.profileId !== profile.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.restaurantMenu.delete({ where: { id: menuItemId } });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("deleteMenuItem error:", error);
    return { success: false, error: "Failed to delete menu item." };
  }
}

// ─── Hours management ─────────────────────────────────────────────────────────

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export async function saveHours(restaurantId: string, rawHours: unknown[]) {
  const profile = await getPartnerProfile();
  if (!profile) return { success: false, error: "No business profile" };

  const restaurant = await prisma.restaurant.findFirst({
    where: { id: restaurantId, profileId: profile.id },
    select: { id: true },
  });
  if (!restaurant) return { success: false, error: "Unauthorized" };

  const parsed = rawHours.map((h) => HoursSchema.safeParse(h));
  if (parsed.some((r) => !r.success)) {
    return { success: false, error: "Invalid hours data" };
  }

  try {
    // Delete existing hours then recreate — simpler than upsert per day
    await prisma.restaurantHours.deleteMany({ where: { restaurantId } });
    await prisma.restaurantHours.createMany({
      data: parsed.map((r) => ({
        ...(r as { success: true; data: z.infer<typeof HoursSchema> }).data,
        restaurantId,
      })),
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("saveHours error:", error);
    return { success: false, error: "Failed to save hours." };
  }
}

// ─── Image management ─────────────────────────────────────────────────────────

export async function addRestaurantImage(restaurantId: string, url: string) {
  const profile = await getPartnerProfile();
  if (!profile) return { success: false, error: "No business profile" };

  const restaurant = await prisma.restaurant.findFirst({
    where: { id: restaurantId, profileId: profile.id },
    select: { id: true },
  });
  if (!restaurant) return { success: false, error: "Unauthorized" };

  try {
    const image = await prisma.images.create({
      data: { url, restaurantId },
      select: { id: true, url: true },
    });
    revalidatePath("/");
    return { success: true, image };
  } catch (error) {
    return { success: false, error: "Failed to add image." };
  }
}

export async function removeRestaurantImage(imageId: string) {
  const profile = await getPartnerProfile();
  if (!profile) return { success: false, error: "No business profile" };

  const image = await prisma.images.findUnique({
    where: { id: imageId },
    include: { restaurant: { select: { profileId: true } } },
  });
  if (!image || image.restaurant?.profileId !== profile.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.images.delete({ where: { id: imageId } });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to remove image." };
  }
}
