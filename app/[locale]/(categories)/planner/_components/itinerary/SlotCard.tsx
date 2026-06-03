"use client";

import { Draggable } from "@hello-pangea/dnd";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, RefreshCw, Clock, MapPin, X } from "lucide-react";
import type { PlanBlock } from "@/lib/planner/types";

const LOGISTICS_LABEL: Record<string, { label: string; emoji: string }> = {
  ARRIVAL_TRANSFER:   { label: "Arrival Transfer",   emoji: "🛬" },
  DEPARTURE_TRANSFER: { label: "Departure Transfer", emoji: "🛫" },
  CITY_TRANSFER:      { label: "City Transfer",      emoji: "🚕" },
  RENTAL_PICKUP:      { label: "Rental Pickup",      emoji: "🚗" },
  RENTAL_DROPOFF:     { label: "Rental Drop-off",    emoji: "🏁" },
};

type Props = {
  slot: PlanBlock;
  index: number;
  draggableId: string;
  locale: string;
  onSwap?: (block: PlanBlock) => void;
  onRemove?: (blockId: string) => void;
  isOwner?: boolean;
};

export function SlotCard({ slot, index, draggableId, locale, onSwap, onRemove, isOwner }: Props) {
  const t = useTranslations("PlanItinerary");
  const { item } = slot;

  const TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
    ACTIVITY:   { bg: "bg-primary/10",  text: "text-primary",    label: t("typeActivity") },
    ATTRACTION: { bg: "bg-amber-50",    text: "text-amber-700",  label: t("typeAttraction") },
    RESTAURANT: { bg: "bg-green-50",    text: "text-green-700",  label: t("typeRestaurant") },
    TRANSFER:   { bg: "bg-blue-50",     text: "text-blue-700",   label: t("typeTransfer") },
    RENTAL:     { bg: "bg-purple-50",   text: "text-purple-700", label: t("typeRental") },
    STAY:       { bg: "bg-orange-50",   text: "text-orange-700", label: t("typeStay") },
    NOTE:       { bg: "bg-amber-50",    text: "text-amber-700",  label: "Note" },
  };

  const isNote     = item.type === "NOTE";
  const logLabel   = slot.logisticsType ? LOGISTICS_LABEL[slot.logisticsType] : null;

  const SLOT_LABELS: Record<string, string> = {
    morning:   t("slotMorning"),
    lunch:     t("slotLunch"),
    afternoon: t("slotAfternoon"),
    evening:   t("slotEvening"),
    fullday:   "Full Day",
    other:     "",
  };

  const style = TYPE_STYLES[item.type] ?? TYPE_STYLES.ACTIVITY;

  return (
    <Draggable draggableId={draggableId} index={index} isDragDisabled={!isOwner}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...(isNote ? provided.dragHandleProps : {})}
          className={`group border rounded-2xl transition-shadow ${
            isNote ? "bg-amber-50/40 border-amber-100" : "bg-white border-gray-100 hover:shadow-sm"
          } ${
            snapshot.isDragging
              ? "shadow-lg border-primary/30 rotate-1"
              : ""
          }`}
        >
          <div className="flex items-stretch gap-0 overflow-hidden rounded-2xl">
            {/* Drag handle — regular blocks only; NOTE blocks use the whole card */}
            {isOwner && !isNote && (
              <div
                {...provided.dragHandleProps}
                className="flex items-center justify-center w-8 shrink-0 bg-gray-50 border-r border-gray-100 cursor-grab active:cursor-grabbing"
              >
                <div className="flex flex-col gap-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex gap-0.5">
                      <div className="h-1 w-1 rounded-full bg-gray-300" />
                      <div className="h-1 w-1 rounded-full bg-gray-300" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Image — hidden for NOTE type */}
            {!isNote && (
              <div className="relative h-20 w-20 shrink-0 bg-gray-100">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="80px" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-2xl text-gray-300">
                    {logLabel?.emoji ?? (
                      item.type === "RESTAURANT" ? "🍽" :
                      item.type === "ATTRACTION" ? "🏛" :
                      item.type === "TRANSFER"   ? "🚗" :
                      item.type === "RENTAL"     ? "🛵" : "✨"
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 px-4 py-3 min-w-0">
              {isNote ? (
                /* ── Note block layout ── */
                <div className="flex items-start gap-2">
                  <span className="text-base shrink-0 mt-0.5">📝</span>
                  <div className="min-w-0 flex-1">
                    {slot.time && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {slot.time.start}–{slot.time.end}
                        </span>
                      </div>
                    )}
                    <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">{item.name}</p>
                  </div>
                </div>
              ) : (
                /* ── Regular block layout ── */
                <div className="flex items-start gap-2 justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      {/* Logistics label overrides plain type badge */}
                      {logLabel ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700">
                          {logLabel.emoji} {logLabel.label}
                        </span>
                      ) : (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                          {style.label}
                        </span>
                      )}
                      {slot.slotType && SLOT_LABELS[slot.slotType] && (
                        <span className="text-[10px] text-gray-400">
                          {SLOT_LABELS[slot.slotType]}
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>

                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      {slot.time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {slot.time.start}–{slot.time.end}
                        </span>
                      )}
                      {item.location && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </span>
                      )}
                      {item.price > 0 && (
                        <span className="shrink-0 text-gray-500 font-medium">
                          TND {item.price}
                        </span>
                      )}
                      {item.price === 0 && item.priceLabel === "free" && (
                        <span className="shrink-0 text-green-600 font-medium">{t("free")}</span>
                      )}
                    </div>

                    {slot.guideNote && (
                      <div className="mt-2 flex items-start gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
                        <span className="text-amber-500 text-sm shrink-0 mt-px">💡</span>
                        <p className="text-xs text-amber-800 leading-relaxed">{slot.guideNote}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isOwner && onSwap && (
                      <button
                        type="button"
                        onClick={() => onSwap(slot)}
                        title={t("swapItem")}
                        className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {isOwner && onRemove && (
                      <button
                        type="button"
                        onClick={() => onRemove(slot.id)}
                        title={t("removeItem")}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {item.bookingUrl && (
                      <Link
                        href={`/${locale}${item.bookingUrl}`}
                        className="flex items-center gap-1 text-xs text-primary font-medium px-2 py-1.5 hover:bg-primary/5 rounded-lg transition-colors whitespace-nowrap"
                      >
                        {t("book")} <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
