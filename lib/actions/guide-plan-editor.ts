"use server";

import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPlannerData } from "@/lib/planner/assembler";
import { buildItinerary } from "@/lib/planner/engine";
import type {
  PlanBlock,
  PlanDay,
  PlanItinerary,
  PlanMultiDayBlock,
  PlanItemType,
  LogisticsType,
  TimeSlot,
  TimeRange,
  UserPreferences,
} from "@/lib/planner/types";
import { parsePlanItinerary } from "@/lib/planner/types";
import type { PlanModerationStatus, PlanType } from "@prisma/client";

// ── Auth helpers ──────────────────────────────────────────────────────────────

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Not authenticated");
  return session.user;
}

async function requireGuideOwner(planId: string) {
  const user = await requireUser();

  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    include: { guide: { select: { id: true, userId: true } } },
  });

  if (!plan) throw new Error("Plan not found");
  if (!plan.guide || plan.guide.userId !== user.id) throw new Error("Unauthorized");

  return { user, plan, guideId: plan.guide.id };
}

/** Like requireGuideOwner but also accepts regular-user ownership (non-guide plans). */
async function requirePlanOwner(planId: string) {
  const user = await requireUser();

  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    include: { guide: { select: { id: true, userId: true } } },
  });

  if (!plan) throw new Error("Plan not found");

  const isOwner = plan.guide
    ? plan.guide.userId === user.id   // guide plan — guide owns it
    : plan.userId === user.id;        // user plan — user owns it directly

  if (!isOwner) throw new Error("Unauthorized");

  return { user, plan };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Derive slotType from time range — used as a display hint only. */
function deriveSlotType(start: string, end: string): TimeSlot {
  const [sh, sm] = start.split(":").map(Number);
  const startMins = sh * 60 + (sm ?? 0);
  const [eh, em] = end.split(":").map(Number);
  const endMins = eh * 60 + (em ?? 0);
  const durationMins = endMins - startMins;
  if (durationMins >= 480) return "fullday";
  if (startMins < 12 * 60) return "morning";
  if (startMins < 13 * 60 + 30) return "lunch";
  if (startMins < 18 * 60) return "afternoon";
  return "evening";
}

function newBlockId(prefix = "block") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function readItinerary(plan: { itinerary: unknown }): PlanItinerary {
  return parsePlanItinerary(plan.itinerary);
}

/** @deprecated use readItinerary */
function readDays(plan: { itinerary: unknown }): PlanDay[] {
  return readItinerary(plan).days;
}

// ── Create a new guide plan ───────────────────────────────────────────────────

export async function createGuidePlan(input: {
  destinationId: string;
  duration: number;
  title?: string;
  useAI: boolean;
  interests?: string[];
  requestId?: string;
}): Promise<{ success: true; planId: string } | { success: false; error: string }> {
  try {
    const user = await requireUser();

    const guide = await prisma.guideProfile.findUnique({
      where: { userId: user.id },
      select: { id: true, destinationId: true },
    });
    if (!guide) return { success: false as const, error: "No guide profile found" };

    const destination = await prisma.destination.findUnique({
      where: { id: input.destinationId },
      select: { id: true, city: true, country: true },
    });
    if (!destination) return { success: false as const, error: "Destination not found" };

    let itinerary: PlanItinerary;

    if (input.useAI) {
      const prefs: UserPreferences = {
        destinationId:       input.destinationId,
        destinationName:     `${destination.city}, ${destination.country}`,
        destinationCity:     destination.city,
        duration:            input.duration,
        travelStyle:         "balanced",
        budget:              2,
        groupType:           "friends",
        interests:           (input.interests ?? ["culture", "food_drink"]) as UserPreferences["interests"],
        accommodationType:   "hotel",
        needsAirportPickup:  false,
        needsReturnTransfer: false,
        needsRental:         false,
      };

      const plannerData = await getPlannerData(input.destinationId);
      itinerary = buildItinerary(plannerData, prefs);
    } else {
      itinerary = {
        days: Array.from({ length: input.duration }, (_, i) => ({
          dayNumber: i + 1,
          theme:     `Day ${i + 1}`,
          notes:     "",
          blocks:    [],
        })),
        stays:   [],
        rentals: [],
      };
    }

    const plan = await prisma.plan.create({
      data: {
        title:         input.title ?? null,
        duration:      input.duration,
        preferences:   {},
        itinerary:     itinerary as object,
        isPublic:      false,
        generatedBy:   input.useAI ? "algorithm" : "guide",
        planType:      "GUIDE_FREE" as PlanType,
        userId:        user.id,
        guideId:       guide.id,
        destinationId: input.destinationId,
        ...(input.requestId
          ? { requests: { connect: { id: input.requestId } } }
          : {}),
      },
      select: { id: true },
    });

    return { success: true as const, planId: plan.id };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed to create plan" };
  }
}

