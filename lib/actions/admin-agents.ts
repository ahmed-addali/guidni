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

export async function getAllAgentsAdmin() {
  await requireAdmin();
  return prisma.agentProfile.findMany({
    include: {
      user:        { select: { email: true } },
      destination: { select: { city: true } },
      _count:      { select: { invitations: true, earnings: true, referrals: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function setAgentVerification(
  agentId: string,
  isVerified: boolean
): Promise<{ success: true } | { success: false; error: string }> {
  await requireAdmin();
  await prisma.agentProfile.update({
    where: { id: agentId },
    data:  {
      isVerified,
      verifiedAt: isVerified ? new Date() : null,
    },
  });
  return { success: true as const };
}

export async function setAgentActive(
  agentId: string,
  isActive: boolean
): Promise<{ success: true } | { success: false; error: string }> {
  await requireAdmin();

  await prisma.agentProfile.update({
    where: { id: agentId },
    data:  { isActive },
  });

  // When deactivating: cancel all pending invitations and pending points
  if (!isActive) {
    await Promise.all([
      prisma.agentInvitation.updateMany({
        where: { agentId, status: { in: ["PENDING", "OPENED"] } },
        data:  { status: "CANCELLED" },
      }),
      prisma.agentPoint.updateMany({
        where: { agentId, status: "CONFIRMED" },
        data:  { status: "CANCELLED" },
      }),
    ]);
  }

  return { success: true as const };
}

// ── Payout queue ──────────────────────────────────────────────────────────────

export async function getPendingPayoutsAdmin() {
  await requireAdmin();

  const [earningPayouts, redemptions] = await Promise.all([
    // Agents with PAID earnings in the last 30 days (recently requested payouts)
    prisma.agentEarning.findMany({
      where:   { status: "PAID" },
      include: {
        agent: {
          select: { id: true, displayName: true, pseudonym: true, user: { select: { email: true } } },
        },
      },
      orderBy: { paidAt: "desc" },
      take: 100,
    }),
    prisma.agentRedemption.findMany({
      where:   { status: { in: ["PENDING", "PROCESSING"] } },
      include: {
        agent: {
          select: { id: true, displayName: true, pseudonym: true, user: { select: { email: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { earningPayouts, redemptions };
}

export async function markRedemptionPaid(
  redemptionId: string,
  note?: string
): Promise<{ success: true } | { success: false; error: string }> {
  await requireAdmin();

  const redemption = await prisma.agentRedemption.findUnique({ where: { id: redemptionId } });
  if (!redemption) return { success: false as const, error: "Redemption not found" };
  if (redemption.status === "PAID") return { success: false as const, error: "Already marked as paid" };

  await prisma.agentRedemption.update({
    where: { id: redemptionId },
    data:  { status: "PAID", processedAt: new Date(), note: note ?? null },
  });

  return { success: true as const };
}

export async function rejectRedemption(
  redemptionId: string,
  note?: string
): Promise<{ success: true } | { success: false; error: string }> {
  await requireAdmin();

  const redemption = await prisma.agentRedemption.findUnique({ where: { id: redemptionId } });
  if (!redemption) return { success: false as const, error: "Redemption not found" };
  if (redemption.status === "PAID") return { success: false as const, error: "Already paid — cannot reject" };

  // Refund the points
  await prisma.$transaction([
    prisma.agentRedemption.update({
      where: { id: redemptionId },
      data:  { status: "REJECTED", processedAt: new Date(), note: note ?? null },
    }),
    prisma.agentPoint.create({
      data: {
        agentId:     redemption.agentId,
        type:        "REDEMPTION",
        amount:      redemption.points, // positive = refund
        description: `Redemption refunded (rejected)`,
        status:      "CONFIRMED",
      },
    }),
    prisma.agentProfile.update({
      where: { id: redemption.agentId },
      data:  { points: { increment: redemption.points } },
    }),
  ]);

  return { success: true as const };
}

// ── Referral queue ────────────────────────────────────────────────────────────

export async function getAllReferralsAdmin() {
  await requireAdmin();
  return prisma.agentReferral.findMany({
    include: {
      agent: {
        select: { id: true, displayName: true, pseudonym: true, user: { select: { email: true } } },
      },
      businessProfile: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function markReferralUnderReview(
  referralId: string
): Promise<{ success: true } | { success: false; error: string }> {
  await requireAdmin();
  const referral = await prisma.agentReferral.findUnique({ where: { id: referralId } });
  if (!referral) return { success: false as const, error: "Referral not found" };
  if (referral.status !== "PENDING")
    return { success: false as const, error: "Only PENDING referrals can be marked under review" };

  await prisma.agentReferral.update({
    where: { id: referralId },
    data:  { status: "UNDER_REVIEW" },
  });
  return { success: true as const };
}

export async function approveReferral(
  referralId: string,
  businessProfileId?: string
): Promise<{ success: true } | { success: false; error: string }> {
  await requireAdmin();
  const referral = await prisma.agentReferral.findUnique({ where: { id: referralId } });
  if (!referral) return { success: false as const, error: "Referral not found" };
  if (referral.status === "VERIFIED") return { success: false as const, error: "Already verified" };
  if (referral.status === "REJECTED")  return { success: false as const, error: "Cannot approve a rejected referral" };

  const SIGNUP_PTS   = 5;
  const VERIFIED_PTS = 20;
  const totalPts     = SIGNUP_PTS + VERIFIED_PTS;
  const now          = new Date();

  await prisma.$transaction([
    prisma.agentReferral.update({
      where: { id: referralId },
      data: {
        status:           "VERIFIED",
        signupAt:         referral.signupAt ?? now,
        verifiedAt:       now,
        pointsAwarded:    { increment: totalPts },
        ...(businessProfileId ? { businessProfileId } : {}),
      },
    }),
    prisma.agentPoint.create({
      data: {
        agentId:     referral.agentId,
        type:        "REFERRAL_SIGNUP",
        amount:      SIGNUP_PTS,
        description: `${referral.partnerName} · partner account`,
        referenceId: referral.id,
        status:      "CONFIRMED",
      },
    }),
    prisma.agentPoint.create({
      data: {
        agentId:     referral.agentId,
        type:        "REFERRAL_VERIFIED",
        amount:      VERIFIED_PTS,
        description: `${referral.partnerName} · partner verified by admin`,
        referenceId: referral.id,
        status:      "CONFIRMED",
      },
    }),
    prisma.agentProfile.update({
      where: { id: referral.agentId },
      data:  { points: { increment: totalPts } },
    }),
  ]);

  return { success: true as const };
}

export async function rejectReferral(
  referralId: string
): Promise<{ success: true } | { success: false; error: string }> {
  await requireAdmin();
  const referral = await prisma.agentReferral.findUnique({ where: { id: referralId } });
  if (!referral) return { success: false as const, error: "Referral not found" };
  if (referral.status === "VERIFIED") return { success: false as const, error: "Cannot reject a verified referral" };

  await prisma.agentReferral.update({
    where: { id: referralId },
    data:  { status: "REJECTED" },
  });
  return { success: true as const };
}

// ── Agent details ─────────────────────────────────────────────────────────────

export async function getAgentDetailsAdmin(agentId: string) {
  await requireAdmin();
  const profile = await prisma.agentProfile.findUnique({
    where:   { id: agentId },
    include: {
      user:        { select: { email: true, name: true } },
      destination: { select: { city: true } },
      invitations: { orderBy: { createdAt: "desc" }, take: 10 },
      earnings:    { orderBy: { createdAt: "desc" }, take: 10 },
      referrals:   {
        orderBy: { createdAt: "desc" },
        include: { businessProfile: { select: { name: true } } },
      },
    },
  });
  return profile;
}
