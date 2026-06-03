"use server";

import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AgentApplicationSchema, type AgentApplicationInput } from "@/lib/validations/agent";

// ── Apply to become a Local Agent ─────────────────────────────────────────────

export async function applyAsAgent(raw: AgentApplicationInput) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false as const, error: "Not authenticated" };

  // Check if user already has a profile
  const existing = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (existing) {
    return {
      success: false as const,
      error: existing.isVerified
        ? "You already have a verified agent account."
        : "Your application is already under review.",
    };
  }

  const parsed = AgentApplicationSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { displayName, pseudonym, phone, country, city, bio, touchPoint, destinationId } = parsed.data;

  // Check pseudonym uniqueness if provided
  if (pseudonym && pseudonym.length > 0) {
    const taken = await prisma.agentProfile.findUnique({ where: { pseudonym } });
    if (taken) return { success: false as const, error: "This pseudonym is already taken. Choose another." };
  }

  // Generate a unique slug from displayName
  const baseSlug = displayName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.agentProfile.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  const bioValue = bio
    ? `${bio}\n\n[How I meet tourists]: ${touchPoint}`
    : `[How I meet tourists]: ${touchPoint}`;

  await prisma.agentProfile.create({
    data: {
      slug,
      displayName,
      pseudonym:     pseudonym && pseudonym.length > 0 ? pseudonym : undefined,
      phone,
      country,
      city,
      bio:           bioValue,
      userId:        session.user.id,
      destinationId: destinationId || undefined,
    },
  });

  return { success: true as const };
}

// ── Get current user's agent profile ─────────────────────────────────────────

export const getMyAgentProfile = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  return prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    include: { destination: { select: { id: true, city: true, slug: true } } },
  });
});

// ── Get invitation by token (public — no auth required) ───────────────────────

export async function getAgentInvitationByToken(token: string) {
  const invitation = await prisma.agentInvitation.findUnique({
    where: { token },
    include: {
      agent: {
        select: {
          displayName: true,
          pseudonym:   true,
          isVerified:  true,
          isActive:    true,
        },
      },
    },
  });

  if (!invitation) return null;
  if (!invitation.agent.isActive) return null;
  if (invitation.status === "CANCELLED" || invitation.status === "EXPIRED") return null;

  // Check expiry
  if (invitation.expiresAt < new Date()) {
    // Mark as expired (fire-and-forget style — best effort)
    await prisma.agentInvitation.update({
      where: { id: invitation.id },
      data:  { status: "EXPIRED" },
    }).catch(() => null);
    return null;
  }

  return invitation;
}

// ── Mark invitation as opened (public — no auth required) ────────────────────

export async function markInvitationOpened(token: string) {
  await prisma.agentInvitation.updateMany({
    where: { token, status: "PENDING" },
    data:  { status: "OPENED" },
  });
}

// ── Get agent dashboard overview stats ───────────────────────────────────────