// ── Read a plan for editing (ownership-verified) ─────────────────────────────

export const getPlanForEdit = cache(async (planId: string) => {
  const user = await requireUser().catch(() => null);
  if (!user) return null;

  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    include: {
      destination: { select: { id: true, city: true, country: true } },
      guide: {
        select: {
          id: true, userId: true, slug: true, displayName: true,
          destination: { select: { city: true } },
        },
      },
      requests: {
        select: {
          id: true, requestRef: true, status: true,
          user: { select: { id: true, name: true } },
        },
        take: 1,
      },
    },
  });

  if (!plan) return null;
  if (!plan.guide || plan.guide.userId !== user.id) return null;

  return plan;
});

// ── Update plan title ─────────────────────────────────────────────────────────

export async function updatePlanTitle(
  planId: string,
  title: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requirePlanOwner(planId);
    await prisma.plan.update({ where: { id: planId }, data: { title: title.trim() || null } });
    return { success: true as const };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed" };
  }
}

// ── Update plan details (Details tab) ────────────────────────────────────────

export async function updatePlanDetails(
  planId: string,
  input: {
    title?:       string;
    summary?:     string;
    tags?:        string[];
    difficulty?:  string;
    suitableFor?: string[];
    season?:      string[];
  }
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requirePlanOwner(planId);
    await prisma.plan.update({
      where: { id: planId },
      data: {
        ...(input.title       !== undefined && { title:       input.title.trim() || null }),
        ...(input.summary     !== undefined && { summary:     input.summary.trim() || null }),
        ...(input.tags        !== undefined && { tags:        input.tags }),
        ...(input.difficulty  !== undefined && { difficulty:  input.difficulty || null }),
        ...(input.suitableFor !== undefined && { suitableFor: input.suitableFor }),
        ...(input.season      !== undefined && { season:      input.season }),
      },
    });
    return { success: true as const };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed" };
  }
}

// ── Update plan pricing (Pricing tab) ────────────────────────────────────────

export async function updatePlanPricing(
  planId: string,
  input: {
    planType:     "GUIDE_FREE" | "GUIDE_PAID";
    price?:       number;
    previewDays?: number;
  }
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requireGuideOwner(planId);
    if (input.planType === "GUIDE_PAID" && (input.price === undefined || input.price <= 0)) {
      return { success: false as const, error: "A paid plan requires a price greater than 0" };
    }
    await prisma.plan.update({
      where: { id: planId },
      data: {
        planType:    input.planType as PlanType,
        isPaidPlan:  input.planType === "GUIDE_PAID",
        price:       input.planType === "GUIDE_PAID" ? (input.price ?? 0) : 0,
        previewDays: input.planType === "GUIDE_PAID" ? (input.previewDays ?? 1) : 1,
      },
    });
    return { success: true as const };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed" };
  }
}

// ── Submit for review / unpublish (Publish tab) ───────────────────────────────

export async function submitGuidePlanForReview(
  planId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { plan } = await requireGuideOwner(planId);
    if (!plan.title) {
      return { success: false as const, error: "Add a title before submitting for review" };
    }
    const { days } = readItinerary(plan);
    const hasBlocks = days.some((d) => d.blocks && d.blocks.length > 0);
    if (!hasBlocks) {
      return { success: false as const, error: "Add at least one activity before submitting" };
    }
    await prisma.plan.update({
      where: { id: planId },
      data:  { moderationStatus: "PENDING" as PlanModerationStatus },
    });
    return { success: true as const };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function unpublishGuidePlan(
  planId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requireGuideOwner(planId);
    await prisma.plan.update({
      where: { id: planId },
      data:  { isPublic: false, moderationStatus: "PENDING" as PlanModerationStatus },
    });
    return { success: true as const };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed" };
  }
}

// ── Save a guide note on a block ──────────────────────────────────────────────

export async function saveGuideNote(
  planId:  string,
  blockId: string,
  note:    string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { plan } = await requirePlanOwner(planId);
    const itin = readItinerary(plan);
    let found = false;

    const updatedDays = itin.days.map((day) => ({
      ...day,
      blocks: day.blocks.map((b) => {
        if (b.id === blockId) {
          found = true;
          return { ...b, guideNote: note.trim() || undefined };
        }
        return b;
      }),
    }));

    if (!found) return { success: false as const, error: "Block not found" };
    await prisma.plan.update({ where: { id: planId }, data: { itinerary: { ...itin, days: updatedDays } as object } });
    return { success: true as const };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed" };
  }
}

