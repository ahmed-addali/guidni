"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { StepDestination } from "./steps/StepDestination";
import { StepInterests } from "./steps/StepInterests";
import { StepBudgetGroup } from "./steps/StepBudgetGroup";
import { StepLogistics } from "./steps/StepLogistics";
import type { UserPreferences } from "@/lib/planner/types";

export const PREVIEW_KEY = "guidni_planner_preview";

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
  locale: string;
  defaultDestinationId?: string;
  defaultDestinationName?: string;
  defaultDestinationCity?: string;
};

export function PlannerWizard({
  destinations,
  locale,
  defaultDestinationId,
  defaultDestinationName,
  defaultDestinationCity,
}: Props) {
  const t = useTranslations("PlannerWizard");
  const router = useRouter();
  const topRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [preferences, setPreferences] = useState<UserPreferences>({
    ...DEFAULT_PREFS,
    destinationId:   defaultDestinationId  ?? "",
    destinationName: defaultDestinationName ?? "",
    destinationCity: defaultDestinationCity ?? "",
  });

  // Restore preferences from a previous session so the user doesn't re-fill the form
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(PREVIEW_KEY);
      if (saved) {
        const { preferences: savedPrefs } = JSON.parse(saved) as { preferences: UserPreferences };
        setPreferences(savedPrefs);
      }
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updatePrefs = useCallback(
    (partial: Partial<UserPreferences>) =>
      setPreferences((p) => ({ ...p, ...partial })),
    []
  );

  const scrollToTop = useCallback(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const STEPS = [
    { label: t("stepDestination"), desc: t("stepDestinationDesc") },
    { label: t("stepInterests"),   desc: t("stepInterestsDesc")   },
    { label: t("stepBudget"),      desc: t("stepBudgetDesc")      },
    { label: t("stepLogistics"),   desc: t("stepLogisticsDesc")   },
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

  const generate = useCallback(() => {
    sessionStorage.setItem(PREVIEW_KEY, JSON.stringify({ preferences }));
    window.scrollTo({ top: 0, behavior: "smooth" });
    router.push(`/${locale}/planner/ai/preview`);
  }, [preferences, locale, router]);

  const goNext = useCallback(() => {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    scrollToTop();
  }, [STEPS.length, scrollToTop]);

  const goBack = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0));
    scrollToTop();
  }, [scrollToTop]);

  const isLastStep = step === STEPS.length - 1;

  return (
    <div ref={topRef} className="scroll-mt-24">

      {/* ── Progress stepper ── */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-0 mb-4">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center">
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
                <div className={`h-0.5 w-16 sm:w-24 rounded-full transition-colors ${i < step ? "bg-primary" : "bg-gray-100"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-baseline gap-2">
          <p className="text-base font-bold text-gray-900">{STEPS[step].label}</p>
          <p className="text-xs text-gray-400">{t("stepOf", { step: step + 1, total: STEPS.length })}</p>
        </div>
        <p className="text-sm text-gray-500 mt-0.5">{STEPS[step].desc}</p>
      </div>

      {/* ── Step content card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 min-h-72">
        {step === 0 && <StepDestination preferences={preferences} destinations={destinations} onChange={updatePrefs} />}
        {step === 1 && <StepInterests   preferences={preferences} onChange={updatePrefs} />}
        {step === 2 && <StepBudgetGroup preferences={preferences} onChange={updatePrefs} />}
        {step === 3 && <StepLogistics   preferences={preferences} onChange={updatePrefs} />}
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

        {isLastStep ? (
          <button
            type="button"
            onClick={generate}
            disabled={!canAdvance()}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="h-4 w-4" />
            {t("generatePlan")}
          </button>
        ) : (
          <button
            type="button"
            onClick={goNext}
            disabled={!canAdvance()}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("next")}
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

    </div>
  );
}
