"use client";

import { useState } from "react";
import { ArrowRight, Star } from "lucide-react";
import { useChatPlannerStore } from "@/stores/chatPlannerStore";
import { useCurrency } from "@/hooks/useCurrency";

export function AlternativesList() {
  const { plan, alternatives, swapAlternative } = useChatPlannerStore();
  const { convertPrice } = useCurrency();
  const [swapTarget, setSwapTarget] = useState<{ altIdx: number } | null>(null);

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-4">
        <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <span className="text-4xl">🔄</span>
        </div>
        <p className="text-base font-semibold text-gray-900">No alternatives yet</p>
        <p className="text-sm text-gray-500 max-w-sm">Alternatives will appear here after your plan is generated.</p>
      </div>
    );
  }

  if (alternatives.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-4">
        <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <span className="text-4xl">✅</span>
        </div>
        <p className="text-base font-semibold text-gray-900">No alternatives available</p>
        <p className="text-sm text-gray-500 max-w-sm">All suitable options have been included in your plan.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-900">Alternative Suggestions</h3>
        <p className="text-xs text-gray-400 mt-0.5">{alternatives.length} options available to swap in</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {alternatives.map((alt, altIdx) => (
          <div key={alt.id} className="border border-gray-100 rounded-xl overflow-hidden bg-white hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3 p-3">
              {alt.imageUrl ? (
                <div className="h-14 w-14 shrink-0 rounded-xl bg-cover bg-center" style={{ backgroundImage: `url(${alt.imageUrl})` }} />
              ) : (
                <div className="h-14 w-14 shrink-0 rounded-xl bg-gray-100 flex items-center justify-center text-xl text-gray-300">✨</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{alt.name}</p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 flex-wrap">
                  <span className="px-1.5 py-0.5 bg-gray-50 rounded-full text-[10px] font-medium capitalize">{alt.type}</span>
                  {alt.rating && alt.rating > 0 && (
                    <span className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                      {alt.rating.toFixed(1)}
                    </span>
                  )}
                  {alt.price > 0 ? <span>{convertPrice(alt.price).formatted}</span> : <span className="text-green-600">Free</span>}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSwapTarget(swapTarget?.altIdx === altIdx ? null : { altIdx })}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors shrink-0"
              >
                Swap <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {/* Day/slot picker */}
            {swapTarget?.altIdx === altIdx && (
              <div className="border-t border-gray-100 px-3 py-2 bg-gray-50/50">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Replace which activity?</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {plan.days.map((day, dayIdx) =>
                    day.slots.map((slot, slotIdx) => (
                      <button
                        key={`${dayIdx}-${slotIdx}`}
                        type="button"
                        onClick={() => { swapAlternative(dayIdx, slotIdx, alt); setSwapTarget(null); }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-xs rounded-lg hover:bg-white hover:border-primary/20 border border-transparent transition-colors"
                      >
                        <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                          {day.day_number}
                        </span>
                        <span className="text-gray-700 truncate">{slot.title}</span>
                        <span className="text-gray-400 shrink-0">{slot.time}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