// ── Remove a block from a day ─────────────────────────────────────────────────

export async function removeBlockFromPlan(
  planId:  string,
  blockId: string
): Promise<{ success: true; itinerary: PlanDay[] } | { success: false; error: string }> {
  try {
    const { plan } = await requirePlanOwner(planId);
    const itin = readItinerary(plan);
    const updatedDays = itin.days.map((day) => ({
      ...day,
      blocks: day.blocks.filter((b) => b.id !== blockId),
    }));
    await prisma.plan.update({ where: { id: planId }, data: { itinerary: { ...itin, days: updatedDays } as object } });
    return { success: true as const, itinerary: updatedDays };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed" };
  }
}

/** @deprecated use removeBlockFromPlan */
export const removeSlotFromPlan = removeBlockFromPlan;

// ── Reorder blocks within a day ───────────────────────────────────────────────

export async function reorderBlocksInDay(
  planId:          string,
  dayIndex:        number,
  orderedBlockIds: string[]
): Promise<{ success: true; itinerary: PlanDay[] } | { success: false; error: string }> {
  try {
    const { plan } = await requirePlanOwner(planId);
    const itin = readItinerary(plan);
    if (dayIndex < 0 || dayIndex >= itin.days.length) {
      return { success: false as const, error: "Invalid day index" };
    }
    const blockMap = new Map(itin.days[dayIndex].blocks.map((b) => [b.id, b]));
    const reordered = orderedBlockIds.map((id) => blockMap.get(id)).filter(Boolean) as PlanBlock[];
    const updatedDays = itin.days.map((d, i) => i === dayIndex ? { ...d, blocks: reordered } : d);
    await prisma.plan.update({ where: { id: planId }, data: { itinerary: { ...itin, days: updatedDays } as object } });
    return { success: true as const, itinerary: updatedDays };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed" };
  }
}

/** @deprecated use reorderBlocksInDay */
export const reorderSlotsInDay = reorderBlocksInDay;

// ── Add a block to a day ──────────────────────────────────────────────────────

type AddableItemType = "ACTIVITY" | "ATTRACTION" | "RESTAURANT" | "STAY" | "TRANSFER" | "RENTAL";

export async function addBlockToPlan(
  planId:        string,
  dayIndex:      number,
  itemType:      AddableItemType,
  itemId:        string,
  time?:         { start: string; end: string },
  logisticsType?: LogisticsType
): Promise<{ success: true; itinerary: PlanDay[] } | { success: false; error: string }> {
  try {
    const { plan } = await requirePlanOwner(planId);
    const item = await fetchItem(itemType, itemId);
    if (!item) return { success: false as const, error: "Item not found" };

    const itin = readItinerary(plan);
    if (dayIndex < 0 || dayIndex >= itin.days.length) {
      return { success: false as const, error: "Invalid day index" };
    }

    const newBlock: PlanBlock = {
      id:           newBlockId(),
      item,
      addedByGuide: true,
      ...(time
        ? { time, slotType: deriveSlotType(time.start, time.end) }
        : {}),
      ...(logisticsType ? { logisticsType } : {}),
    };

    const updatedDays = itin.days.map((d, i) =>
      i === dayIndex ? { ...d, blocks: [...d.blocks, newBlock] } : d
    );

    await prisma.plan.update({ where: { id: planId }, data: { itinerary: { ...itin, days: updatedDays } as object } });
    return { success: true as const, itinerary: updatedDays };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed" };
  }
}

/** @deprecated use addBlockToPlan */
export async function addSlotToPlan(
  planId: string, dayIndex: number,
  timeStart: string, timeEnd: string,
  itemType: AddableItemType, itemId: string
) {
  return addBlockToPlan(planId, dayIndex, itemType, itemId, { start: timeStart, end: timeEnd });
}

// ── Add a free-text note block ────────────────────────────────────────────────

export async function addNoteBlockToPlan(
  planId:   string,
  dayIndex: number,
  text:     string,
  time?:    TimeRange
): Promise<{ success: true; itinerary: PlanDay[] } | { success: false; error: string }> {
  try {
    const { plan } = await requirePlanOwner(planId);
    const trimmed = text.trim();
    if (!trimmed) return { success: false as const, error: "Note text is required" };

    const itin = readItinerary(plan);
    if (dayIndex < 0 || dayIndex >= itin.days.length) {
      return { success: false as const, error: "Invalid day index" };
    }

    const newBlock: PlanBlock = {
      id:   newBlockId("note"),
      item: { id: newBlockId("note-item"), type: "NOTE", slug: "", name: trimmed, price: 0, tags: [] },
      addedByGuide: true,
      ...(time ? { time, slotType: deriveSlotType(time.start, time.end) } : {}),
    };

    const updatedDays = itin.days.map((d, i) =>
      i === dayIndex ? { ...d, blocks: [...d.blocks, newBlock] } : d
    );

    await prisma.plan.update({ where: { id: planId }, data: { itinerary: { ...itin, days: updatedDays } as object } });
    return { success: true as const, itinerary: updatedDays };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed" };
  }
}

