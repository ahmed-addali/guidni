"use client";

import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { useMemo, useCallback } from "react";
import { DayColumn } from "./DayColumn";
import { SwapSheet } from "./SwapSheet";
import { BudgetBar } from "./BudgetBar";
import { computeBudget } from "@/lib/planner/budget";
import type {
  PlanDay,
  PlanItem,
  PlanSlot,
  TimeSlot,
  UserPreferences,
} from "@/lib/planner/types";

// Type enforcement: which item types can go in which slot
const ALLOWED_TYPES: Record<TimeSlot, string[]> = {
  morning:   ["ACTIVITY", "ATTRACTION"],
  lunch:     ["RESTAURANT", "ACTIVITY", "ATTRACTION"],
  afternoon: ["ACTIVITY", "ATTRACTION", "STAY"],
  evening:   ["RESTAURANT", "ACTIVITY", "ATTRACTION"],
};

function parseDroppableId(id: string): { dayNumber: number; slotType: TimeSlot } | null {
  const match = id.match(/^day-(\d+)-(\w+)$/);
  if (!match) return null;
  return {
    dayNumber: parseInt(match[1], 10),
    slotType:  match[2] as TimeSlot,
  };
}

type Props = {
  days: PlanDay[];
  preferences: UserPreferences;
  locale: string;
  isOwner?: boolean;
  swapSlot: PlanSlot | null;
  onDaysChange: (days: PlanDay[]) => void;
  onSwapOpen: (slot: PlanSlot) => void;
  onSwapClose: () => void;
  onSwapSelect: (slot: PlanSlot, replacement: PlanItem) => void;
  onRegenerateDay?: (dayNumber: number) => void;
};

export function ItineraryBoard({
  days,
  preferences,
  locale,
  isOwner,
  swapSlot,
  onDaysChange,
  onSwapOpen,
  onSwapClose,
  onSwapSelect,
  onRegenerateDay,
}: Props) {
  const budget = useMemo(() => computeBudget(days, preferences), [days, preferences]);

  // Flat list of all existing item IDs for swap alternatives exclusion
  const existingItemIds = useMemo(
    () => days.flatMap((d) => d.slots.map((s) => s.item.id)),
    [days]
  );

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination || !isOwner) return;

      const { source, destination, draggableId } = result;
      if (source.droppableId === destination.droppableId && source.index === destination.index) return;

      const srcParsed = parseDroppableId(source.droppableId);
      const dstParsed = parseDroppableId(destination.droppableId);
      if (!srcParsed || !dstParsed) return;

      // Find the slot being moved
      const srcDay = days.find((d) => d.dayNumber === srcParsed.dayNumber);
      const movingSlot = srcDay?.slots.find((s) => s.id === draggableId);
      if (!movingSlot) return;

      // Enforce type constraint
      if (!ALLOWED_TYPES[dstParsed.slotType]?.includes(movingSlot.item.type)) return;

      // Build new days array immutably
      const newDays = days.map((day) => {
        let slots = [...day.slots];

        // Remove from source
        if (day.dayNumber === srcParsed.dayNumber) {
          slots = slots.filter((s) => s.id !== draggableId);
        }

        // Insert at destination
        if (day.dayNumber === dstParsed.dayNumber) {
          const updatedSlot: PlanSlot = {
            ...movingSlot,
            slotType: dstParsed.slotType,
          };
          const slotsOfType = slots.filter((s) => s.slotType === dstParsed.slotType);
          const otherSlots = slots.filter((s) => s.slotType !== dstParsed.slotType);

          // Insert at destination.index within the slot type group
          slotsOfType.splice(destination.index, 0, updatedSlot);

          // Re-merge maintaining time order: morning → lunch → afternoon → evening
          const order: TimeSlot[] = ["morning", "lunch", "afternoon", "evening"];
          slots = order.flatMap((st) =>
            st === dstParsed.slotType
              ? slotsOfType
              : otherSlots.filter((s) => s.slotType === st)
          );
        }

        return { ...day, slots };
      });

      onDaysChange(newDays);
    },
    [days, isOwner, onDaysChange]
  );

  return (
    <>
      <BudgetBar budget={budget} />

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="space-y-4">
          {days.map((day) => (
            <DayColumn
              key={day.dayNumber}
              day={day}
              locale={locale}
              isOwner={isOwner}
              onSwap={onSwapOpen}
              onRegenerateDay={onRegenerateDay}
            />
          ))}
        </div>
      </DragDropContext>

      {/* Swap sheet */}
      {swapSlot && (
        <SwapSheet
          slot={swapSlot}
          preferences={preferences}
          destinationId={preferences.destinationId}
          existingItemIds={existingItemIds}
          onSelect={onSwapSelect}
          onClose={onSwapClose}
        />
      )}
    </>
  );
}
