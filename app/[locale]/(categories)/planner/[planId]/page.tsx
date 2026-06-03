import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getPlan } from "@/lib/actions/planner";
import { getReviews, hasReviewed, hasCompletedBooking } from "@/lib/actions/reviews";
import { getRelatedGuidePlans } from "@/lib/actions/guides";
import { hasPurchasedPlan } from "@/lib/actions/plan-purchases";
import { hasActiveRequestWithGuide } from "@/lib/actions/plan-requests";
import { PlanView } from "./_components/PlanView";
import { PlanPurchaseCTA } from "./_components/PlanPurchaseCTA";
import { PurchaseSuccessBanner } from "./_components/PurchaseSuccessBanner";
import { PlanMessageSection } from "./_components/PlanMessageSection";
import { RelationType } from "@prisma/client";
import { FaCircleCheck } from "react-icons/fa6";

type Props = {
  params: Promise<{ locale: string; planId: string }>;
  searchParams: Promise<{ session_id?: string; purchased?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { planId } = await params;
  const plan = await getPlan(planId);

  if (!plan) {
    return { title: "Plan not found — Guidni" };
  }

  const title =
    plan.title ??
    `${plan.duration}-Day ${(plan as { destination?: { city?: string } }).destination?.city ?? ""} Plan`;

  const summary = (plan as { summary?: string | null }).summary;
  const city    = (plan as { destination?: { city?: string } }).destination?.city;
  const guide   = (plan as { guide?: { displayName?: string } | null }).guide;

  const description = summary
    ?? `A ${plan.duration}-day itinerary${city ? ` for ${city}` : ""}${guide ? ` by ${guide.displayName}` : ""}.`;

  return {
    title: `${title} — Guidni`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
    },
  };
}

export default async function PlanDetailPage({ params }: Props) {
  const { locale, planId } = await params;

  const [plan, session] = await Promise.all([
    getPlan(planId),
    auth.api.getSession({ headers: await headers() }),
  ]);

  if (!plan) notFound();

  const isOwner = !!session?.user && plan.userId === session.user.id;
  const isGuidePlan = !!(plan as { guide?: unknown }).guide;

  const isPaidPlan = (plan as { planType?: string }).planType === "GUIDE_PAID";
  const previewDays = (plan as { previewDays?: number }).previewDays ?? 1;
  const price = (plan as { price?: number }).price ?? 0;
  const destId = plan.destination?.id;

  const guideId = (plan.guide as { id?: string } | null)?.id ?? null;

  const [reviews, alreadyReviewed, canReview, relatedPlans, purchased, hasRequest] = await Promise.all([
    isGuidePlan
      ? getReviews(plan.id, RelationType.PLAN)
      : Promise.resolve([]),
    session?.user && isGuidePlan ? hasReviewed(plan.id, "PLAN") : Promise.resolve(false),
    session?.user && isGuidePlan ? hasCompletedBooking(plan.id, "PLAN") : Promise.resolve(false),
    isGuidePlan && destId ? getRelatedGuidePlans(destId, plan.id) : Promise.resolve([]),
    session?.user && isPaidPlan ? hasPurchasedPlan(planId) : Promise.resolve(false),
    session?.user && guideId ? hasActiveRequestWithGuide(guideId) : Promise.resolve(false),
  ]);

  // For paid plans: only show previewDays days if not owner and not purchased
  const showFullItinerary = !isPaidPlan || isOwner || purchased;
  const itinerary = plan.itinerary as Array<{ dayNumber: number; [key: string]: unknown }>;
  const visibleItinerary = showFullItinerary
    ? itinerary
    : itinerary?.slice(0, previewDays) ?? [];

  const PLAN_TYPE_LABEL: Record<string, string> = {
    GUIDE_FREE: "Free",
    GUIDE_PAID: "Paid",
  };

  return (
    <div>
      {/* Purchase fulfillment handler — runs on return from payment page */}
      <Suspense fallback={null}>
        <PurchaseSuccessBanner planId={planId} />
      </Suspense>

      <PlanView
        plan={{
          id:          plan.id,
          title:       plan.title,
          duration:    plan.duration,
          isPublic:    plan.isPublic,
          preferences: plan.preferences,
          itinerary:   visibleItinerary,
          destination: plan.destination,
          guide:       plan.guide ?? null,
          summary:     (plan as { summary?: string | null }).summary ?? null,
          tags:        (plan as { tags?: string[] }).tags ?? [],
          difficulty:  (plan as { difficulty?: string | null }).difficulty ?? null,
          suitableFor: (plan as { suitableFor?: string[] }).suitableFor ?? [],
          season:      (plan as unknown as { season?: string | null }).season ?? null,
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
        chatSlot={
          session?.user &&
          plan.guide &&
          (plan.guide as { chatEnabled?: boolean }).chatEnabled !== false &&
          (purchased || hasRequest) ? (
            <PlanMessageSection
              planId={planId}
              guide={{
                displayName: plan.guide.displayName,
                avatarUrl:   plan.guide.avatarUrl ?? null,
              }}
              currentUserId={session.user.id}
            />
          ) : undefined
        }
      />

      {/* Purchase CTA — shown for locked paid plans */}
      {isPaidPlan && !showFullItinerary && (
        <div className="max-w-screen-xl mx-auto px-4 pb-8">
          <div className="max-w-lg mx-auto">
            <PlanPurchaseCTA
              planId={planId}
              locale={locale}
              price={price}
              duration={plan.duration}
              previewDays={previewDays}
              guide={plan.guide ?? null}
              isLoggedIn={!!session?.user}
            />
          </div>
        </div>
      )}

      {/* Related guide plans */}
      {relatedPlans.length > 0 && (
        <section className="max-w-screen-xl mx-auto px-4 pb-16 mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-5">
            More plans in {plan.destination?.city}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedPlans.map((p) => (
              <Link
                key={p.id}
                href={`/${locale}/planner/${p.id}`}
                className="group bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-400">{p.duration} days</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    p.planType === "GUIDE_FREE" ? "bg-green-50 text-green-700" : "bg-primary/10 text-primary"
                  }`}>
                    {PLAN_TYPE_LABEL[p.planType] ?? p.planType}
                    {p.planType === "GUIDE_PAID" && p.price ? ` · TND ${p.price}` : ""}
                  </span>
                </div>
                <p className="font-semibold text-sm text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors mb-1">
                  {p.title ?? `${p.duration}-Day Plan`}
                </p>
                {p.summary && (
                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-3">{p.summary}</p>
                )}
                {p.guide && (
                  <div className="flex items-center gap-1.5 mt-auto">
                    <span className="text-xs text-gray-500 truncate">{p.guide.displayName}</span>
                    {p.guide.isVerified && <FaCircleCheck className="h-3 w-3 text-blue-600 shrink-0" />}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
