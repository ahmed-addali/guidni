"use client";

import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";

export function GeneratingSkeleton() {
  const t = useTranslations("PlannerWizard");

  return (
    <div className="space-y-6">
      {/* Animated generating indicator */}
      <div className="flex flex-col items-center justify-center py-10 gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <div className="absolute -inset-1 rounded-2xl border-2 border-primary/20 animate-ping" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-800">{t("generatingTitle")}</p>
          <p className="text-xs text-gray-400 mt-1">{t("generatingSubtitle")}</p>
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
                <div key={slot} className="flex items-stretch gap-0 border border-gray-100 rounded-2xl overflow-hidden h-20">
                  <div className="w-8 bg-gray-50" />
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
