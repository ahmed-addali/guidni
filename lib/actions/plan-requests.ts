"use server";

import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateBookingRef } from "@/lib/utils/booking-ref";
import type { PlanRequestStatus } from "@prisma/client";

// ── Auth helpers ──────────────────────────────────────────────────────────────

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Not authenticated");
  return session.user;
}

async function requireGuide() {
  const user = await requireUser();
  const guide = await prisma.guideProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!guide) throw new Error("Not a guide");
  return { user, guideId: guide.id };
}

// ── Create a custom plan request ─────────────────────────────────────────────

export async function createPlanRequest(input: {
  guideId: string;
  message: string;
  duration: number;
  budget: number;
  groupSize: number;
  interests: string[];
  startDate?: string;
}): Promise<{ success: true; requestId: string } | { success: false; error: string }> {
  const user = await requireUser();

  const guide = await prisma.guideProfile.findUnique({
    where: { id: input.guideId, isActive: true },
    select: { id: true },
  });
  if (!guide) return { success: false as const, error: "Guide not found" };

  // Check for an existing open request from this user to this guide
  const existing = await prisma.planRequest.findFirst({
    where: {
      userId:  user.id,
      guideId: input.guideId,
      status:  { in: ["PENDING", "QUOTE_SENT", "CONFIRMED", "IN_PROGRESS"] },
    },
    select: { id: true },
  });
  if (existing) {
    return { success: false as const, error: "You already have an active request with this guide" };
  }

  const requestRef = `REQ-${generateBookingRef()}`;

  const request = await prisma.planRequest.create({
    data: {
      requestRef,
      message:   input.message.trim(),
      duration:  input.duration,
      budget:    input.budget,
      groupSize: input.groupSize,
      interests: input.interests,
      startDate: input.startDate ?? null,
      userId:    user.id,
      guideId:   input.guideId,
    },
    select: { id: true },
  });

  return { success: true as const, requestId: request.id };
}

// ── Cancel a request (user) ───────────────────────────────────────────────────

export async function cancelPlanRequest(
  requestId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await requireUser();

  const request = await prisma.planRequest.findUnique({
    where: { id: requestId },
    select: { userId: true, status: true },
  });
  if (!request) return { success: false as const, error: "Request not found" };
  if (request.userId !== user.id) return { success: false as const, error: "Unauthorized" };

  const cancellable: PlanRequestStatus[] = ["PENDING", "QUOTE_SENT"];
  if (!cancellable.includes(request.status)) {
    return { success: false as const, error: "Request cannot be cancelled at this stage" };
  }

  await prisma.planRequest.update({
    where: { id: requestId },
    data:  { status: "CANCELLED" },
  });

  return { success: true as const };
}

// ── User: get all my requests ─────────────────────────────────────────────────

