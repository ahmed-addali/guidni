"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Sparkles, MapPin, UtensilsCrossed, Compass,
  Route, PackageCheck,
} from "lucide-react";

const STEPS = [
  { icon: Compass,         key: "generatingStep1", duration: 1.5 },
  { icon: UtensilsCrossed, key: "generatingStep2", duration: 1.2 },
  { icon: Sparkles,        key: "generatingStep3", duration: 1.8 },
  { icon: Route,           key: "generatingStep4", duration: 1.5 },
  { icon: MapPin,          key: "generatingStep5", duration: 1.2 },
  { icon: PackageCheck,    key: "generatingStep6", duration: 1.8 },
] as const;

// Total expected duration in seconds
const TOTAL_DURATION = STEPS.reduce((s, step) => s + step.duration, 0);

export function GeneratingSkeleton() {
  const t = useTranslations("PlannerWizard");
  const [activeStep, setActiveStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  // Advance steps based on each step's individual duration
  useEffect(() => {
    const timeout = setTimeout(() => {
      setActiveStep((s) => (s + 1) % STEPS.length);
    }, STEPS[activeStep].duration * 1000);
    return () => clearTimeout(timeout);
  }, [activeStep]);

  // Elapsed seconds counter — ticks every second
  useEffect(() => {
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Progress percentage — capped at 95% so it never "completes" before the real result arrives
  const progressPct = Math.min(95, (elapsed / TOTAL_DURATION) * 100);

  const Icon = STEPS[activeStep].icon;

  return (
    <div className="space-y-6">

      {/* AI thinking indicator */}
      <div className="flex flex-col items-center justify-center py-8 gap-5">
        {/* Pulsing icon ring */}
        <div className="relative flex items-center justify-center">
          <div className="absolute h-20 w-20 rounded-full bg-primary/10 animate-ping" />
          <div className="absolute h-16 w-16 rounded-full bg-primary/15 animate-pulse" />
          <div className="relative h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Icon className="h-7 w-7 text-white transition-all duration-300" />
          </div>
        </div>

        {/* Cycling message */}
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-gray-800 transition-all duration-300">
            {t(STEPS[activeStep].key)}
          </p>
          <p className="text-xs text-gray-400">{t("generatingSubtitle")}</p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === activeStep
                  ? "h-2 w-6 bg-primary"
                  : i < activeStep
                  ? "h-2 w-2 bg-primary/40"
                  : "h-2 w-2 bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Progress bar + elapsed time */}
        <div className="w-full max-w-xs space-y-1.5">
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Day skeletons */}
      <div className="animate-pulse space-y-5">
        {[1, 2, 3].map((day) => (
          <div key={day} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gray-200" />
                <div className="space-y-1.5">
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-3 w-20 bg-gray-100 rounded" />
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {[1, 2].map((slot) => (
                <div key={slot} className="flex items-stretch border border-gray-100 rounded-2xl overflow-hidden h-20">
                  <div className="w-20 bg-gray-100" />
                  <div className="flex-1 px-4 py-3 space-y-2">
                    <div className="h-3 w-16 bg-gray-200 rounded-full" />
                    <div className="h-4 w-2/3 bg-gray-200 rounded" />
                    <div className="h-3 w-1/2 bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
