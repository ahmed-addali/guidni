"use client";

import Image from "next/image";
import { X, RefreshCw, Star } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { getSwapAlternatives } from "@/lib/actions/planner";
import type { PlanItem, PlanBlock, UserPreferences } from "@/lib/planner/types";

type Props = {
  slot: PlanBlock | null;
  preferences: UserPreferences;
  destinationId: string;
  existingItemIds: string[];
  onSelect: (slot: PlanBlock, replacement: PlanItem) => void;
  onClose: () => void;
};

/* ── Price delta badge ───────────────────────────────────────────────────────── */

function PriceDelta({ current, alternative }: { current: number; alternative: number }) {
  const delta = alternative - current;

  if (delta === 0) {
    return (
      <span className="text-[11px] font-semibold text-gray-400 shrink-0">same price</span>
    );
  }

  const sign = delta > 0 ? "+" : "−";
  const abs  = Math.abs(delta);

  return (
    <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md shrink-0 ${
      delta > 0
        ? "bg-red-50 text-red-600"
        : "bg-green-50 text-green-600"
    }`}>
      {sign} TND {abs}
    </span>
  );
}

export function SwapSheet({
  slot,
  preferences,
  destinationId,
  existingItemIds,
  onSelect,
  onClose,
}: Props) {
  const [alternatives, setAlternatives] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAlternatives = useCallback(async () => {
    if (!slot) return;
    setLoading(true);
    setAlternatives([]);
    const safeSlotType =
      slot.slotType === "morning" ||
      slot.slotType === "lunch" ||
      slot.slotType === "afternoon" ||
      slot.slotType === "evening"
        ? slot.slotType
        : "morning";

    const result = await getSwapAlternatives({
      itemType: slot.item.type,
      slotType: safeSlotType,
      currentItemId: slot.item.id,
      destinationId,
      preferences,
      existingItemIds,
    });
    if (result.success) setAlternatives(result.data);
    setLoading(false);
  }, [slot, destinationId, preferences, existingItemIds]);

  useEffect(() => {
    if (slot) fetchAlternatives();
  }, [slot, fetchAlternatives]);

  if (!slot) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[70vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-10 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Replace &ldquo;{slot.item.name}&rdquo;
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Best alternatives for this {slot.slotType ?? slot.item.type.toLowerCase()} slot
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4">
          {loading && (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-2xl" />
              ))}
            </div>
          )}

          {!loading && alternatives.length === 0 && (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No alternatives found for this slot</p>
            </div>
          )}

          {!loading && alternatives.length > 0 && (
            <div className="space-y-3">
              {alternatives.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(slot, item)}
                  className="w-full flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl hover:border-primary/30 hover:bg-primary/5 transition-colors text-left"
                >
                  {/* Image */}
                  <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-xl text-gray-300">
                        ✨
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 flex-wrap">
                      {item.rating && (
                        <span className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                          {item.rating.toFixed(1)}
                        </span>
                      )}
                      {item.durationMinutes && (
                        <span>{Math.round(item.durationMinutes / 60)}h</span>
                      )}
                      {item.price > 0 && <span>TND {item.price}</span>}
                      {item.price === 0 && <span className="text-green-600">Free</span>}
                    </div>
                  </div>

                  {/* Price delta vs current item */}
                  <PriceDelta current={slot.item.price} alternative={item.price} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
