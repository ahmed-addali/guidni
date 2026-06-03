"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "ADMIN")
    throw new Error("Unauthorized");
  return session.user;
}

export async function getAllGuidesAdmin() {
  await requireAdmin();
  return prisma.guideProfile.findMany({
    include: {
      user:        { select: { email: true } },
      destination: { select: { city: true } },
      _count:      { select: { plans: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function setGuideVerification(
  guideId: string,
  isVerified: boolean
): Promise<{ success: true } | { success: false; error: string }> {
  await requireAdmin();
  await prisma.guideProfile.update({ where: { id: guideId }, data: { isVerified } });
  return { success: true as const };
}

export async function setGuideFeatured(
  guideId: string,
  isFeatured: boolean
): Promise<{ success: true } | { success: false; error: string }> {
  await requireAdmin();
  await prisma.guideProfile.update({ where: { id: guideId }, data: { isFeatured } });
  return { success: true as const };
}

export async function setGuideActive(
  guideId: string,
  isActive: boolean
): Promise<{ success: true } | { success: false; error: string }> {
  await requireAdmin();
  await prisma.guideProfile.update({ where: { id: guideId }, data: { isActive } });
  return { success: true as const };
}

export async function reviewGuideVerification(
  guideId: string,
  decision: "APPROVED" | "REJECTED",
  reason?: string
): Promise<{ success: true } | { success: false; error: string }> {
  await requireAdmin();
  await prisma.guideProfile.update({
    where: { id: guideId },
    data: {
      verificationStatus: decision,
      isVerified: decision === "APPROVED",
    },
  });
  return { success: true as const };
}

export async function getVerificationQueue() {
  await requireAdmin();
  return prisma.guideProfile.findMany({
    where: { verificationStatus: "PENDING_REVIEW" },
    include: {
      user:        { select: { email: true } },
      destination: { select: { city: true } },
      _count:      { select: { plans: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function reviewGuidePlan(
  planId: string,
  decision: "APPROVED" | "REJECTED" | "CHANGES_REQUESTED",
  reason?: string
): Promise<{ success: true } | { success: false; error: string }> {
  await requireAdmin();
  await prisma.plan.update({
    where: { id: planId },
    data: {
      moderationStatus: decision,
      // Auto-publish on approval, auto-unpublish on rejection
      ...(decision === "APPROVED" ? { isPublic: true  } : {}),
      ...(decision === "REJECTED" ? { isPublic: false } : {}),
    },
  });
  return { success: true as const };
}

export async function getModerationQueue() {
  await requireAdmin();
  return prisma.plan.findMany({
    where: {
      planType:         { in: ["GUIDE_FREE", "GUIDE_PAID"] },
      moderationStatus: "PENDING",
    },
    select: {
      id: true, title: true, duration: true, planType: true,
      isPublic: true, price: true, summary: true, createdAt: true,
      destination: { select: { city: true } },
      guide: { select: { slug: true, displayName: true, isVerified: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getAllGuidePlansAdmin() {
  await requireAdmin();
  return prisma.plan.findMany({
    where: { planType: { in: ["GUIDE_FREE", "GUIDE_PAID"] } },
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
      createdAt:    true,
      destination:  { select: { city: true } },
      guide: {
        select: { slug: true, displayName: true, isVerified: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function adminForceUnpublishPlan(
  planId: string
): Promise<{ success: true } | { success: false; error: string }> {
  await requireAdmin();
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) return { success: false as const, error: "Plan not found" };

  await prisma.$transaction([
    prisma.plan.update({
      where: { id: planId },
      data: { planType: "USER_SAVED", isPublic: false, guideId: null },
    }),
    ...(plan.guideId
      ? [
          prisma.guideProfile.update({
            where: { id: plan.guideId },
            data: { planCount: { decrement: 1 } },
          }),
        ]
      : []),
  ]);
  return { success: true as const };
}

export async function adminFeatureGuidePlan(
  planId: string,
  featured: boolean
): Promise<{ success: true } | { success: false; error: string }> {
  await requireAdmin();
  // Use viewCount boost as a "featured" proxy for guide plans (or add a dedicated field in 26b)
  await prisma.plan.update({
    where: { id: planId },
    data: { viewCount: featured ? 9999 : 0 },
  });
  return { success: true as const };
}

// ── Admin: all plan purchases (26B-6) ─────────────────────────────────────────

export async function getAdminPlanPurchases(filters?: {
  guideId?: string;
  from?: string;
  to?: string;
}) {
  await requireAdmin();

  return prisma.planPurchase.findMany({
    where: {
      ...(filters?.guideId && { plan: { guideId: filters.guideId } }),
      ...(filters?.from && { createdAt: { gte: new Date(filters.from) } }),
      ...(filters?.to   && { createdAt: { lte: new Date(filters.to)   } }),
    },
    include: {
      plan: {
        select: {
          id:    true,
          title: true,
          duration: true,
          guide: { select: { id: true, slug: true, displayName: true } },
          destination: { select: { city: true } },
        },
      },
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take:    500,
  });
}

export async function getPlannerStats() {
  await requireAdmin();

  const [
    totalPlans,
    userSavedPlans,
    guideFree,
    guidePaid,
    totalViews,
    topDestinations,
    topPlans,
    recentPlans,
    totalGuides,
    verifiedGuides,
    featuredGuides,
  ] = await Promise.all([
    prisma.plan.count(),
    prisma.plan.count({ where: { planType: "USER_SAVED" } }),
    prisma.plan.count({ where: { planType: "GUIDE_FREE" } }),
    prisma.plan.count({ where: { planType: "GUIDE_PAID" } }),
    prisma.plan.aggregate({ _sum: { viewCount: true } }),
    prisma.plan.groupBy({
      by: ["destinationId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
    prisma.plan.findMany({
      where: { isPublic: true },
      orderBy: { viewCount: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        duration: true,
        planType: true,
        viewCount: true,
        isPublic: true,
        destination: { select: { city: true } },
        guide: { select: { displayName: true, slug: true } },
      },
    }),
    prisma.plan.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        duration: true,
        planType: true,
        createdAt: true,
        destination: { select: { city: true } },
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.guideProfile.count(),
    prisma.guideProfile.count({ where: { isVerified: true } }),
    prisma.guideProfile.count({ where: { isFeatured: true } }),
  ]);

  // Resolve destination names for the groupBy result
  const destIds = topDestinations
    .map((d) => d.destinationId)
    .filter((id): id is string => id !== null);
  const destNames = destIds.length
    ? await prisma.destination.findMany({
        where: { id: { in: destIds } },
        select: { id: true, city: true },
      })
    : [];
  const destMap = Object.fromEntries(destNames.map((d) => [d.id, d.city]));

  return {
    totals: {
      plans:       totalPlans,
      userSaved:   userSavedPlans,
      guideFree,
      guidePaid,
      totalViews:  totalViews._sum.viewCount ?? 0,
    },
    guides: {
      total:    totalGuides,
      verified: verifiedGuides,
      featured: featuredGuides,
    },
    topDestinations: topDestinations.map((d) => ({
      city:  d.destinationId ? (destMap[d.destinationId] ?? "Unknown") : "No destination",
      count: d._count.id,
    })),
    topPlans:    topPlans.map((p) => ({
      ...p,
      createdAt: undefined,
    })),
    recentPlans: recentPlans.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
    })),
  };
}
