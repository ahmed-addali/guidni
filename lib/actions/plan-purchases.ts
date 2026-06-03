"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createCheckoutSession, verifyPayment } from "@/lib/payments";
import { generateBookingRef } from "@/lib/utils/booking-ref";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ── Platform fee rate (10%) ───────────────────────────────────────────────────
const PLATFORM_FEE_RATE = 0.1;

// ── Initiate purchase — creates payment session, returns paymentUrl ───────────

export async function purchasePlan(
  planId: string,
  locale: string
): Promise<
  | { success: true; paymentUrl: string }
  | { success: false; error: string }
> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false as const, error: "Not authenticated" };

  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    select: { id: true, title: true, duration: true, planType: true, price: true, isPublic: true, destination: { select: { city: true } } },
  });

  if (!plan) return { success: false as const, error: "Plan not found" };
  if (!plan.isPublic) return { success: false as const, error: "Plan is not available" };
  if (plan.planType !== "GUIDE_PAID") return { success: false as const, error: "This plan is free — no purchase needed" };
  if (!plan.price || plan.price <= 0) return { success: false as const, error: "Invalid plan price" };

  // Check already purchased
  const existing = await prisma.planPurchase.findUnique({
    where: { userId_planId: { userId: session.user.id, planId } },
  });
  if (existing) return { success: false as const, error: "You already own this plan" };

  const purchaseRef = generateBookingRef();
  const amountMillimes = plan.price * 1000; // TND → millimes

  const planTitle = plan.title ?? `${plan.duration}-Day Plan`;
  const city = plan.destination?.city ? ` · ${plan.destination.city}` : "";
  const description = `${planTitle}${city}`;

  const successUrl =
    `${APP_URL}/${locale}/planner/${planId}?session_id={SESSION_ID}&purchased=true`;
  const cancelUrl =
    `${APP_URL}/${locale}/planner/${planId}`;

  const checkoutSession = await createCheckoutSession({
    amount: amountMillimes,
    currency: "TND",
    description,
    successUrl,
    cancelUrl,
    userId: session.user.id,
    metadata: {
      type: "PLAN_PURCHASE",
      planId,
      userId: session.user.id,
      purchaseRef,
    },
  });

  return { success: true as const, paymentUrl: checkoutSession.paymentUrl };
}

// ── Complete purchase — called on return from payment page ────────────────────

export async function completePlanPurchase(
  sessionId: string
): Promise<
  | { success: true; alreadyDone: boolean }
  | { success: false; error: string }
> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false as const, error: "Not authenticated" };

  const result = await verifyPayment(sessionId);
  if (!result.paid) return { success: false as const, error: "Payment not completed" };

  const { planId, purchaseRef } = result.metadata;
  if (!planId) return { success: false as const, error: "Invalid session metadata" };

  // Idempotent — if already fulfilled, just return success
  const existing = await prisma.planPurchase.findUnique({
    where: { userId_planId: { userId: session.user.id, planId } },
  });
  if (existing) return { success: true as const, alreadyDone: true };

  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    select: { price: true },
  });
  if (!plan) return { success: false as const, error: "Plan not found" };

  const amount = plan.price ?? 0;
  const platformFee = Math.round(amount * PLATFORM_FEE_RATE);
  const guideEarns = amount - platformFee;

  await prisma.$transaction([
    prisma.planPurchase.create({
      data: {
        purchaseRef: purchaseRef ?? generateBookingRef(),
        amount,
        platformFee,
        guideEarns,
        userId: session.user.id,
        planId,
      },
    }),
    prisma.plan.update({
      where: { id: planId },
      data: { purchaseCount: { increment: 1 } },
    }),
  ]);

  return { success: true as const, alreadyDone: false };
}

// ── Check ownership ───────────────────────────────────────────────────────────

export async function hasPurchasedPlan(planId: string): Promise<boolean> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return false;

  const purchase = await prisma.planPurchase.findUnique({
    where: { userId_planId: { userId: session.user.id, planId } },
  });
  return !!purchase;
}

// ── Guide earnings — all purchases for the current guide's plans ─────────────

export async function getGuideEarnings() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const guide = await prisma.guideProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!guide) return null;

  const purchases = await prisma.planPurchase.findMany({
    where: { plan: { guideId: guide.id } },
    include: {
      plan: {
        select: {
          id: true,
          title: true,
          duration: true,
          destination: { select: { city: true } },
        },
      },
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalEarned  = purchases.reduce((sum, p) => sum + p.guideEarns, 0);
  const totalRevenue = purchases.reduce((sum, p) => sum + p.amount,     0);
  const totalFees    = purchases.reduce((sum, p) => sum + p.platformFee, 0);

  // Per-plan breakdown
  const byPlan: Record<
    string,
    { planId: string; planTitle: string; city: string; count: number; earned: number }
  > = {};
  for (const p of purchases) {
    const key = p.planId;
    if (!byPlan[key]) {
      byPlan[key] = {
        planId:    p.planId,
        planTitle: p.plan.title ?? `${p.plan.duration}-Day Plan`,
        city:      p.plan.destination?.city ?? "",
        count:     0,
        earned:    0,
      };
    }
    byPlan[key].count  += 1;
    byPlan[key].earned += p.guideEarns;
  }

  return {
    purchases,
    totalEarned,
    totalRevenue,
    totalFees,
    byPlan: Object.values(byPlan).sort((a, b) => b.earned - a.earned),
  };
}

// ── Get all purchased plans for the current user ──────────────────────────────

export async function getMyPurchasedPlans() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return [];

  return prisma.planPurchase.findMany({
    where: { userId: session.user.id },
    include: {
      plan: {
        select: {
          id: true, title: true, duration: true, planType: true, price: true, isPublic: true,
          destination: { select: { city: true } },
          guide: { select: { slug: true, displayName: true, avatarUrl: true, isVerified: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
