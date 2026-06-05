"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2, MapPin, Clock, Sparkles } from "lucide-react";
import { BudgetBar } from "../../../_components/itinerary/BudgetBar";
import { ItineraryBoard } from "../../../_components/itinerary/ItineraryBoard";
import { GeneratingSkeleton } from "../../../_components/GeneratingSkeleton";
import { computeBudget } from "@/lib/planner/budget";

import { savePlan, generatePlan } from "@/lib/actions/planner";
import { PREVIEW_KEY } from "../../../_components/PlannerWizard";
import type { PlanItinerary, PlanBlock, PlanItem, UserPreferences } from "@/lib/planner/types";
import { useCurrency } from "@/hooks/useCurrency";

// What the wizard writes — only preferences (no itinerary yet)
type WizardPayload = { preferences: UserPreferences };
// What we store after generation — preferences + built itinerary
type PreviewData = { preferences: UserPreferences; itinerary: PlanItinerary };

type Props = { locale: string };

export function PlanPreview({ locale }: Props) {
  const t = useTranslations("PlanPreview");
  const router = useRouter();
  const { currency } = useCurrency();

  const formatPrice = (price: number) => {
    if (currency === "EUR") return `${(price / 3.5).toFixed(1)} €`;
    if (currency === "USD") return `$${(price / 3.0).toFixed(1)}`;
    return `${price} DT`;
  };

  const [phase, setPhase] = useState<"idle" | "loading" | "ready" | "empty">("idle");
  const [data, setData] = useState<PreviewData | null>(null);
  const [days, setDays] = useState<PlanItinerary["days"]>([]);
  const [swapSlot, setSwapSlot] = useState<PlanBlock | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const hasRun = useRef(false);

  useEffect(() => {
    async function run() {
      try {
        const raw = sessionStorage.getItem(PREVIEW_KEY);
        if (!raw) { setPhase("empty"); return; }

        const parsed = JSON.parse(raw) as WizardPayload | PreviewData;

        // Already generated (back-navigation) — skip re-generation
        if ("itinerary" in parsed) {
          setData(parsed as PreviewData);
          setDays((parsed as PreviewData).itinerary.days);
          setPhase("ready");
          return;
        }

        // Fresh generation — show loading, fetch plannerData then run engine
        if (hasRun.current) return;
        hasRun.current = true;
        setPhase("loading");
        const { preferences } = parsed;
        console.log("preferences", preferences);
        const apiResponse = await generatePlan(preferences);

        if (!apiResponse.success) {
          throw new Error(apiResponse.error || "Failed to generate plan");
        }

        const agentPlan = apiResponse.data.plan;

        const built: PlanItinerary = {
          days: (agentPlan.days || []).map((day: any, index: number) => ({
            dayNumber: index + 1,
            date: day.date,
            theme: day.theme || `Day ${index + 1}`,
            notes: "",
            blocks: (day.activities || []).map((act: any, actIdx: number) => ({
              id: act.entity_id || `act-${index}-${actIdx}`,
              time: { start: act.time || "", end: "" },
              customTitle: act.title,
              guideNote: act.justification,
              item: {
                id: act.entity_id || `item-${index}-${actIdx}`,
                type: (act.entity_type || "ACTIVITY").toUpperCase(),
                slug: "",
                name: act.title,
                price: act.price || 0,
                location: act.city || "",
                tags: [],
              }
            }))
          })),
          stays: (agentPlan.stays || []).map((stay: any, idx: number) => ({
            id: stay.entity_id || `stay-${idx}`,
            fromDay: 1,
            toDay: agentPlan.days?.length || 1,
            note: stay.justification,
            item: {
              id: stay.entity_id || `stay-item-${idx}`,
              type: (stay.entity_type || "STAY").toUpperCase(),
              slug: "",
              name: stay.title,
              price: stay.price || 0,
              tags: [],
            }
          })),
          rentals: (agentPlan.rentals || []).map((rental: any, idx: number) => ({
            id: rental.entity_id || `rental-${idx}`,
            fromDay: 1,
            toDay: agentPlan.days?.length || 1,
            note: rental.justification,
            item: {
              id: rental.entity_id || `rental-item-${idx}`,
              type: (rental.entity_type || "RENTAL").toUpperCase(),
              slug: "",
              name: rental.title,
              price: rental.price || 0,
              tags: [],
            }
          })),
        };

        const result: PreviewData = { preferences, itinerary: built as PlanItinerary };
        sessionStorage.setItem(PREVIEW_KEY, JSON.stringify(result));
        setData(result);
        setDays((built as PlanItinerary).days);
        setPhase("ready");
      } catch (e) {
        console.error(e);
        toast.error("Failed to generate plan. Please try again.");
        setPhase("empty");
      }
    }
    run();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const budget = useMemo(() => {
    if (!data) return null;
    return computeBudget(
      { days, stays: data.itinerary.stays, rentals: data.itinerary.rentals },
      data.preferences,
    );
  }, [days, data]);

  const handleSave = useCallback(async () => {
    if (!data) return;
    setIsSaving(true);
    const { duration, destinationCity } = data.preferences;
    const autoTitle = t("autoTitle", { days: duration, city: destinationCity });
    const result = await savePlan({
      title: autoTitle,
      preferences: data.preferences,
      itinerary: { ...data.itinerary, days },
      destinationId: data.preferences.destinationId,
    });
    setIsSaving(false);
    if (result.success) {
      sessionStorage.removeItem(PREVIEW_KEY);
      toast.success(t("savedSuccess"));
      router.push(`/${locale}/planner/${result.data.id}`);
    } else {
      toast.error(result.error ?? t("errorSave"));
    }
  }, [data, days, locale, router, t]);

  // ── Idle (before sessionStorage check completes) ────────────
  if (phase === "idle") return null;

  // ── Loading ──────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <GeneratingSkeleton />
      </div>
    );
  }

  // ── No data ─────────────────────────────────────────────────
  if (phase === "empty" || !data) {
    return (
      <div className="max-w-sm mx-auto flex flex-col items-center text-center py-24 px-4 gap-6">
        <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl">
          🗺️
        </div>
        <div className="space-y-2">
          <p className="text-base font-semibold text-gray-900">{t("noData")}</p>
          <p className="text-sm text-gray-500 leading-relaxed">{t("noDataHint")}</p>
        </div>
        <div className="flex flex-col items-stretch gap-3 w-full max-w-xs">
          <Link
            href={`/${locale}/planner/ai`}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors whitespace-nowrap"
          >
            <Sparkles className="h-4 w-4 shrink-0" />
            {t("createNewPlan")}
          </Link>
          <Link
            href={`/${locale}/my-plans`}
            className="flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            {t("viewMyPlans")}
          </Link>
        </div>
      </div>
    );
  }

  const { preferences, itinerary } = data;

  return (
    <div>

      {/* ── Sticky header ── */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link
            href={`/${locale}/planner/ai`}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("regenerate")}
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {preferences.destinationName}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {preferences.duration}d
              </span>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {isSaving ? t("saving") : t("savePlan")}
            </button>
          </div>
        </div>
      </div>

      {/* ── Plan content ── */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">

        {budget && (
          <BudgetBar
            budget={budget}
            duration={preferences.duration}
            budgetLevel={preferences.budget as 1 | 2 | 3 | undefined}
            groupType={preferences.groupType}
          />
        )}

        {/* Accommodation */}
        {itinerary.stays.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {t("staysTitle")}
            </p>
            <div className="space-y-3">
              {itinerary.stays.map((block) => {
                const nights = Math.max(0, block.toDay - block.fromDay);
                return (
                  <div key={block.id} className="flex items-center gap-3">
                    <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      {block.item.imageUrl
                        ? <Image src={block.item.imageUrl} alt={block.item.name} fill className="object-cover" sizes="56px" />
                        : <div className="absolute inset-0 flex items-center justify-center text-xl">🏨</div>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{block.item.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {block.item.location && <span className="text-xs text-gray-400">{block.item.location}</span>}
                        {block.item.price > 0 && (
                          <span className="text-xs text-gray-500 font-medium">{formatPrice(block.item.price)}{t("perNight")}</span>
                        )}
                      </div>
                      {block.note && <p className="text-xs text-gray-400 mt-0.5 truncate">{block.note}</p>}
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full shrink-0 whitespace-nowrap">
                      {nights} {t("nights")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Rentals */}
        {itinerary.rentals.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {t("rentalsTitle")}
            </p>
            <div className="space-y-3">
              {itinerary.rentals.map((block) => {
                const rentalDays = Math.max(1, block.toDay - block.fromDay + 1);
                return (
                  <div key={block.id} className="flex items-center gap-3">
                    <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      {block.item.imageUrl
                        ? <Image src={block.item.imageUrl} alt={block.item.name} fill className="object-cover" sizes="56px" />
                        : <div className="absolute inset-0 flex items-center justify-center text-xl">🚗</div>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{block.item.name}</p>
                      {block.item.price > 0 && (
                        <span className="text-xs text-gray-500 font-medium">{formatPrice(block.item.price)}{t("perDay")}</span>
                      )}
                      {block.note && <p className="text-xs text-gray-400 mt-0.5 truncate">{block.note}</p>}
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full shrink-0 whitespace-nowrap">
                      {rentalDays} {t("rentalDays")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Day-by-day itinerary */}
        <ItineraryBoard
          days={days}
          stays={itinerary.stays}
          rentals={itinerary.rentals}
          preferences={preferences}
          locale={locale}
          isOwner={false}
          hideBudgetBar
          swapSlot={swapSlot}
          onDaysChange={setDays}
          onSwapOpen={setSwapSlot}
          onSwapClose={() => setSwapSlot(null)}
          onSwapSelect={(_block: PlanBlock, _replacement: PlanItem) => { }}
        />

        {/* Bottom save CTA */}
        <div className="pt-4 pb-8 flex justify-center">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60 shadow-sm"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? t("saving") : t("savePlan")}
          </button>
        </div>

      </div>
    </div>
  );
}