/** @deprecated use addNoteBlockToPlan */
export async function addNoteSlotToPlan(
  planId: string, dayIndex: number,
  timeStart: string, timeEnd: string, text: string
) {
  return addNoteBlockToPlan(planId, dayIndex, text, { start: timeStart, end: timeEnd });
}

// ── Search for items to add ───────────────────────────────────────────────────

export interface SearchResultItem {
  id:        string;
  type:      PlanItemType;
  name:      string;
  imageUrl:  string | null;
  price:     number;
  location:  string | null;
  rating:    number | null;
  nbReviews: number;
}

export async function searchPlanItems(
  query:         string,
  destinationId: string,
  types:         PlanItemType[] = ["ACTIVITY", "ATTRACTION", "RESTAURANT", "STAY", "TRANSFER", "RENTAL"],
  transferTypes?: ("AIRPORT_TRANSFER" | "TAXI" | "CHAUFFEUR" | "SHUTTLE")[]
): Promise<{ success: true; results: SearchResultItem[] } | { success: false; error: string }> {
  try {
    await requireUser();
    const q = query.trim().toLowerCase();
    const results: SearchResultItem[] = [];

    await Promise.all([
      types.includes("ACTIVITY") ? (async () => {
        const rows = await prisma.activity.findMany({
          where: { destinationId, status: "ACTIVE", ...(q ? { title: { contains: q, mode: "insensitive" } } : {}) },
          select: { id: true, title: true, price: true, location: true, nbReviews: true, images: { take: 1, orderBy: { order: "asc" }, select: { url: true } } },
          take: 8, orderBy: { nbReviews: "desc" },
        });
        rows.forEach((r) => results.push({ id: r.id, type: "ACTIVITY", name: r.title, imageUrl: r.images[0]?.url ?? null, price: r.price ?? 0, location: r.location ?? null, rating: null, nbReviews: r.nbReviews }));
      })() : Promise.resolve(),

      types.includes("ATTRACTION") ? (async () => {
        const rows = await prisma.attraction.findMany({
          where: { destinationId, ...(q ? { title: { contains: q, mode: "insensitive" } } : {}) },
          select: { id: true, title: true, feeAmount: true, location: true, images: { take: 1, orderBy: { order: "asc" }, select: { url: true } } },
          take: 8, orderBy: { id: "desc" },
        });
        rows.forEach((r) => results.push({ id: r.id, type: "ATTRACTION", name: r.title, imageUrl: r.images[0]?.url ?? null, price: r.feeAmount ?? 0, location: r.location ?? null, rating: null, nbReviews: 0 }));
      })() : Promise.resolve(),

      types.includes("RESTAURANT") ? (async () => {
        const rows = await prisma.restaurant.findMany({
          where: { destinationId, ...(q ? { name: { contains: q, mode: "insensitive" } } : {}) },
          select: { id: true, name: true, logo: true, coverPhoto: true, location: true, nbReviews: true },
          take: 8, orderBy: { nbReviews: "desc" },
        });
        rows.forEach((r) => results.push({ id: r.id, type: "RESTAURANT", name: r.name, imageUrl: r.coverPhoto ?? r.logo ?? null, price: 0, location: r.location ?? null, rating: null, nbReviews: r.nbReviews }));
      })() : Promise.resolve(),

      types.includes("STAY") ? (async () => {
        const rows = await prisma.stay.findMany({
          where: { destinationId, approvalStatus: "APPROVED", ...(q ? { title: { contains: q, mode: "insensitive" } } : {}) },
          select: { id: true, title: true, price: true, location: true, nbReviews: true, images: { take: 1, orderBy: { order: "asc" }, select: { url: true } } },
          take: 8, orderBy: { nbReviews: "desc" },
        });
        rows.forEach((r) => results.push({ id: r.id, type: "STAY", name: r.title, imageUrl: r.images[0]?.url ?? null, price: r.price ?? 0, location: r.location ?? null, rating: null, nbReviews: r.nbReviews ?? 0 }));
      })() : Promise.resolve(),

      types.includes("TRANSFER") ? (async () => {
        const rows = await prisma.transfer.findMany({
          where: {
            destinationId, status: "ACTIVE",
            ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
            ...(transferTypes?.length ? { type: { in: transferTypes } } : {}),
          },
          select: { id: true, title: true, pricePerTrip: true, pricePerHour: true, city: true, region: true, images: { take: 1, orderBy: { order: "asc" }, select: { url: true } } },
          take: 8, orderBy: { id: "desc" },
        });
        rows.forEach((r) => results.push({ id: r.id, type: "TRANSFER", name: r.title, imageUrl: r.images[0]?.url ?? null, price: r.pricePerTrip ?? r.pricePerHour ?? 0, location: r.city ?? r.region ?? null, rating: null, nbReviews: 0 }));
      })() : Promise.resolve(),

      types.includes("RENTAL") ? (async () => {
        const rows = await prisma.rental.findMany({
          where: { destinationId, status: "ACTIVE", ...(q ? { title: { contains: q, mode: "insensitive" } } : {}) },
          select: { id: true, title: true, pricePerDay: true, city: true, region: true, images: { take: 1, orderBy: { order: "asc" }, select: { url: true } } },
          take: 8, orderBy: { id: "desc" },
        });
        rows.forEach((r) => results.push({ id: r.id, type: "RENTAL", name: r.title, imageUrl: r.images[0]?.url ?? null, price: r.pricePerDay ?? 0, location: r.city ?? r.region ?? null, rating: null, nbReviews: 0 }));
      })() : Promise.resolve(),
    ]);

    results.sort((a, b) => b.nbReviews - a.nbReviews);
    return { success: true as const, results: results.slice(0, 20) };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Search failed" };
  }
}

