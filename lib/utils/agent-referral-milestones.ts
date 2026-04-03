import { prisma } from "@/lib/db";

const MILESTONE_POINTS = {
  firstListing: 30,
  firstBooking: 50,
} as const;

/**
 * Call after a partner publishes their first listing.
 * If a verified AgentReferral links to this businessProfile with firstListingAt null,
 * sets the timestamp and awards +30 pts to the agent. Fire-and-forget safe.
 */
export async function triggerReferralFirstListing(businessProfileId: string): Promise<void> {
  const referral = await prisma.agentReferral.findFirst({
    where: {
      businessProfileId,
      status:        "VERIFIED",
      firstListingAt: null,
    },
  });
  if (!referral) return;

  await Promise.all([
    prisma.agentReferral.update({
      where: { id: referral.id },
      data: {
        firstListingAt: new Date(),
        pointsAwarded:  { increment: MILESTONE_POINTS.firstListing },
      },
    }),
    prisma.agentPoint.create({
      data: {
        agentId:     referral.agentId,
        type:        "REFERRAL_FIRST_LISTING",
        amount:      MILESTONE_POINTS.firstListing,
        description: `${referral.partnerName} · first listing published`,
        referenceId: referral.id,
        status:      "CONFIRMED",
      },
    }),
    prisma.agentProfile.update({
      where: { id: referral.agentId },
      data:  { points: { increment: MILESTONE_POINTS.firstListing } },
    }),
  ]);
}

/**
 * Call after a booking is received for a partner.
 * Awards +50 pts to the referral agent on first booking. Fire-and-forget safe.
 */
export async function triggerReferralFirstBooking(businessProfileId: string): Promise<void> {
  const referral = await prisma.agentReferral.findFirst({
    where: {
      businessProfileId,
      status:         "VERIFIED",
      firstBookingAt: null,
    },
  });
  if (!referral) return;

  await Promise.all([
    prisma.agentReferral.update({
      where: { id: referral.id },
      data: {
        firstBookingAt: new Date(),
        pointsAwarded:  { increment: MILESTONE_POINTS.firstBooking },
      },
    }),
    prisma.agentPoint.create({
      data: {
        agentId:     referral.agentId,
        type:        "REFERRAL_FIRST_BOOKING",
        amount:      MILESTONE_POINTS.firstBooking,
        description: `${referral.partnerName} · first booking received`,
        referenceId: referral.id,
        status:      "CONFIRMED",
      },
    }),
    prisma.agentProfile.update({
      where: { id: referral.agentId },
      data:  { points: { increment: MILESTONE_POINTS.firstBooking } },
    }),
  ]);
}
