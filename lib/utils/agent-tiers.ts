import { prisma } from "@/lib/db";

const TIER_THRESHOLDS = { PRO: 10, ELITE: 50 } as const;
const TIER_BONUS_POINTS = { PRO: 25, ELITE: 75 } as const;

/**
 * Call after any confirmed booking for an agent.
 * Checks total BOOKED invitations and upgrades tier if thresholds crossed.
 * Awards tier bonus points on upgrade. Fire-and-forget safe.
 */
export async function checkAndUpgradeTier(agentId: string): Promise<void> {
  const profile = await prisma.agentProfile.findUnique({
    where:  { id: agentId },
    select: { tier: true },
  });
  if (!profile) return;

  const bookedCount = await prisma.agentInvitation.count({
    where: { agentId, status: "BOOKED" },
  });

  let newTier: "PRO" | "ELITE" | null = null;
  let bonusPoints = 0;

  if (bookedCount >= TIER_THRESHOLDS.ELITE && profile.tier !== "ELITE") {
    newTier     = "ELITE";
    bonusPoints = TIER_BONUS_POINTS.ELITE;
  } else if (bookedCount >= TIER_THRESHOLDS.PRO && profile.tier === "STARTER") {
    newTier     = "PRO";
    bonusPoints = TIER_BONUS_POINTS.PRO;
  }

  if (!newTier) return;

  await Promise.all([
    prisma.agentProfile.update({
      where: { id: agentId },
      data:  { tier: newTier, points: { increment: bonusPoints } },
    }),
    prisma.agentPoint.create({
      data: {
        agentId,
        type:        "TIER_BONUS",
        amount:      bonusPoints,
        description: `Tier upgrade to ${newTier}`,
        status:      "CONFIRMED",
      },
    }),
  ]);
}