// ── Internal: fetch a single item and normalize to PlanItem ──────────────────

async function fetchItem(type: AddableItemType, id: string) {
  if (type === "ACTIVITY") {
    const r = await prisma.activity.findUnique({
      where: { id },
      select: { id: true, title: true, slug: true, price: true, location: true, durationMinutes: true, intensity: true, tags: true, images: { take: 1, orderBy: { order: "asc" }, select: { url: true } } },
    });
    if (!r) return null;
    return { id: r.id, type: "ACTIVITY" as PlanItemType, slug: r.slug, name: r.title, imageUrl: r.images[0]?.url, location: r.location ?? undefined, price: r.price ?? 0, durationMinutes: r.durationMinutes ?? undefined, intensity: (r.intensity?.toLowerCase() ?? "medium") as "low" | "medium" | "high", tags: r.tags ?? [], idealTime: "morning" as const };
  }
  if (type === "ATTRACTION") {
    const r = await prisma.attraction.findUnique({
      where: { id },
      select: { id: true, title: true, slug: true, feeAmount: true, location: true, images: { take: 1, orderBy: { order: "asc" }, select: { url: true } } },
    });
    if (!r) return null;
    return { id: r.id, type: "ATTRACTION" as PlanItemType, slug: r.slug, name: r.title, imageUrl: r.images[0]?.url, location: r.location ?? undefined, price: r.feeAmount ?? 0, tags: [] };
  }
  if (type === "RESTAURANT") {
    const r = await prisma.restaurant.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true, location: true, logo: true, coverPhoto: true },
    });
    if (!r) return null;
    return { id: r.id, type: "RESTAURANT" as PlanItemType, slug: r.slug, name: r.name, imageUrl: r.coverPhoto ?? r.logo ?? undefined, location: r.location ?? undefined, price: 0, tags: [], idealTime: "lunch" as const };
  }
  if (type === "STAY") {
    const r = await prisma.stay.findUnique({
      where: { id },
      select: { id: true, title: true, slug: true, price: true, location: true, images: { take: 1, orderBy: { order: "asc" }, select: { url: true } } },
    });
    if (!r) return null;
    return { id: r.id, type: "STAY" as PlanItemType, slug: r.slug, name: r.title, imageUrl: r.images[0]?.url, location: r.location ?? undefined, price: r.price ?? 0, tags: [] };
  }
  if (type === "TRANSFER") {
    const r = await prisma.transfer.findUnique({
      where: { id },
      select: { id: true, title: true, slug: true, pricePerTrip: true, pricePerHour: true, city: true, region: true, images: { take: 1, orderBy: { order: "asc" }, select: { url: true } } },
    });
    if (!r) return null;
    return { id: r.id, type: "TRANSFER" as PlanItemType, slug: r.slug, name: r.title, imageUrl: r.images[0]?.url ?? undefined, location: r.city ?? r.region ?? undefined, price: r.pricePerTrip ?? r.pricePerHour ?? 0, tags: [] };
  }
  if (type === "RENTAL") {
    const r = await prisma.rental.findUnique({
      where: { id },
      select: { id: true, title: true, slug: true, pricePerDay: true, city: true, region: true, images: { take: 1, orderBy: { order: "asc" }, select: { url: true } } },
    });
    if (!r) return null;
    return { id: r.id, type: "RENTAL" as PlanItemType, slug: r.slug, name: r.title, imageUrl: r.images[0]?.url ?? undefined, location: r.city ?? r.region ?? undefined, price: r.pricePerDay ?? 0, tags: [] };
  }
  return null;
}

