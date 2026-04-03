import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getPlan } from "@/lib/actions/planner";
import { getReviews, hasReviewed, hasCompletedBooking } from "@/lib/actions/reviews";
import { PlanView } from "./_components/PlanView";
import { RelationType } from "@prisma/client";

type Props = {
  params: Promise<{ locale: string; planId: string }>;
};

export default async function PlanDetailPage({ params }: Props) {
  const { locale, planId } = await params;

  const [plan, session] = await Promise.all([
    getPlan(planId),
    auth.api.getSession({ headers: await headers() }),
  ]);

  if (!plan) notFound();

  const isOwner = !!session?.user && plan.userId === session.user.id;
  const isGuidePlan = !!(plan as { guide?: unknown }).guide;

  const [reviews, alreadyReviewed, canReview] = isGuidePlan
    ? await Promise.all([
        getReviews(plan.id, RelationType.PLAN),
        session?.user ? hasReviewed(plan.id, "PLAN") : Promise.resolve(false),
        session?.user ? hasCompletedBooking(plan.id, "PLAN") : Promise.resolve(false),
      ])
    : [[], false, false];

  return (
    <PlanView
      plan={{
        id:          plan.id,
        title:       plan.title,
        duration:    plan.duration,
        isPublic:    plan.isPublic,
        preferences: plan.preferences,
        itinerary:   plan.itinerary,
        destination: plan.destination,
        guide:       plan.guide ?? null,
        summary:     (plan as { summary?: string | null }).summary ?? null,
        tags:        (plan as { tags?: string[] }).tags ?? [],
        difficulty:  (plan as { difficulty?: string | null }).difficulty ?? null,
        suitableFor: (plan as { suitableFor?: string[] }).suitableFor ?? [],
        season:      (plan as { season?: string | null }).season ?? null,
      }}
      locale={locale}
      isOwner={isOwner}
      reviews={reviews.map((r) => ({
        id: r.id,
        userName: r.user.name ?? "Anonymous",
        title: r.title,
        rating: r.rating,
        comment: r.comment,
        response: r.response,
        responseDate: r.responseDate ? String(r.responseDate) : null,
        createdAt: r.createdAt,
        user: r.user,
      }))}
      canReview={canReview}
      alreadyReviewed={alreadyReviewed}
    />
  );
}
