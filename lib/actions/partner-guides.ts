"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GuideProfileSchema, GuidePlanPublishSchema } from "@/lib/validations/guide";
import type { GuideProfileInput, GuidePlanPublishInput } from "@/lib/validations/guide";

// ─── helpers ────────────────────────────────────────────────

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

async function requireGuideProfile(userId: string) {
  const guide = await prisma.guideProfile.findUnique({ where: { userId } });
  if (!guide) return null;
  return guide;
}

/** Slugify a display name; append random suffix for uniqueness. */
function makeSlug(name: string, suffix?: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return suffix ? `${base}-${suffix}` : base;
}

async function uniqueGuideSlug(displayName: string): Promise<string> {
  let slug = makeSlug(displayName);
  const existing = await prisma.guideProfile.findUnique({ where: { slug } });
  if (!existing) return slug;
  const suffix = Math.random().toString(36).slice(2, 6);
  return makeSlug(displayName, suffix);
}

// ─────────────────────────────────────────────────────────────
// Profile CRUD
// ─────────────────────────────────────────────────────────────

export async function getMyGuideProfile() {
  const session = await getSession();
  if (!session?.user) return null;
  return prisma.guideProfile.findUnique({
    where: { userId: session.user.id },
    include: { destination: { select: { id: true, city: true, country: true, slug: true } } },
  });
}

export async function createGuideProfile(
  raw: GuideProfileInput
): Promise<{ success: true; data: { slug: string } } | { success: false; error: string }> {
  const session = await getSession();
  if (!session?.user) return { success: false as const, error: "Not authenticated" };

  const parsed = GuideProfileSchema.safeParse(raw);
  if (!parsed.success) return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid data" };

  const existing = await prisma.guideProfile.findUnique({ where: { userId: session.user.id } });
  if (existing) return { success: false as const, error: "Guide profile already exists" };

  const slug = await uniqueGuideSlug(parsed.data.displayName);

  const guide = await prisma.guideProfile.create({
    data: {
      ...parsed.data,
      avatarUrl:  parsed.data.avatarUrl  || null,
      coverUrl:   parsed.data.coverUrl   || null,
      website:    parsed.data.website    || null,
      slug,
      userId: session.user.id,
    },
  });
  return { success: true as const, data: { slug: guide.slug } };
}

export async function updateGuideProfile(
  raw: GuideProfileInput
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await getSession();
  if (!session?.user) return { success: false as const, error: "Not authenticated" };

  const parsed = GuideProfileSchema.safeParse(raw);
  if (!parsed.success) return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid data" };

  const guide = await requireGuideProfile(session.user.id);
  if (!guide) return { success: false as const, error: "No guide profile found" };

  await prisma.guideProfile.update({
    where: { id: guide.id },
    data: {
      ...parsed.data,
      avatarUrl: parsed.data.avatarUrl || null,
      coverUrl:  parsed.data.coverUrl  || null,
      website:   parsed.data.website   || null,
    },
  });
  return { success: true as const };
}

// ─────────────────────────────────────────────────────────────
// Guide plan management
// ─────────────────────────────────────────────────────────────

