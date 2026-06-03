"use client";

import { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { RotateCcw, AlertTriangle, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { ItineraryBoard } from "../itinerary/ItineraryBoard";
import { BudgetBar } from "../itinerary/BudgetBar";
import { GeneratingSkeleton } from "../GeneratingSkeleton";
import { computeBudget } from "@/lib/planner/budget";
import type { PlanDay, PlanItem, PlanBlock, PlanMultiDayBlock, UserPreferences } from "@/lib/planner/types";

type Props = {
  days:         PlanDay[];
  stays:        PlanMultiDayBlock[];
  rentals:      PlanMultiDayBlock[];
  duration:     number;
  isGenerating: boolean;
  preferences:  UserPreferences;
  locale:       string;
  warnings?:    string[];
  onDaysChange:      (days: PlanDay[]) => void;
  onRegenerate:      () => void;
  onRegenerateDay?:  (dayNumber: number) => void;
  onSwapReject?:     (itemId: string) => void;
  onRemoveBlock?:    (dayNumber: number, blockId: string) => void;
};

export function StepItinerary({
  days,
  stays,
  rentals,
  duration,
  isGenerating,
  preferences,
  locale,
  warnings = [],
  onDaysChange,
  onRegenerate,
  onRegenerateDay,
  onSwapReject,
  onRemoveBlock,
}: Props) {
  const t = useTranslations("PlannerWizard");
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<number>>(new Set());
  const [swapSlot, setSwapSlot] = useState<PlanBlock | null>(null);
  const budget = useMemo(
    () => computeBudget({ days, stays, rentals }, preferences),
    [days, stays, rentals, preferences]
  );

  const handleSwapSelect = useCallback(
    (block: PlanBlock, replacement: PlanItem) => {
      onSwapReject?.(block.item.id);
      const newDays = days.map((day) => ({
        ...day,
        blocks: day.blocks.map((b) =>
          b.id === block.id
            ? { ...b, item: replacement }
            : b
        ),
      }));
      onDaysChange(newDays);
      setSwapSlot(null);
    },
    [days, onDaysChange, onSwapReject]
  );

  if (isGenerating) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <p className="text-sm text-gray-500">Building your personalized itinerary…</p>
        </div>
        <GeneratingSkeleton />
      </div>
    );
  }

  if (days.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-sm mb-4">Your itinerary will appear here once generated.</p>
        <button
          type="button"
          onClick={onRegenerate}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          Generate Itinerary
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Thin-destination warning banners */}
      {warnings.some((_, i) => !dismissedWarnings.has(i)) && (
        <div className="space-y-2">
          {warnings.map((warning, i) =>
            dismissedWarnings.has(i) ? null : (
              <div
                key={i}
                className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3"
              >
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 flex-1 leading-relaxed">{warning}</p>
                <button
                  type="button"
                  onClick={() => setDismissedWarnings((prev) => new Set([...prev, i]))}
                  className="text-amber-400 hover:text-amber-600 transition-colors shrink-0"
                  aria-label="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          )}
        </div>
      )}

      {/* Regenerate button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onRegenerate}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
          Regenerate
        </button>
      </div>

      {/* Budget bar */}
      <BudgetBar
        budget={budget}
        duration={duration}
        budgetLevel={preferences.budget as 1 | 2 | 3 | undefined}
        groupType={preferences.groupType}
      />

      {/* Accommodation section */}
      {stays.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {t("staysTitle")}
          </p>
          <div className="space-y-3">
            {stays.map((block) => {
              const rangeLabel =
                block.fromDay === 1 && block.toDay === duration
                  ? t("allDays", { count: duration })
                  : block.fromDay === block.toDay
                  ? t("dayRangeSingle", { day: block.fromDay })
                  : t("dayRangeMulti", { from: block.fromDay, to: block.toDay });
              return (
                <div key={block.id} className="flex items-center gap-3">
                  <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    {block.item.imageUrl ? (
                      <Image src={block.item.imageUrl} alt={block.item.name} fill className="object-cover" sizes="56px" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-xl">🏨</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{block.item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {block.item.location && (
                        <span className="text-xs text-gray-400 truncate">{block.item.location}</span>
                      )}
                      {block.item.price > 0 && (
                        <span className="text-xs text-gray-500 font-medium">
                          TND {block.item.price}{t("perNight")}
                        </span>
                      )}
                    </div>
                    {block.note && <p className="text-xs text-gray-400 mt-0.5 truncate">{block.note}</p>}
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full shrink-0 whitespace-nowrap">
                    {rangeLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rentals section */}
      {rentals.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {t("rentalsTitle")}
          </p>
          <div className="space-y-3">
            {rentals.map((block) => {
              const rentalDays = block.toDay - block.fromDay + 1;
              const rangeLabel =
                block.fromDay === 1 && block.toDay === duration
                  ? t("allDays", { count: duration })
                  : block.fromDay === block.toDay
                  ? t("dayRangeSingle", { day: block.fromDay })
                  : t("dayRangeMulti", { from: block.fromDay, to: block.toDay });
              return (
                <div key={block.id} className="flex items-center gap-3">
                  <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    {block.item.imageUrl ? (
                      <Image src={block.item.imageUrl} alt={block.item.name} fill className="object-cover" sizes="56px" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-xl">🚗</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{block.item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {block.item.location && (
                        <span className="text-xs text-gray-400 truncate">{block.item.location}</span>
                      )}
                      {block.item.price > 0 && (
                        <span className="text-xs text-gray-500 font-medium">
                          TND {block.item.price}{t("rentalPerDay")}
                        </span>
                      )}
                    </div>
                    {block.note && <p className="text-xs text-gray-400 mt-0.5 truncate">{block.note}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[11px] font-semibold px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full whitespace-nowrap">
                      {rangeLabel}
                    </span>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap">
                      {t("rentalNights", { count: rentalDays })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ItineraryBoard
        days={days}
        preferences={preferences}
        locale={locale}
        isOwner
        hideBudgetBar
        swapSlot={swapSlot}
        onDaysChange={onDaysChange}
        onSwapOpen={setSwapSlot}
        onSwapClose={() => setSwapSlot(null)}
        onSwapSelect={handleSwapSelect}
        onRegenerateDay={onRegenerateDay}
        onRemoveBlock={onRemoveBlock}
      />
    </div>
  );
}
