"use client";

import { useState, useCallback } from "react";
import { RotateCcw } from "lucide-react";
import { ItineraryBoard } from "../itinerary/ItineraryBoard";
import { GeneratingSkeleton } from "../GeneratingSkeleton";
import type { PlanDay, PlanItem, PlanSlot, UserPreferences } from "@/lib/planner/types";

type Props = {
  days: PlanDay[];
  isGenerating: boolean;
  preferences: UserPreferences;
  locale: string;
  onDaysChange: (days: PlanDay[]) => void;
  onRegenerate: () => void;
};

export function StepItinerary({
  days,
  isGenerating,
  preferences,
  locale,
  onDaysChange,
  onRegenerate,
}: Props) {
  const [swapSlot, setSwapSlot] = useState<PlanSlot | null>(null);

  const handleSwapSelect = useCallback(
    (slot: PlanSlot, replacement: PlanItem) => {
      const newDays = days.map((day) => ({
        ...day,
        slots: day.slots.map((s) =>
          s.id === slot.id
            ? { ...s, item: replacement }
            : s
        ),
      }));
      onDaysChange(newDays);
      setSwapSlot(null);
    },
    [days, onDaysChange]
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

      <ItineraryBoard
        days={days}
        preferences={preferences}
        locale={locale}
        isOwner
        swapSlot={swapSlot}
        onDaysChange={onDaysChange}
        onSwapOpen={setSwapSlot}
        onSwapClose={() => setSwapSlot(null)}
        onSwapSelect={handleSwapSelect}
      />
    </div>
  );
}
