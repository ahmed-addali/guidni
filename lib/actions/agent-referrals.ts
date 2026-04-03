"use server";

import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function requireAgent() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Not authenticated");

  const profile = await prisma.agentProfile.findUnique({
    where:  { userId: session.user.id },
    select: { id: true, isActive: true },
  });
  if (!profile?.isActive) throw new Error("Agent profile not found or inactive");
  return profile;
}

// ── Create referral ────────────────────────────────────────────────────────────

interface CreateReferralInput {
  partnerName:  string;
  partnerType:  string;
  partnerPhone?: string;
  partnerEmail?: string;
  partnerCity?:  string;
  agentNote?:    string;
}

export async function createReferral(input: CreateReferralInput) {
  if (!input.partnerName?.trim()) return { success: false as const, error: "Partner name is required" };
  if (!input.partnerPhone && !input.partnerEmail)
    return { success: false as const, error: "Provide at least a phone number or email" };
  if (!input.partnerType) return { success: false as const, error: "Business category is required" };

  let profile: { id: string };
  try {
    profile = await requireAgent();
  } catch {
    return { success: false as const, error: "Not authenticated" };
  }

  const referral = await prisma.agentReferral.create({
    data: {
      agentId:     profile.id,
      partnerName: input.partnerName.trim(),
      partnerType: input.partnerType,
      partnerPhone: input.partnerPhone?.trim() || null,
      partnerEmail: input.partnerEmail?.trim() || null,
      partnerCity:  input.partnerCity?.trim()  || null,
      agentNote:    input.agentNote?.trim()    || null,
      status:       "PENDING",
    },
  });

  return { success: true as const, id: referral.id };
}

// ── Get my referrals ───────────────────────────────────────────────────────────

export const getMyReferrals = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const profile = await prisma.agentProfile.findUnique({
    where:  { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return null;

  return prisma.agentReferral.findMany({
    where:   { agentId: profile.id },
    include: { businessProfile: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
});
