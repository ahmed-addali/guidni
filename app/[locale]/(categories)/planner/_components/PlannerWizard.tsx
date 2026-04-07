"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, Loader2, Save, Share2, Sparkles } from "lucide-react";
import { StepDestination } from "./steps/StepDestination";
import { StepInterests } from "./steps/StepInterests";
import { StepBudgetGroup } from "./steps/StepBudgetGroup";
import { StepLogistics } from "./steps/StepLogistics";
import { StepItinerary } from "./steps/StepItinerary";
import { buildItinerary } from "@/lib/planner/engine";
import { injectLogistics, injectShoppingBlocks } from "@/lib/planner/logistics";
import { z } from "zod";
import { savePlan } from "@/lib/actions/planner";
import type { PlanDay, PlannerData, UserPreferences } from "@/lib/planner/types";
import { log } from "console";

type DestinationOption = {
  id: string;
  slug: string;
  city: string;
  country: string;
};

const DEFAULT_PREFS: UserPreferences = {
  destinationId: "",
  destinationName: "",
  destinationCity: "",
  startDate: undefined,
  duration: 3,
  travelStyle: "balanced",
  budget: 2,
  groupType: "couple",
  interests: [],
  accommodationType: "hotel",
  needsAirportPickup: false,
  needsReturnTransfer: false,
  needsRental: false,
  rentalType: undefined,
};

type Props = {
  destinations: DestinationOption[];
  plannerData: PlannerData;
  locale: string;
  defaultDestinationId?: string;
  defaultDestinationName?: string;
  defaultDestinationCity?: string;
};