export const getAgentDashboardStats = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const profile = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) return null;

  const [
    totalInvitations,
    pendingInvitations,
    bookedInvitations,
    totalEarnings,
    pendingEarnings,
    recentInvitations,
    referralCount,
  ] = await Promise.all([
    prisma.agentInvitation.count({ where: { agentId: profile.id } }),
    prisma.agentInvitation.count({ where: { agentId: profile.id, status: "PENDING" } }),
    prisma.agentInvitation.count({ where: { agentId: profile.id, status: "BOOKED" } }),
    prisma.agentEarning.aggregate({
      where: { agentId: profile.id, status: { in: ["CONFIRMED", "PAID"] } },
      _sum: { commissionAmount: true },
    }),
    prisma.agentEarning.aggregate({
      where: { agentId: profile.id, status: "PENDING" },
      _sum: { commissionAmount: true },
    }),
    prisma.agentInvitation.findMany({
      where: { agentId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.agentReferral.count({ where: { agentId: profile.id } }),
  ]);

  return {
    profile,
    totalInvitations,
    pendingInvitations,
    bookedInvitations,
    conversionRate: totalInvitations > 0
      ? Math.round((bookedInvitations / totalInvitations) * 100)
      : 0,
    confirmedEarnings: Number(totalEarnings._sum.commissionAmount ?? 0),
    pendingEarnings:   Number(pendingEarnings._sum.commissionAmount ?? 0),
    recentInvitations,
    referralCount,
  };
});

// ── Get agent invitations (paginated) ────────────────────────────────────────

export async function getMyInvitations(page = 1, pageSize = 20) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { invitations: [], total: 0 };

  const profile = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) return { invitations: [], total: 0 };

  const [invitations, total] = await Promise.all([
    prisma.agentInvitation.findMany({
      where: { agentId: profile.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.agentInvitation.count({ where: { agentId: profile.id } }),
  ]);

  return { invitations, total };
}

// ── Create agent invitation ───────────────────────────────────────────────────

export async function createAgentInvitation(raw: import("@/lib/validations/agent").AgentInvitationInput) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false as const, error: "Not authenticated" };

  const profile = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) return { success: false as const, error: "No agent profile found" };
  if (!profile.isActive) return { success: false as const, error: "Your account is currently inactive" };

  const { AgentInvitationSchema } = await import("@/lib/validations/agent");
  const parsed = AgentInvitationSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { listingType, listingId, date, timeSlot, adults, children, touristEmail, touristPhone, note } = parsed.data;

  // Expires in 7 days
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const invitation = await prisma.agentInvitation.create({
    data: {
      agentId:      profile.id,
      listingType,
      listingId,
      date,
      timeSlot,
      adults,
      children,
      touristEmail: touristEmail || undefined,
      touristPhone: touristPhone || undefined,
      note,
      expiresAt,
    },
  });

  return { success: true as const, token: invitation.token };
}

// ── Cancel agent invitation ───────────────────────────────────────────────────

export async function cancelAgentInvitation(invitationId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false as const, error: "Not authenticated" };

  const profile = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) return { success: false as const, error: "No agent profile found" };

  const invitation = await prisma.agentInvitation.findUnique({
    where: { id: invitationId },
  });
  if (!invitation || invitation.agentId !== profile.id) {
    return { success: false as const, error: "Invitation not found" };
  }
  if (invitation.status === "BOOKED") {
    return { success: false as const, error: "Cannot cancel a booked invitation" };
  }

  await prisma.agentInvitation.update({
    where: { id: invitationId },
    data:  { status: "CANCELLED" },
  });

  return { success: true as const };
}

// ── Get agent earnings ────────────────────────────────────────────────────────

export async function getMyEarnings(page = 1, pageSize = 20) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { earnings: [], total: 0 };

  const profile = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) return { earnings: [], total: 0 };

  const [earnings, total] = await Promise.all([
    prisma.agentEarning.findMany({
      where: { agentId: profile.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.agentEarning.count({ where: { agentId: profile.id } }),
  ]);

  return { earnings, total };
}

// ── Update agent profile ─────────────────────────────────────────────────────

export async function updateAgentProfile(data: {
  displayName: string;
  pseudonym?:  string;
  phone:       string;
  country:     string;
  city:        string;
  bio?:        string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false as const, error: "Not authenticated" };

  const profile = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) return { success: false as const, error: "No agent profile found" };

  if (!data.displayName || data.displayName.length < 2)
    return { success: false as const, error: "Name must be at least 2 characters" };

  if (data.pseudonym && data.pseudonym !== profile.pseudonym) {
    const taken = await prisma.agentProfile.findUnique({ where: { pseudonym: data.pseudonym } });
    if (taken) return { success: false as const, error: "This pseudonym is already taken." };
  }

  await prisma.agentProfile.update({
    where: { id: profile.id },
    data: {
      displayName: data.displayName,
      pseudonym:   data.pseudonym || null,
      phone:       data.phone,
      country:     data.country,
      city:        data.city,
      bio:         data.bio || null,
    },
  });

  return { success: true as const };
}

// ── Get agent points ──────────────────────────────────────────────────────────

export const getMyPoints = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const profile = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) return null;

  const [points, recentActivity] = await Promise.all([
    prisma.agentPoint.aggregate({
      where: { agentId: profile.id, status: "CONFIRMED" },
      _sum: { amount: true },
    }),
    prisma.agentPoint.findMany({
      where: { agentId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return {
    balance: points._sum.amount ?? 0,
    valueInTND: ((points._sum.amount ?? 0) * 0.5).toFixed(2),
    recentActivity,
  };
});

// ── Get earnings stats (for dashboard stats row) ──────────────────────────────

export const getMyEarningsStats = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const profile = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) return null;

  const [pending, confirmed, paid] = await Promise.all([
    prisma.agentEarning.aggregate({
      where: { agentId: profile.id, status: "PENDING" },
      _sum:  { commissionAmount: true },
    }),
    prisma.agentEarning.aggregate({
      where: { agentId: profile.id, status: "CONFIRMED" },
      _sum:  { commissionAmount: true },
    }),
    prisma.agentEarning.aggregate({
      where: { agentId: profile.id, status: "PAID" },
      _sum:  { commissionAmount: true },
    }),
  ]);

  return {
    allTime:   Number(profile.totalEarned),
    pending:   Number(pending._sum.commissionAmount ?? 0),
    confirmed: Number(confirmed._sum.commissionAmount ?? 0),
    paid:      Number(paid._sum.commissionAmount ?? 0),
  };
});

