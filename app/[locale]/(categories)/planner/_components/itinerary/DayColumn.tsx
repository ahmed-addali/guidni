"use client";

import { Droppable } from "@hello-pangea/dnd";
import { format, parseISO } from "date-fns";
import { RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { SlotCard } from "./SlotCard";
import { LogisticsCard } from "./LogisticsCard";
import { ShoppingBlock } from "./ShoppingBlock";
import type { PlanDay, PlanSlot } from "@/lib/planner/types";

type Props = {
  day: PlanDay;
  locale: string;
  isOwner?: boolean;
  onSwap?: (slot: PlanSlot) => void;
  onRegenerateDay?: (dayNumber: number) => void;
};

export function DayColumn({ day, locale, isOwner, onSwap, onRegenerateDay }: Props) {
  const t = useTranslations("PlanItinerary");
  const [collapsed, setCollapsed] = useState(false);

  const dateLabel = day.date ? format(parseISO(day.date), "MMM d, yyyy") : null;

  const slotTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      morning:   t("slotMorning"),
      lunch:     t("slotLunch"),
      afternoon: t("slotAfternoon"),
      evening:   t("slotEvening"),
    };
    return map[type] ?? type;
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      {/* Day header */}
      <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">
            {day.dayNumber}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{day.theme}</p>
            <p className="text-xs text-gray-400">
              {dateLabel ? `${dateLabel} · ` : ""}
              {t("itemCount", { count: day.slots.length })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isOwner && onRegenerateDay && (
            <button
              type="button"
              onClick={() => onRegenerateDay(day.dayNumber)}
              title={t("regenerateDay")}
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="p-4 space-y-3">
          {day.notes && (
            <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
              {day.notes}
            </p>
          )}

          {day.logistics && (
            <LogisticsCard logistics={day.logistics} locale={locale} />
          )}

          {(["morning", "lunch", "afternoon", "evening"] as const).map((slotType) => {
            const slotsOfType = day.slots.filter((s) => s.slotType === slotType);
            if (slotsOfType.length === 0 && !isOwner) return null;

            return (
              <Droppable
                key={`day-${day.dayNumber}-${slotType}`}
                droppableId={`day-${day.dayNumber}-${slotType}`}
                isDropDisabled={!isOwner}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2 min-h-[4px] rounded-xl transition-colors ${
                      snapshot.isDraggingOver && isOwner
                        ? "bg-primary/5 ring-2 ring-primary/20 p-1"
                        : ""
                    }`}
                  >
                    {slotsOfType.length > 0 && (
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1">
                        {slotTypeLabel(slotType)}
                      </p>
                    )}

                    {slotsOfType.map((slot, index) => (
                      <SlotCard
                        key={slot.id}
                        slot={slot}
                        index={index}
                        draggableId={slot.id}
                        locale={locale}
                        onSwap={onSwap}
                        isOwner={isOwner}
                      />
                    ))}
                    {provided.placeholder}

                    {slotsOfType.length === 0 && isOwner && snapshot.isDraggingOver && (
                      <div className="h-14 rounded-xl border-2 border-dashed border-primary/30 flex items-center justify-center">
                        <p className="text-xs text-primary/60">{t("dropHere")}</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            );
          })}

          {day.shopping && (
            <ShoppingBlock shopping={day.shopping} locale={locale} />
          )}
        </div>
      )}
    </div>
  );
}