export async function getMyGuidePlans() {
  const session = await getSession();
  if (!session?.user) return [];

  const guide = await requireGuideProfile(session.user.id);
  if (!guide) return [];

  return prisma.plan.findMany({
    where: { guideId: guide.id },
    select: {
      id:           true,
      title:        true,
      duration:     true,
      planType:     true,
      isPublic:     true,
      price:        true,
      purchaseCount:true,
      viewCount:    true,
      summary:      true,
      tags:         true,
      difficulty:   true,
      suitableFor:  true,
      season:       true,
      previewDays:  true,
      preferences:  true,
      createdAt:    true,
      destination:  { select: { city: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMyGuidePlanById(planId: string) {
  const session = await getSession();
  if (!session?.user) return null;

  const guide = await requireGuideProfile(session.user.id);
  if (!guide) return null;

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || plan.guideId !== guide.id) return null;
  return plan;
}

export async function publishGuidePlan(
  planId: string,
  raw: GuidePlanPublishInput
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await getSession();
  if (!session?.user) return { success: false as const, error: "Not authenticated" };

  const parsed = GuidePlanPublishSchema.safeParse(raw);
  if (!parsed.success) return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid data" };

  const guide = await requireGuideProfile(session.user.id);
  if (!guide) return { success: false as const, error: "No guide profile" };

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || plan.userId !== session.user.id)
    return { success: false as const, error: "Plan not found" };

  // For 26a only GUIDE_FREE is allowed (26b adds GUIDE_PAID)
  if (parsed.data.planType === "GUIDE_PAID")
    return { success: false as const, error: "Paid plans are not available yet" };

  await prisma.$transaction([
    prisma.plan.update({
      where: { id: planId },
      data: {
        planType:     parsed.data.planType,
        isPublic:     true,
        generatedBy:  "guide",
        summary:      parsed.data.summary,
        tags:         parsed.data.tags,
        difficulty:   parsed.data.difficulty ?? null,
        suitableFor:  parsed.data.suitableFor,
        season:       parsed.data.season ?? null,
        previewDays:  parsed.data.previewDays,
        price:        0,
        isPaidPlan:   false,
        guideId:      guide.id,
      },
    }),
    prisma.guideProfile.update({
      where: { id: guide.id },
      data: { planCount: { increment: 1 } },
    }),
  ]);

  return { success: true as const };
}

export async function unpublishGuidePlan(
  planId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await getSession();
  if (!session?.user) return { success: false as const, error: "Not authenticated" };

  const guide = await requireGuideProfile(session.user.id);
  if (!guide) return { success: false as const, error: "No guide profile" };

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || plan.guideId !== guide.id)
    return { success: false as const, error: "Plan not found" };

  await prisma.$transaction([
    prisma.plan.update({
      where: { id: planId },
      data: {
        planType:  "USER_SAVED",
        isPublic:  false,
        guideId:   null,
      },
    }),
    prisma.guideProfile.update({
      where: { id: guide.id },
      data: { planCount: { decrement: 1 } },
    }),
  ]);

  return { success: true as const };
}

export async function updateGuidePlanMeta(
  planId: string,
  data: Partial<{
    summary: string;
    tags: string[];
    difficulty: string;
    suitableFor: string[];
    season: string;
    previewDays: number;
    title: string;
  }>
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await getSession();
  if (!session?.user) return { success: false as const, error: "Not authenticated" };

  const guide = await requireGuideProfile(session.user.id);
  if (!guide) return { success: false as const, error: "No guide profile" };

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || plan.guideId !== guide.id)
    return { success: false as const, error: "Plan not found" };

  await prisma.plan.update({ where: { id: planId }, data });
  return { success: true as const };
}

/** Add or update a guide note on a specific slot in the itinerary JSON. */
export async function addGuideNoteToSlot(
  planId: string,
  slotId: string,
  note: string
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await getSession();
  if (!session?.user) return { success: false as const, error: "Not authenticated" };

  const guide = await requireGuideProfile(session.user.id);
  if (!guide) return { success: false as const, error: "No guide profile" };

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || plan.guideId !== guide.id)
    return { success: false as const, error: "Plan not found" };

  // Mutate the itinerary JSON to add guideNote to the target slot
  const itinerary = plan.itinerary as Array<{
    dayNumber: number;
    slots: Array<{ id: string; guideNote?: string }>;
    [key: string]: unknown;
  }>;

  let found = false;
  const updated = itinerary.map((day) => ({
    ...day,
    slots: day.slots.map((slot) => {
      if (slot.id === slotId) {
        found = true;
        return { ...slot, guideNote: note || undefined };
      }
      return slot;
    }),
  }));

  if (!found) return { success: false as const, error: "Slot not found" };

  await prisma.plan.update({ where: { id: planId }, data: { itinerary: updated } });
  return { success: true as const };
}
