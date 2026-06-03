import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getPlan } from "@/lib/actions/planner";
import { parsePlanItinerary } from "@/lib/planner/types";
import { PrintView } from "./_components/PrintView";
import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string; planId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { planId } = await params;
  const plan = await getPlan(planId);
  if (!plan) return { title: "Plan not found" };
  const title = plan.title ?? `${plan.duration}-Day Plan`;
  return { title: `${title} — Print view — Guidni` };
}

export default async function PlanPrintPage({ params }: Props) {
  const { locale, planId } = await params;

  const [plan, session] = await Promise.all([
    getPlan(planId),
    auth.api.getSession({ headers: await headers() }),
  ]);

  if (!plan) notFound();

  const isOwner     = !!session?.user && plan.userId === session.user.id;
  const isGuidePlan = !!(plan as { guide?: unknown }).guide;

  if (!plan.isPublic && !isOwner) notFound();

  const itinerary  = parsePlanItinerary(plan.itinerary);
  const title      = plan.title ?? `${plan.duration}-Day Plan`;
  const cityLabel  = plan.destination
    ? `${plan.destination.city}, ${plan.destination.country}`
    : "";
  const guideLabel =
    isGuidePlan && (plan as { guide?: { displayName?: string } }).guide
      ? (plan as { guide: { displayName: string } }).guide.displayName
      : null;

  return (
    <PrintView
      title={title}
      cityLabel={cityLabel}
      duration={plan.duration}
      guideLabel={guideLabel}
      itinerary={itinerary}
      locale={locale}
    />
  );
}
