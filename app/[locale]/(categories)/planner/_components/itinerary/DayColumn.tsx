"use client";

import { Droppable } from "@hello-pangea/dnd";
import { format, parseISO } from "date-fns";
import { RefreshCw, ChevronDown, ChevronUp, StickyNote } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { SlotCard } from "./SlotCard";
import { ShoppingBlock } from "./ShoppingBlock";
import type { PlanDay, PlanBlock } from "@/lib/planner/types";

type Props = {
  day: PlanDay;
  locale: string;
  isOwner?: boolean;
  onSwap?: (block: PlanBlock) => void;
  onRemoveBlock?: (dayNumber: number, blockId: string) => void;
  onRegenerateDay?: (dayNumber: number) => void;
};

export function DayColumn({ day, locale, isOwner, onSwap, onRemoveBlock, onRegenerateDay }: Props) {
  const t = useTranslations("PlanItinerary");
  // On mobile (<lg), collapse all days except Day 1 to reduce scroll distance
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      return day.dayNumber > 1;
    }
    return false;
  });

  const dateLabel = day.date ? format(parseISO(day.date), "MMM d, yyyy") : null;

  // Blocks are in guide-defined order — no time sort
  const blocks = day.blocks ?? [];

  // Single Droppable zone per day
  const droppableId = `day-${day.dayNumber}`;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      {/* Day header — also acts as tap target on mobile */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="w-full px-5 py-4 border-b border-gray-50 flex items-center justify-between text-left hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">
            {day.dayNumber}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{day.theme}</p>
            <p className="text-xs text-gray-400">
              {dateLabel ? `${dateLabel} · ` : ""}
              {t("itemCount", { count: blocks.length })}
              {collapsed && blocks.length > 0 && (
                <span className="ml-1 text-gray-300">· tap to expand</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isOwner && onRegenerateDay && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRegenerateDay(day.dayNumber); }}
              title={t("regenerateDay")}
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
          <span className="p-1.5 text-gray-400">
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </span>
        </div>
      </button>

      {!collapsed && (
        <div className="p-4 space-y-3">
          {day.notes && (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
              <StickyNote className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800 leading-relaxed">{day.notes}</p>
            </div>
          )}

          {/* Blocks in guide-defined array order — no time sort */}
          <Droppable droppableId={droppableId} isDropDisabled={!isOwner}>
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
                {blocks.map((block, index) => (
                  <SlotCard
                    key={block.id}
                    slot={block}
                    index={index}
                    draggableId={block.id}
                    locale={locale}
                    onSwap={onSwap}
                    onRemove={onRemoveBlock ? (id) => onRemoveBlock(day.dayNumber, id) : undefined}
                    isOwner={isOwner}
                  />
                ))}
                {provided.placeholder}

                {blocks.length === 0 && isOwner && snapshot.isDraggingOver && (
                  <div className="h-14 rounded-xl border-2 border-dashed border-primary/30 flex items-center justify-center">
                    <p className="text-xs text-primary/60">{t("dropHere")}</p>
                  </div>
                )}
              </div>
            )}
          </Droppable>

          {day.shopping && (
            <ShoppingBlock shopping={day.shopping} locale={locale} />
          )}
        </div>
      )}
    </div>
  );
}