export function PlannerWizard({
  destinations,
  plannerData,
  locale,
  defaultDestinationId,
  defaultDestinationName,
  defaultDestinationCity,
}: Props) {
  const t = useTranslations("PlannerWizard");
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [preferences, setPreferences] = useState<UserPreferences>({
    ...DEFAULT_PREFS,
    destinationId:   defaultDestinationId  ?? "",
    destinationName: defaultDestinationName ?? "",
    destinationCity: defaultDestinationCity ?? "",
  });
  const [days, setDays] = useState<PlanDay[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const updatePrefs = useCallback(
    (partial: Partial<UserPreferences>) =>
      setPreferences((p) => ({ ...p, ...partial })),
    []
  );

  const STEPS = [
    { label: t("stepDestination"), desc: t("stepDestinationDesc") },
    { label: t("stepInterests"),   desc: t("stepInterestsDesc") },
    { label: t("stepBudget"),      desc: t("stepBudgetDesc") },
    { label: t("stepLogistics"),   desc: t("stepLogisticsDesc") },
    { label: t("stepItinerary"),   desc: t("stepItineraryDesc") },
  ];

  const canAdvance = (): boolean => {
    switch (step) {
      case 0: return !!preferences.destinationId && preferences.duration > 0 && !!preferences.travelStyle;
      case 1: return preferences.interests.length > 0;
      case 2: return !!preferences.budget && !!preferences.groupType && !!preferences.accommodationType;
      case 3: return !(preferences.needsRental && !preferences.rentalType);
      default: return true;
    }
  };

  const generate = useCallback(async () => {
    setIsGenerating(true);

    const agentFullPlanSchema = z.object({
      days: z.array(
        z.object({
          day_number: z.number(),
          date: z.string().optional(),
          theme: z.string().optional(),
          slots: z
            .array(
              z.object({
                time: z.string(),
                end_time: z.string(),
                type: z.string(),
                activity_id: z.string().optional(),
                title: z.string(),
                description: z.string().optional(),
                category: z.string().optional(),
                price: z.number().optional(),
                duration: z.number().optional(),
                reason: z.string().optional(),
                image: z.string().optional(),
                bookable: z.boolean().optional(),
              })
            )
            .optional(),
        })
      ),
    });

    const mapAgentTypeToSlotType = (type: string, startTime?: string): "morning" | "lunch" | "afternoon" | "evening" => {
      try {
        if (type === "meal") return "lunch";
        if (type === "stay_suggestion") return "evening";
        // derive from start time if available
        if (startTime) {
          const h = parseInt(startTime.split(":")[0], 10);
          if (h >= 5 && h < 12) return "morning";
          if (h >= 12 && h < 14) return "lunch";
          if (h >= 14 && h < 19) return "afternoon";
          return "evening";
        }
      } catch {}
      return "afternoon";
    };

    const agentTypeToPlanItemType = (type: string) => {
      switch (type) {
        case "activity": return "ACTIVITY";
        case "meal": return "RESTAURANT";
        case "stay_suggestion": return "STAY";
        case "rest": return "ATTRACTION";
        default: return "ATTRACTION";
      }
    };

    const slugify = (s: string) =>
      s
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .slice(0, 50);

    try {
      // Call internal proxy which supplies authenticated user_id and forwards to planner-agent
      const resp = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences }),
      });

      const payload = await resp.json();
      if (!resp.ok || !payload?.success) throw new Error(payload?.error || "Agent error");

      const parsed = agentFullPlanSchema.safeParse(payload.data);
      if (!parsed.success) {
        console.warn("Agent response didn't match expected schema:", parsed.error);
        throw new Error("Agent schema mismatch");
      }

      const mapped: PlanDay[] = parsed.data.days.map((d) => ({
        dayNumber: d.day_number,
        date: d.date ?? undefined,
        theme: d.theme ?? "",
        notes: "",
        logistics: undefined,
        slots: (d.slots || []).map((s, i) => ({
          id: s.activity_id ?? `agent-${d.day_number}-${i}`,
          slotType: mapAgentTypeToSlotType(s.type, s.time),
          time: { start: s.time, end: s.end_time },
          item: {
            id: s.activity_id ?? `agent-${d.day_number}-${i}`,
            type: agentTypeToPlanItemType(s.type) as any,
            slug: slugify(s.title),
            name: s.title,
            arabicName: undefined,
            imageUrl: s.image ?? undefined,
            location: undefined,
            price: s.price ?? 0,
            priceLabel: s.price ? "per person" : "free",
            durationMinutes: s.duration ?? undefined,
            intensity: "low",
            tags: s.category ? [s.category] : [],
            idealTime: undefined,
            familyFriendly: false,
            bookingUrl: undefined,
            meals: undefined,
            attributes: undefined,
            hours: undefined,
            transferType: undefined,
            capacity: undefined,
            isAC: undefined,
            isMeetGreet: undefined,
            isChildSeat: undefined,
            nbReviews: undefined,
            rating: undefined,
          },
        })),
      }));

      setDays(mapped);
    } catch (e) {
      console.error("Agent generation failed, falling back to local builder:", e);
      try {
        let built = buildItinerary(plannerData, preferences);
        built = injectLogistics(built, plannerData, preferences);
        built = injectShoppingBlocks(built, plannerData.shops, preferences);
        console.log("planner built (local fallback)", built);
        setDays(built);
      } catch (err) {
        console.error(err);
        toast.error(t("errorGenerate"));
      }
    } finally {
      setIsGenerating(false);
    }
  }, [plannerData, preferences, t]);

  const goNext = useCallback(() => {
    if (step === 3) { setStep(4); generate(); }
    else setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, [step, generate, STEPS.length]);

  const goBack = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);

  const handleSave = useCallback(async () => {
    if (days.length === 0) return;
    setIsSaving(true);
    const result = await savePlan({ preferences, itinerary: days, destinationId: preferences.destinationId });
    setIsSaving(false);
    if (result.success) {
      toast.success(t("savedSuccess"));
      router.push(`/${locale}/planner/${result.data.id}`);
    } else {
      toast.error(result.error ?? t("errorSave"));
    }
  }, [days, preferences, locale, router, t]);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    toast.success(t("linkCopied"));
  }, [t]);

  const isItineraryStep = step === 4;

  return (
    <div className="max-w-2xl mx-auto">

      {/* ── Progress stepper ── */}
      <div className="mb-8">
        <div className="flex items-center gap-1.5 mb-4">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5 flex-1 min-w-0">
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                disabled={i >= step}
                title={s.label}
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                  i < step
                    ? "bg-primary text-white cursor-pointer hover:bg-primary/80"
                    : i === step
                    ? "bg-primary text-white ring-4 ring-primary/20"
                    : "bg-gray-100 text-gray-400 cursor-default"
                }`}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </button>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 rounded-full transition-colors ${i < step ? "bg-primary" : "bg-gray-100"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Active step label */}
        <div className="flex items-baseline gap-2">
          <p className="text-base font-bold text-gray-900">{STEPS[step].label}</p>
          <p className="text-xs text-gray-400">{t("stepOf", { step: step + 1, total: STEPS.length })}</p>
        </div>
        <p className="text-sm text-gray-500 mt-0.5">{STEPS[step].desc}</p>
      </div>

      {/* ── Step content card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 min-h-72">
        {step === 0 && <StepDestination preferences={preferences} destinations={destinations} onChange={updatePrefs} />}
        {step === 1 && <StepInterests preferences={preferences} onChange={updatePrefs} />}
        {step === 2 && <StepBudgetGroup preferences={preferences} onChange={updatePrefs} />}
        {step === 3 && <StepLogistics preferences={preferences} onChange={updatePrefs} />}
        {step === 4 && (
          <StepItinerary
            days={days}
            isGenerating={isGenerating}
            preferences={preferences}
            locale={locale}
            onDaysChange={setDays}
            onRegenerate={generate}
          />
        )}
      </div>

      {/* ── Navigation ── */}
      <div className="flex items-center justify-between mt-5">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 0}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-gray-500 rounded-xl hover:bg-gray-50 hover:text-gray-700 disabled:opacity-0 disabled:pointer-events-none transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("back")}
        </button>

        <div className="flex items-center gap-2">
          {isItineraryStep && days.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Share2 className="h-3.5 w-3.5" />
                {t("share")}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {t("savePlan")}
              </button>
            </>
          )}

          {!isItineraryStep && (
            <button
              type="button"
              onClick={goNext}
              disabled={!canAdvance()}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {step === 3 ? (
                <>
                  <Sparkles className="h-4 w-4" />
                  {t("generatePlan")}
                </>
              ) : (
                <>
                  {t("next")}
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
