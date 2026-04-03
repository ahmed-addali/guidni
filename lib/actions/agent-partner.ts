"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function updateActivityAgentCommission(
  activityId: string,
  enabled:    boolean,
  rate:       number // decimal, e.g. 0.05 for 5%
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false, error: "Not authenticated" };

  if (rate < 0.03 || rate > 0.20) {
    return { success: false, error: "Commission rate must be between 3% and 20%" };
  }

  // Verify ownership
  const activity = await prisma.activity.findUnique({
    where:   { id: activityId },
    select:  { profileId: true, businessProfile: { select: { userId: true } } },
  });
  if (!activity || activity.businessProfile.userId !== session.user.id) {
    return { success: false, error: "Activity not found" };
  }

  await prisma.activity.update({
    where: { id: activityId },
    data:  {
      agentCommissionEnabled: enabled,
      agentCommissionRate:    enabled ? rate : null,
    },
  });

  return { success: true as const };
}
