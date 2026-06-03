import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getPlanForEdit } from "@/lib/actions/guide-plan-editor";
import { getPlan } from "@/lib/actions/planner";
import { GuideEditShell } from "./_components/GuideEditShell";
import { UserPlanShell } from "./_components/UserPlanShell";
import { parsePlanItinerary } from "@/lib/planner/types";

type Props = {
  params:       Promise<{ locale: string; planId: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export const metadata: Metadata = {
  title:  "Edit Plan — Guidni",
  robots: { index: false, follow: false },
};

export default async function PlanEditPage({ params, searchParams }: Props) {
  const { locale, planId } = await params;
  const { tab = "itinerary" } = await searchParams;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect(`/${locale}/login`);

  // ── Guide-owned plan ─────────────────────────────────────────────────────────
  const guidePlan = await getPlanForEdit(planId);
  if (guidePlan) {
    return (
      <GuideEditShell
        locale={locale}
        tab={tab}
        plan={{
          id:               guidePlan.id,
          title:            guidePlan.title,
          duration:         guidePlan.duration,
          isPublic:         guidePlan.isPublic,
          planType:         guidePlan.planType,
          price:            guidePlan.price,
          previewDays:      guidePlan.previewDays,
          isPaidPlan:       guidePlan.isPaidPlan,
          moderationStatus: guidePlan.moderationStatus,
          summary:          guidePlan.summary,
          tags:             guidePlan.tags,
          difficulty:       guidePlan.difficulty,
          suitableFor:      guidePlan.suitableFor,
          season:           guidePlan.season,
          itinerary:        parsePlanItinerary(guidePlan.itinerary),
          destination:      guidePlan.destination,
          guide: guidePlan.guide
            ? {
                id:          guidePlan.guide.id,
                slug:        guidePlan.guide.slug,
                displayName: guidePlan.guide.displayName,
              }
            : null,
          request: guidePlan.requests[0]
            ? {
                id:         guidePlan.requests[0].id,
                requestRef: guidePlan.requests[0].requestRef,
                status:     guidePlan.requests[0].status,
                userName:   guidePlan.requests[0].user.name ?? "User",
              }
            : null,
        }}
      />
    );
  }

  // ── User-owned plan (not a guide plan) ───────────────────────────────────────
  const userPlan = await getPlan(planId);
  if (!userPlan) notFound();

  const isOwner = userPlan.userId === session.user.id;
  const isGuidePlan = !!(userPlan as { guide?: unknown }).guide;

  if (!isOwner || isGuidePlan) notFound();

  return (
    <UserPlanShell
      locale={locale}
      tab={tab}
      plan={{
        id:          userPlan.id,
        title:       userPlan.title ?? null,
        duration:    userPlan.duration,
        isPublic:    userPlan.isPublic,
        itinerary:   parsePlanItinerary(userPlan.itinerary),
        destination: userPlan.destination
          ? {
              id:      userPlan.destination.id,
              city:    userPlan.destination.city,
              country: (userPlan.destination as { country?: string }).country ?? "",
            }
          : null,
      }}
    />
  );
}
