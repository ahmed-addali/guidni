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
  PlanBlock,
  PlanMultiDayBlock,
  UserPreferences,
} from "@/lib/planner/types";

function parseDayDroppableId(id: string): number | null {
  const match = id.match(/^day-(\d+)$/);
  if (!match) return null;
  return parseInt(match[1], 10);
}

type Props = {
  days:        PlanDay[];
  stays?:      PlanMultiDayBlock[];
  rentals?:    PlanMultiDayBlock[];
  preferences: UserPreferences;
  locale:      string;
  isOwner?:    boolean;
  hideBudgetBar?: boolean;
  swapSlot:    PlanBlock | null;
  onDaysChange:  (days: PlanDay[]) => void;
  onSwapOpen:    (block: PlanBlock) => void;
  onSwapClose:   () => void;
  onSwapSelect:  (block: PlanBlock, replacement: PlanItem) => void;
  onRegenerateDay?: (dayNumber: number) => void;
  onRemoveBlock?:   (dayNumber: number, blockId: string) => void;
};

export function ItineraryBoard({
  days,
  stays = [],
  rentals = [],
  preferences,
  locale,
  isOwner,
  hideBudgetBar,
  swapSlot,
  onDaysChange,
  onSwapOpen,
  onSwapClose,
  onSwapSelect,
  onRegenerateDay,
  onRemoveBlock,
}: Props) {
  const budget = useMemo(
    () => computeBudget({ days, stays, rentals }, preferences),
    [days, stays, rentals, preferences]
  );
  const budgetLevel = preferences.budget as 1 | 2 | 3 | undefined;
  const groupType   = preferences.groupType;

  // Flat list of all existing item IDs for swap alternatives exclusion
  const existingItemIds = useMemo(
    () => days.flatMap((d) => d.blocks.map((b) => b.item.id)),
    [days]
  );

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination || !isOwner) return;

      const { source, destination, draggableId } = result;
      if (source.droppableId === destination.droppableId && source.index === destination.index) return;

      const srcDayNumber = parseDayDroppableId(source.droppableId);
      const dstDayNumber = parseDayDroppableId(destination.droppableId);
      if (!srcDayNumber || !dstDayNumber) return;

      // Find the block being moved — blocks are in array order (no time sort)
      const srcDay = days.find((d) => d.dayNumber === srcDayNumber);
      if (!srcDay) return;
      const movingBlock = srcDay.blocks[source.index];
      if (!movingBlock || movingBlock.id !== draggableId) return;

      // Build new days array immutably
      const newDays = days.map((day) => {
        const blocks = [...day.blocks];

        if (srcDayNumber === dstDayNumber) {
          // Same-day reorder: splice in array order
          blocks.splice(source.index, 1);
          blocks.splice(destination.index, 0, movingBlock);
          return { ...day, blocks };
        }

        // Cross-day: remove from source day
        if (day.dayNumber === srcDayNumber) {
          return { ...day, blocks: blocks.filter((b) => b.id !== draggableId) };
        }

        // Cross-day: insert into destination day at target index
        if (day.dayNumber === dstDayNumber) {
          blocks.splice(destination.index, 0, movingBlock);
          return { ...day, blocks };
        }

        return day;
      });

      onDaysChange(newDays);
    },
    [days, isOwner, onDaysChange]
  );

  return (
    <>
      {!hideBudgetBar && (
        <BudgetBar
          budget={budget}
          duration={days.length}
          budgetLevel={budgetLevel}
          groupType={groupType}
        />
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="space-y-4">
          {days.map((day) => (
            <DayColumn
              key={day.dayNumber}
              day={day}
              locale={locale}
              isOwner={isOwner}
              onSwap={onSwapOpen}
              onRemoveBlock={onRemoveBlock}
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