// ── Add / remove a day ────────────────────────────────────────────────────────

export async function addDayToPlan(
  planId: string
): Promise<{ success: true; itinerary: PlanDay[] } | { success: false; error: string }> {
  try {
    const { plan } = await requirePlanOwner(planId);
    const itin = readItinerary(plan);
    const newDay: PlanDay = {
      dayNumber: itin.days.length + 1,
      theme:     `Day ${itin.days.length + 1}`,
      notes:     "",
      blocks:    [],
    };
    const updatedDays = [...itin.days, newDay];
    const fullItinerary: PlanItinerary = { ...itin, days: updatedDays };
    await prisma.plan.update({ where: { id: planId }, data: { itinerary: fullItinerary as object, duration: updatedDays.length } });
    return { success: true as const, itinerary: updatedDays };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function removeDayFromPlan(
  planId:   string,
  dayIndex: number
): Promise<{ success: true; itinerary: PlanDay[] } | { success: false; error: string }> {
  try {
    const { plan } = await requirePlanOwner(planId);
    const itin = readItinerary(plan);
    const days = itin.days;
    if (days.length <= 1) return { success: false as const, error: "Cannot remove the last day" };
    if (dayIndex < 0 || dayIndex >= days.length) return { success: false as const, error: "Invalid day index" };
    const updatedDays = days.filter((_, i) => i !== dayIndex).map((d, i) => ({ ...d, dayNumber: i + 1 }));
    const fullItinerary: PlanItinerary = { ...itin, days: updatedDays };
    await prisma.plan.update({ where: { id: planId }, data: { itinerary: fullItinerary as object, duration: updatedDays.length } });
    return { success: true as const, itinerary: updatedDays };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed" };
  }
}

// ── Update day theme / notes ──────────────────────────────────────────────────

export async function updateDayTheme(
  planId: string, dayIndex: number, theme: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { plan } = await requirePlanOwner(planId);
    const itin = readItinerary(plan);
    if (dayIndex < 0 || dayIndex >= itin.days.length) return { success: false as const, error: "Invalid day index" };
    const updatedDays = itin.days.map((d, i) => i === dayIndex ? { ...d, theme: theme.trim() || `Day ${i + 1}` } : d);
    await prisma.plan.update({ where: { id: planId }, data: { itinerary: { ...itin, days: updatedDays } as object } });
    return { success: true as const };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function updateDayNotes(
  planId: string, dayIndex: number, notes: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { plan } = await requirePlanOwner(planId);
    const itin = readItinerary(plan);
    if (dayIndex < 0 || dayIndex >= itin.days.length) return { success: false as const, error: "Invalid day index" };
    const updatedDays = itin.days.map((d, i) => i === dayIndex ? { ...d, notes: notes.trim() } : d);
    await prisma.plan.update({ where: { id: planId }, data: { itinerary: { ...itin, days: updatedDays } as object } });
    return { success: true as const };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed" };
  }
}

// ── Wishlist items for plan editor ────────────────────────────────────────────

export async function getWishlistForPlanEditor(
  destinationId: string
): Promise<{ success: true; results: SearchResultItem[] } | { success: false; error: string }> {
  try {
    const user = await requireUser();
    const wishlistItems = await prisma.wishlist.findMany({
      where: { userId: user.id, relationType: { in: ["ACTIVITY", "RESTAURANT", "STAY"] } },
    });
    if (wishlistItems.length === 0) return { success: true as const, results: [] };

    const activityIds   = wishlistItems.filter((i) => i.relationType === "ACTIVITY").map((i) => i.relationId);
    const restaurantIds = wishlistItems.filter((i) => i.relationType === "RESTAURANT").map((i) => i.relationId);
    const stayIds       = wishlistItems.filter((i) => i.relationType === "STAY").map((i) => i.relationId);
    const results: SearchResultItem[] = [];

    await Promise.all([
      activityIds.length > 0 ? (async () => {
        const rows = await prisma.activity.findMany({ where: { id: { in: activityIds }, destinationId, status: "ACTIVE" }, select: { id: true, title: true, price: true, location: true, nbReviews: true, images: { take: 1, orderBy: { order: "asc" }, select: { url: true } } }, orderBy: { nbReviews: "desc" } });
        rows.forEach((r) => results.push({ id: r.id, type: "ACTIVITY", name: r.title, imageUrl: r.images[0]?.url ?? null, price: r.price ?? 0, location: r.location ?? null, rating: null, nbReviews: r.nbReviews }));
      })() : Promise.resolve(),
      restaurantIds.length > 0 ? (async () => {
        const rows = await prisma.restaurant.findMany({ where: { id: { in: restaurantIds }, destinationId }, select: { id: true, name: true, logo: true, coverPhoto: true, location: true, nbReviews: true }, orderBy: { nbReviews: "desc" } });
        rows.forEach((r) => results.push({ id: r.id, type: "RESTAURANT", name: r.name, imageUrl: r.coverPhoto ?? r.logo ?? null, price: 0, location: r.location ?? null, rating: null, nbReviews: r.nbReviews }));
      })() : Promise.resolve(),
      stayIds.length > 0 ? (async () => {
        const rows = await prisma.stay.findMany({ where: { id: { in: stayIds }, destinationId, approvalStatus: "APPROVED" }, select: { id: true, title: true, price: true, location: true, nbReviews: true, images: { take: 1, orderBy: { order: "asc" }, select: { url: true } } }, orderBy: { nbReviews: "desc" } });
        rows.forEach((r) => results.push({ id: r.id, type: "STAY", name: r.title, imageUrl: r.images[0]?.url ?? null, price: r.price ?? 0, location: r.location ?? null, rating: null, nbReviews: r.nbReviews ?? 0 }));
      })() : Promise.resolve(),
    ]);

    return { success: true as const, results };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed" };
  }
}

// ── Shopping picks ────────────────────────────────────────────────────────────

export interface ShopSearchResult {
  id:       string;
  slug:     string;
  name:     string;
  category: string;
  imageUrl: string | null;
}

export interface ProductSearchResult {
  id:       string;
  slug:     string;
  name:     string;
  price:    number;
  imageUrl: string | null;
}

export async function searchShopsForPlanEditor(
  query: string, destinationId: string
): Promise<{ success: true; results: ShopSearchResult[] } | { success: false; error: string }> {
  try {
    await requireUser();
    const q = query.trim();
    const rows = await prisma.shop.findMany({
      where: { destinationId, status: "ACTIVE", ...(q ? { name: { contains: q, mode: "insensitive" } } : {}) },
      select: { id: true, slug: true, name: true, category: true, coverPhoto: true, logo: true },
      take: 20, orderBy: { nbReviews: "desc" },
    });
    return { success: true as const, results: rows.map((r) => ({ id: r.id, slug: r.slug, name: r.name, category: r.category, imageUrl: r.coverPhoto ?? r.logo ?? null })) };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function getShopProductsForPlanEditor(
  shopId: string
): Promise<{ success: true; products: ProductSearchResult[] } | { success: false; error: string }> {
  try {
    await requireUser();
    const rows = await prisma.product.findMany({
      where: { shopId, stock: { gt: 0 } },
      select: { id: true, slug: true, name: true, price: true, images: { take: 1, orderBy: { order: "asc" }, select: { url: true } } },
      take: 30, orderBy: { featured: "desc" },
    });
    return { success: true as const, products: rows.map((r) => ({ id: r.id, slug: r.slug, name: r.name, price: r.price, imageUrl: r.images[0]?.url ?? null })) };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function addShopPickToPlanDay(
  planId: string, dayIndex: number,
  shopPick: import("@/lib/planner/types").PlanShopSuggestion
): Promise<{ success: true; itinerary: PlanDay[] } | { success: false; error: string }> {
  try {
    const { plan } = await requirePlanOwner(planId);
    const itin = readItinerary(plan);
    if (dayIndex < 0 || dayIndex >= itin.days.length) return { success: false as const, error: "Invalid day index" };
    const updatedDays = itin.days.map((d, i) => {
      if (i !== dayIndex) return d;
      const existing = d.shopping?.shops ?? [];
      return { ...d, shopping: { shops: [...existing.filter((s) => s.shopId !== shopPick.shopId), shopPick] } };
    });
    await prisma.plan.update({ where: { id: planId }, data: { itinerary: { ...itin, days: updatedDays } as object } });
    return { success: true as const, itinerary: updatedDays };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function removeShopPickFromPlanDay(
  planId: string, dayIndex: number, shopId: string
): Promise<{ success: true; itinerary: PlanDay[] } | { success: false; error: string }> {
  try {
    const { plan } = await requirePlanOwner(planId);
    const itin = readItinerary(plan);
    if (dayIndex < 0 || dayIndex >= itin.days.length) return { success: false as const, error: "Invalid day index" };
    const updatedDays = itin.days.map((d, i) => {
      if (i !== dayIndex) return d;
      const shops = (d.shopping?.shops ?? []).filter((s) => s.shopId !== shopId);
      if (shops.length > 0) return { ...d, shopping: { shops } };
      const { shopping: _s, ...rest } = d;
      void _s;
      return rest as PlanDay;
    });
    await prisma.plan.update({ where: { id: planId }, data: { itinerary: { ...itin, days: updatedDays } as object } });
    return { success: true as const, itinerary: updatedDays };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed" };
  }
}

// ── Multi-day block actions (stays & rentals) ─────────────────────────────────

function newMultiDayBlockId(prefix = "mdb") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function addStayToPlan(
  planId:  string,
  stayId:  string,
  fromDay: number,
  toDay:   number,
  note?:   string
): Promise<{ success: true; itinerary: PlanItinerary } | { success: false; error: string }> {
  try {
    const { plan } = await requirePlanOwner(planId);
    const item = await fetchItem("STAY", stayId);
    if (!item) return { success: false as const, error: "Stay not found" };

    const itin = readItinerary(plan);
    const newBlock: PlanMultiDayBlock = {
      id:      newMultiDayBlockId("stay"),
      item,
      fromDay,
      toDay,
      ...(note?.trim() ? { note: note.trim() } : {}),
    };
    const updated: PlanItinerary = { ...itin, stays: [...itin.stays, newBlock] };
    await prisma.plan.update({ where: { id: planId }, data: { itinerary: updated as object } });
    return { success: true as const, itinerary: updated };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function removeStayFromPlan(
  planId:  string,
  blockId: string
): Promise<{ success: true; itinerary: PlanItinerary } | { success: false; error: string }> {
  try {
    const { plan } = await requirePlanOwner(planId);
    const itin = readItinerary(plan);
    const updated: PlanItinerary = { ...itin, stays: itin.stays.filter((s) => s.id !== blockId) };
    await prisma.plan.update({ where: { id: planId }, data: { itinerary: updated as object } });
    return { success: true as const, itinerary: updated };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function addRentalToPlan(
  planId:   string,
  rentalId: string,
  fromDay:  number,
  toDay:    number,
  note?:    string
): Promise<{ success: true; itinerary: PlanItinerary } | { success: false; error: string }> {
  try {
    const { plan } = await requirePlanOwner(planId);
    const item = await fetchItem("RENTAL", rentalId);
    if (!item) return { success: false as const, error: "Rental not found" };

    const itin = readItinerary(plan);
    const newBlock: PlanMultiDayBlock = {
      id:      newMultiDayBlockId("rental"),
      item,
      fromDay,
      toDay,
      ...(note?.trim() ? { note: note.trim() } : {}),
    };
    const updated: PlanItinerary = { ...itin, rentals: [...itin.rentals, newBlock] };
    await prisma.plan.update({ where: { id: planId }, data: { itinerary: updated as object } });
    return { success: true as const, itinerary: updated };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function removeRentalFromPlan(
  planId:  string,
  blockId: string
): Promise<{ success: true; itinerary: PlanItinerary } | { success: false; error: string }> {
  try {
    const { plan } = await requirePlanOwner(planId);
    const itin = readItinerary(plan);
    const updated: PlanItinerary = { ...itin, rentals: itin.rentals.filter((r) => r.id !== blockId) };
    await prisma.plan.update({ where: { id: planId }, data: { itinerary: updated as object } });
    return { success: true as const, itinerary: updated };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function updateMultiDayBlockNote(
  planId:  string,
  blockId: string,
  note:    string,
  kind:    "stay" | "rental"
): Promise<{ success: true; itinerary: PlanItinerary } | { success: false; error: string }> {
  try {
    const { plan } = await requirePlanOwner(planId);
    const itin = readItinerary(plan);
    const trimmed = note.trim();
    let found = false;

    const patch = (arr: PlanMultiDayBlock[]) =>
      arr.map((b) => {
        if (b.id === blockId) {
          found = true;
          return { ...b, note: trimmed || undefined };
        }
        return b;
      });

    const updated: PlanItinerary = kind === "stay"
      ? { ...itin, stays: patch(itin.stays) }
      : { ...itin, rentals: patch(itin.rentals) };

    if (!found) return { success: false as const, error: "Block not found" };
    await prisma.plan.update({ where: { id: planId }, data: { itinerary: updated as object } });
    return { success: true as const, itinerary: updated };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed" };
  }
}