export const getMyPlanRequests = cache(async () => {
  const user = await requireUser();

  return prisma.planRequest.findMany({
    where:   { userId: user.id },
    include: {
      guide: {
        select: {
          slug:        true,
          displayName: true,
          avatarUrl:   true,
          isVerified:  true,
          destination: { select: { city: true } },
        },
      },
      resultPlan: { select: { id: true, title: true, duration: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
});

// ── Guide: get all incoming requests ─────────────────────────────────────────

export const getGuideRequests = cache(async () => {
  const { guideId } = await requireGuide();

  return prisma.planRequest.findMany({
    where:   { guideId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      resultPlan: { select: { id: true, title: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
});

// ── Guide: accept with price quote ───────────────────────────────────────────

export async function acceptPlanRequest(
  requestId: string,
  quotePrice: number,
  quoteNote?: string,
  estimatedBudget?: number
): Promise<{ success: true } | { success: false; error: string }> {
  const { guideId } = await requireGuide();

  const request = await prisma.planRequest.findUnique({
    where: { id: requestId },
    select: { guideId: true, status: true },
  });
  if (!request) return { success: false as const, error: "Request not found" };
  if (request.guideId !== guideId) return { success: false as const, error: "Unauthorized" };
  if (request.status !== "PENDING") {
    return { success: false as const, error: "Request is no longer pending" };
  }
  if (quotePrice < 0) return { success: false as const, error: "Price cannot be negative" };

  await prisma.planRequest.update({
    where: { id: requestId },
    data: {
      status: "QUOTE_SENT",
      quotePrice,
      quoteNote:       quoteNote?.trim() || null,
      estimatedBudget: estimatedBudget ?? null,
    },
  });

  return { success: true as const };
}

// ── Guide: decline a request ─────────────────────────────────────────────────

export async function declinePlanRequest(
  requestId: string,
  reason?: string
): Promise<{ success: true } | { success: false; error: string }> {
  const { guideId } = await requireGuide();

  const request = await prisma.planRequest.findUnique({
    where: { id: requestId },
    select: { guideId: true, status: true },
  });
  if (!request) return { success: false as const, error: "Request not found" };
  if (request.guideId !== guideId) return { success: false as const, error: "Unauthorized" };
  if (!["PENDING", "QUOTE_SENT"].includes(request.status)) {
    return { success: false as const, error: "Request cannot be declined at this stage" };
  }

  await prisma.planRequest.update({
    where: { id: requestId },
    data:  { status: "DECLINED", declineNote: reason?.trim() ?? null },
  });

  return { success: true as const };
}

// ── User: confirm the guide's price quote ────────────────────────────────────

export async function confirmPlanRequestQuote(
  requestId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await requireUser();

  const request = await prisma.planRequest.findUnique({
    where: { id: requestId },
    select: { userId: true, status: true },
  });
  if (!request) return { success: false as const, error: "Request not found" };
  if (request.userId !== user.id) return { success: false as const, error: "Unauthorized" };
  if (request.status !== "QUOTE_SENT") {
    return { success: false as const, error: "No quote to confirm" };
  }

  await prisma.planRequest.update({
    where: { id: requestId },
    data:  { status: "CONFIRMED" },
  });

  return { success: true as const };
}

// ── Guide: mark as in-progress ───────────────────────────────────────────────

export async function startPlanRequest(
  requestId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const { guideId } = await requireGuide();

  const request = await prisma.planRequest.findUnique({
    where: { id: requestId },
    select: { guideId: true, status: true },
  });
  if (!request) return { success: false as const, error: "Request not found" };
  if (request.guideId !== guideId) return { success: false as const, error: "Unauthorized" };
  if (request.status !== "CONFIRMED") {
    return { success: false as const, error: "Request must be confirmed before starting" };
  }

  await prisma.planRequest.update({
    where: { id: requestId },
    data:  { status: "IN_PROGRESS" },
  });

  return { success: true as const };
}

// ── Guide: deliver plan to user ──────────────────────────────────────────────

export async function deliverPlanRequest(
  requestId: string,
  planId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const { guideId } = await requireGuide();

  const [request, plan] = await Promise.all([
    prisma.planRequest.findUnique({
      where: { id: requestId },
      select: { guideId: true, status: true, userId: true },
    }),
    prisma.plan.findUnique({ where: { id: planId }, select: { guideId: true } }),
  ]);

  if (!request) return { success: false as const, error: "Request not found" };
  if (request.guideId !== guideId) return { success: false as const, error: "Unauthorized" };
  if (!["IN_PROGRESS", "CHANGES_REQUESTED"].includes(request.status)) {
    return { success: false as const, error: "Request is not in a deliverable state" };
  }
  if (!plan || plan.guideId !== guideId) {
    return { success: false as const, error: "Plan not found or not yours" };
  }

  await prisma.planRequest.update({
    where: { id: requestId },
    data:  { status: "DELIVERED", resultPlanId: planId },
  });

  return { success: true as const };
}

// ── User: request changes ────────────────────────────────────────────────────

export async function requestChanges(
  requestId: string,
  changesNote?: string
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await requireUser();

  const request = await prisma.planRequest.findUnique({
    where: { id: requestId },
    select: { userId: true, status: true },
  });
  if (!request) return { success: false as const, error: "Request not found" };
  if (request.userId !== user.id) return { success: false as const, error: "Unauthorized" };
  if (request.status !== "DELIVERED") {
    return { success: false as const, error: "No delivered plan to request changes on" };
  }

  await prisma.planRequest.update({
    where: { id: requestId },
    data:  { status: "CHANGES_REQUESTED", changesNote: changesNote?.trim() || null },
  });

  return { success: true as const };
}

// ── User: accept and complete ────────────────────────────────────────────────

export async function completePlanRequest(
  requestId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await requireUser();

  const request = await prisma.planRequest.findUnique({
    where: { id: requestId },
    select: { userId: true, status: true, resultPlanId: true, guideId: true, quotePrice: true },
  });
  if (!request) return { success: false as const, error: "Request not found" };
  if (request.userId !== user.id) return { success: false as const, error: "Unauthorized" };
  if (request.status !== "DELIVERED") {
    return { success: false as const, error: "Plan has not been delivered yet" };
  }

  const PLATFORM_FEE_RATE = 0.1;

  await prisma.$transaction(async (tx) => {
    await tx.planRequest.update({
      where: { id: requestId },
      data:  { status: "COMPLETED" },
    });

    // Create a PlanPurchase record to give user access (if paid plan)
    if (request.resultPlanId && (request.quotePrice ?? 0) > 0) {
      const amount      = request.quotePrice!;
      const platformFee = Math.round(amount * PLATFORM_FEE_RATE);
      const guideEarns  = amount - platformFee;

      await tx.planPurchase.upsert({
        where: { userId_planId: { userId: user.id, planId: request.resultPlanId } },
        create: {
          purchaseRef: `REQ-${generateBookingRef()}`,
          amount,
          platformFee,
          guideEarns,
          userId:  user.id,
          planId:  request.resultPlanId,
        },
        update: {},
      });
    }
  });

  return { success: true as const };
}

// ── User: check if they have an active request with a guide (for chat access) ─

export async function hasActiveRequestWithGuide(guideId: string): Promise<boolean> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return false;

    const request = await prisma.planRequest.findFirst({
      where: {
        userId:  session.user.id,
        guideId,
        status:  { notIn: ["CANCELLED", "DECLINED"] },
      },
      select: { id: true },
    });
    return !!request;
  } catch {
    return false;
  }
}

// ── Guide: count pending requests (for sidebar badge) ────────────────────────

export async function getGuidePendingRequestCount(): Promise<number> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return 0;

    const guide = await prisma.guideProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!guide) return 0;

    return prisma.planRequest.count({
      where: { guideId: guide.id, status: { in: ["PENDING", "CONFIRMED"] } },
    });
  } catch {
    return 0;
  }
}
