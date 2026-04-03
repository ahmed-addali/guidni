"use server";

import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPlannerData } from "@/lib/planner/assembler";
import { scoreItem, scoreRestaurant } from "@/lib/planner/engine";
import type { PlanDay, PlanItem, PlanItemType, UserPreferences } from "@/lib/planner/types";

// ─────────────────────────────────────────────────────────────
// Re-export assembler for use in pages
// ─────────────────────────────────────────────────────────────

export { getPlannerData };

// ─────────────────────────────────────────────────────────────
// Save a generated plan
// ─────────────────────────────────────────────────────────────

export async function savePlan(input: {
  title?: string;
  preferences: UserPreferences;
  itinerary: PlanDay[];
  destinationId: string;
}): Promise<{ success: true; data: { id: string } } | { success: false; error: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false as const, error: "Not authenticated" };

  try {
    const plan = await prisma.plan.create({
      data: {
        title: input.title ?? null,
        duration: input.preferences.duration,
        preferences: input.preferences as object,
        itinerary: input.itinerary as object,
        isPublic: false,
        generatedBy: "algorithm",
        userId: session.user.id,
        destinationId: input.destinationId,
      },
    });
    return { success: true as const, data: { id: plan.id } };
  } catch {
    return { success: false as const, error: "Failed to save plan" };
  }
}

// ─────────────────────────────────────────────────────────────
// Get a single plan (ownership or isPublic)
// ─────────────────────────────────────────────────────────────

export const getPlan = cache(async (planId: string) => {
  const session = await auth.api.getSession({ headers: await headers() });

  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    include: {
      destination: { select: { id: true, slug: true, city: true, country: true } },
      guide: {
        select: { slug: true, displayName: true, avatarUrl: true, isVerified: true },
      },
    },
  });

  if (!plan) return null;
  if (!plan.isPublic && plan.userId !== session?.user?.id) return null;

  // Fire-and-forget view count increment
  prisma.plan
    .update({ where: { id: planId }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  return plan;
});

// ─────────────────────────────────────────────────────────────
// List user's saved plans
// ─────────────────────────────────────────────────────────────

export const getUserPlans = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return [];

  return prisma.plan.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      title: true,
      duration: true,
      isPublic: true,
      planType: true,
      viewCount: true,
      createdAt: true,
      preferences: true,
      destination: { select: { city: true, slug: true, country: true } },
    },
    orderBy: { createdAt: "desc" },
  });
});

// ─────────────────────────────────────────────────────────────
// Delete a plan
// ─────────────────────────────────────────────────────────────

export async function deletePlan(
  planId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false as const, error: "Not authenticated" };

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || plan.userId !== session.user.id)
    return { success: false as const, error: "Not found" };

  await prisma.plan.delete({ where: { id: planId } });
  return { success: true as const };
}

// ─────────────────────────────────────────────────────────────
// Update plan (title, isPublic, or itinerary after drag-drop)
// ─────────────────────────────────────────────────────────────

export async function updatePlan(
  planId: string,
  data: { title?: string; isPublic?: boolean; itinerary?: PlanDay[] }
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false as const, error: "Not authenticated" };

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || plan.userId !== session.user.id)
    return { success: false as const, error: "Not found" };

  await prisma.plan.update({
    where: { id: planId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
      ...(data.itinerary !== undefined && { itinerary: data.itinerary as object }),
    },
  });
  return { success: true as const };
}

// ─────────────────────────────────────────────────────────────
// Swap alternatives — top N items of same type not in plan
// ─────────────────────────────────────────────────────────────

export async function getSwapAlternatives(input: {
  itemType: PlanItemType;
  slotType: "morning" | "lunch" | "afternoon" | "evening";
  currentItemId: string;
  destinationId: string;
  preferences: UserPreferences;
  existingItemIds: string[];
}): Promise<{ success: true; data: PlanItem[] } | { success: false; error: string }> {
  try {
    const plannerData = await getPlannerData(input.destinationId);

    const pool: PlanItem[] = (() => {
      switch (input.itemType) {
        case "ACTIVITY":    return plannerData.activities;
        case "ATTRACTION":  return plannerData.attractions;
        case "RESTAURANT":  return plannerData.restaurants;
        case "TRANSFER":    return plannerData.transfers;
        case "RENTAL":      return plannerData.rentals;
        default:            return plannerData.activities;
      }
    })();

    const excluded = new Set([input.currentItemId, ...input.existingItemIds]);

    const scored = pool
      .filter((item) => !excluded.has(item.id))
      .map((item) => ({
        ...item,
        _score:
          item.type === "RESTAURANT"
            ? scoreRestaurant(
                item,
                input.preferences,
                input.slotType === "lunch" ? "lunch" : "evening"
              )
            : scoreItem(item, input.preferences),
      }))
      .sort((a, b) => b._score - a._score)
      .slice(0, 6);

    return { success: true as const, data: scored };
  } catch {
    return { success: false as const, error: "Failed to load alternatives" };
  }
}