// ── Request earnings payout ───────────────────────────────────────────────────

export async function requestEarningsPayout() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false as const, error: "Not authenticated" };

  const profile = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) return { success: false as const, error: "No agent profile found" };

  const confirmed = await prisma.agentEarning.aggregate({
    where: { agentId: profile.id, status: "CONFIRMED" },
    _sum:  { commissionAmount: true },
  });
  const amount = Number(confirmed._sum.commissionAmount ?? 0);

  if (amount < 25) {
    return { success: false as const, error: `Minimum payout is TND 25. You have TND ${amount.toFixed(2)} confirmed.` };
  }

  // Mark confirmed earnings as PAID and update totalEarned
  await prisma.$transaction([
    prisma.agentEarning.updateMany({
      where: { agentId: profile.id, status: "CONFIRMED" },
      data:  { status: "PAID", paidAt: new Date() },
    }),
    prisma.agentProfile.update({
      where: { id: profile.id },
      data:  { totalEarned: { increment: amount } },
    }),
  ]);

  return { success: true as const, amount };
}

// ── Request points redemption ─────────────────────────────────────────────────

export async function requestPointsRedemption(points: number) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false as const, error: "Not authenticated" };

  if (points < 50) {
    return { success: false as const, error: "Minimum redemption is 50 points" };
  }

  const profile = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) return { success: false as const, error: "No agent profile found" };
  if (profile.points < points) {
    return { success: false as const, error: `Insufficient points. You have ${profile.points} pts.` };
  }

  const amountTND = points * 0.5;

  await prisma.$transaction([
    prisma.agentRedemption.create({
      data: {
        agentId:     profile.id,
        points,
        amountTND,
        status:      "PENDING",
        method:      "BANK_TRANSFER",
      },
    }),
    prisma.agentPoint.create({
      data: {
        agentId:     profile.id,
        type:        "REDEMPTION",
        amount:      -points,
        description: `Redemption request · ${points} pts → TND ${amountTND.toFixed(2)}`,
        status:      "CONFIRMED",
      },
    }),
    prisma.agentProfile.update({
      where: { id: profile.id },
      data:  { points: { decrement: points } },
    }),
  ]);

  return { success: true as const, amountTND };
}

// ── Public: Agent leaderboard ─────────────────────────────────────────────────

export const getAgentLeaderboard = cache(async () => {
  return prisma.agentProfile.findMany({
    where:   { isVerified: true, isActive: true },
    include: {
      destination: { select: { city: true } },
      _count:      { select: { invitations: true } },
    },
    orderBy: { totalEarned: "desc" },
    take:    20,
  });
});

// ── Public: Single agent profile by pseudonym ─────────────────────────────────

export const getPublicAgentProfile = cache(async (pseudonym: string) => {
  return prisma.agentProfile.findFirst({
    where:   { pseudonym, isActive: true },
    include: {
      user:        { select: { name: true } },
      destination: { select: { city: true } },
      _count:      { select: { invitations: true } },
    },
  });
});
