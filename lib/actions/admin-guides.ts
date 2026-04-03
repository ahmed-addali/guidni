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
