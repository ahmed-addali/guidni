"use client";

import { useCallback } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  Clock,
  MapPin,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useChatPlannerStore } from "@/stores/chatPlannerStore";
import { useCurrency } from "@/hooks/useCurrency";

type Props = {
  userId: string;
};

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  activity:        { bg: "bg-blue-50",   text: "text-blue-700" },
  meal:            { bg: "bg-green-50",  text: "text-green-700" },
  rest:            { bg: "bg-amber-50",  text: "text-amber-700" },
  stay_suggestion: { bg: "bg-purple-50", text: "text-purple-700" },
};

export function PlanView({ userId }: Props) {
  const { currency } = useCurrency();

  const formatPrice = (price: number) => {
    if (currency === "EUR") return `${(price / 3.5).toFixed(1)} €`;
    if (currency === "USD") return `$${(price / 3.0).toFixed(1)}`;
    return `${price} DT`;
  };
  const {
    plan,
    selectedSlotIds,
    reorderSlot,
    toggleSlotSelection,
    clearSelection,
    regenerateSelected,
    isLoading,
  } = useChatPlannerStore();

  const [collapsedDays, setCollapsedDays] = useState<Set<number>>(new Set());

  const toggleDay = (dayIdx: number) => {
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayIdx)) next.delete(dayIdx);
      else next.add(dayIdx);
      return next;
    });
  };

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      const srcParts = result.source.droppableId.split("-");
      const dstParts = result.destination.droppableId.split("-");
      const srcDayIdx = parseInt(srcParts[1], 10);
      const dstDayIdx = parseInt(dstParts[1], 10);

      if (
        srcDayIdx === dstDayIdx &&
        result.source.index === result.destination.index
      )
        return;

      reorderSlot(srcDayIdx, result.source.index, dstDayIdx, result.destination.index);
    },
    [reorderSlot]
  );

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-4">
        <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <span className="text-4xl">🗺️</span>
        </div>
        <div className="space-y-2">
          <p className="text-base font-semibold text-gray-900">
            No plan yet
          </p>
          <p className="text-sm text-gray-500 leading-relaxed max-w-sm">
            Start chatting on the left panel to generate your personalized
            travel plan. It will appear here automatically.
          </p>
        </div>
      </div>
    );
  }

  const selCount = selectedSlotIds.size;

  return (
    <div className="flex flex-col h-full">
      {/* Plan header */}
      <div className="shrink-0 px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Your Itinerary</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {plan.days.length} days ·{" "}
              {plan.days.reduce((a, d) => a + d.slots.length, 0)} activities
              {plan.total_budget > 0 &&
                ` · ~${formatPrice(plan.total_budget)}`}
            </p>
          </div>
          {plan.summary && (
            <div className="hidden xl:block max-w-xs">
              <p className="text-xs text-gray-400 leading-relaxed truncate">
                {plan.summary}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Day-by-day list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <DragDropContext onDragEnd={handleDragEnd}>
          {plan.days.map((day, dayIdx) => {
            const isCollapsed = collapsedDays.has(dayIdx);
            return (
              <div
                key={dayIdx}
                className="bg-white border border-gray-100 rounded-2xl overflow-hidden"
              >
                {/* Day header */}
                <button
                  type="button"
                  onClick={() => toggleDay(dayIdx)}
                  className="w-full px-4 py-3 border-b border-gray-50 flex items-center justify-between text-left hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {day.day_number}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {day.theme || `Day ${day.day_number}`}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {day.date && `${day.date} · `}
                        {day.slots.length} item
                        {day.slots.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <span className="text-gray-400">
                    {isCollapsed ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </span>
                </button>

                {/* Slots */}
                {!isCollapsed && (
                  <Droppable droppableId={`day-${dayIdx}`}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`p-3 space-y-2 min-h-[40px] transition-colors ${
                          snapshot.isDraggingOver
                            ? "bg-primary/5 ring-2 ring-inset ring-primary/20"
                            : ""
                        }`}
                      >
                        {day.slots.map((slot, slotIdx) => {
                          const slotKey =
                            slot.activity_id ??
                            `${slot.title}-${slot.time}`;
                          const isSelected = selectedSlotIds.has(slotKey);
                          const style = TYPE_COLORS[slot.type] ??
                            TYPE_COLORS.activity;

                          return (
                            <Draggable
                              key={`${dayIdx}-${slotIdx}-${slotKey}`}
                              draggableId={`${dayIdx}-${slotIdx}-${slotKey}`}
                              index={slotIdx}
                            >
                              {(dragProvided, dragSnapshot) => (
                                <div
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  className={`group flex items-stretch gap-0 border rounded-xl overflow-hidden transition-all ${
                                    dragSnapshot.isDragging
                                      ? "shadow-lg border-primary/30 rotate-1"
                                      : isSelected
                                        ? "border-primary/40 bg-primary/5"
                                        : "border-gray-100 bg-white hover:shadow-sm"
                                  }`}
                                >
                                  {/* Drag handle */}
                                  <div
                                    {...dragProvided.dragHandleProps}
                                    className="flex items-center justify-center w-7 shrink-0 bg-gray-50 border-r border-gray-100 cursor-grab active:cursor-grabbing"
                                  >
                                    <div className="flex flex-col gap-0.5">
                                      {[0, 1, 2].map((i) => (
                                        <div key={i} className="flex gap-0.5">
                                          <div className="h-1 w-1 rounded-full bg-gray-300" />
                                          <div className="h-1 w-1 rounded-full bg-gray-300" />
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Selection checkbox */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      toggleSlotSelection(slotKey)
                                    }
                                    className="flex items-center justify-center w-8 shrink-0 hover:bg-gray-50 transition-colors"
                                  >
                                    {isSelected ? (
                                      <CheckSquare className="h-4 w-4 text-primary" />
                                    ) : (
                                      <Square className="h-4 w-4 text-gray-300 group-hover:text-gray-400" />
                                    )}
                                  </button>

                                  {/* Image */}
                                  {slot.image ? (
                                    <div
                                      className="h-16 w-16 shrink-0 bg-cover bg-center"
                                      style={{
                                        backgroundImage: `url(${slot.image})`,
                                      }}
                                    />
                                  ) : (
                                    <div className="h-16 w-16 shrink-0 bg-gray-100 flex items-center justify-center text-xl text-gray-300">
                                      {slot.type === "meal"
                                        ? "🍽"
                                        : slot.type === "rest"
                                          ? "😴"
                                          : "✨"}
                                    </div>
                                  )}

                                  {/* Content */}
                                  <div className="flex-1 px-3 py-2 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                      <span
                                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${style.bg} ${style.text}`}
                                      >
                                        {slot.type}
                                      </span>
                                      {slot.category && (
                                        <span className="text-[10px] text-gray-400">
                                          {slot.category}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                      {slot.title}
                                    </p>
                                    <div className="flex items-center gap-2.5 mt-1 text-xs text-gray-400">
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {slot.time}–{slot.end_time}
                                      </span>
                                      {slot.price > 0 && (
                                        <span className="text-gray-500 font-medium">
                                          {formatPrice(slot.price)}
                                        </span>
                                      )}
                                    </div>
                                    {slot.reason && (
                                      <p className="text-[11px] text-gray-400 mt-1 truncate">
                                        💡 {slot.reason}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                )}
              </div>
            );
          })}
        </DragDropContext>

        {/* Tips */}
        {plan.tips.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 space-y-1">
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
              Tips
            </p>
            {plan.tips.map((tip, i) => (
              <p key={i} className="text-xs text-amber-700 leading-relaxed">
                • {tip}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Floating regenerate bar */}
      {selCount > 0 && (
        <div className="shrink-0 px-4 py-3 border-t border-gray-100 bg-gradient-to-r from-primary/5 to-violet-50">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-gray-600">
              <span className="font-semibold text-primary">{selCount}</span>{" "}
              activit{selCount === 1 ? "y" : "ies"} selected
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearSelection}
                className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 rounded-lg transition-colors"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => regenerateSelected(userId)}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <RefreshCw className="h-3 w-3" />
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
