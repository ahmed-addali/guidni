"use client";

import { useState, useTransition, useMemo } from "react";
import { toast } from "sonner";
import { Lock, Sparkles } from "lucide-react";
import { updatePlanPricing } from "@/lib/actions/guide-plan-editor";
import type { PlanType } from "@prisma/client";

interface InitialData {
  planType:    PlanType;
  price:       number;
  previewDays: number;
}

interface Props {
  planId:      string;
  duration:    number;
  initialData: InitialData;
}

export function GuidePlanPricingTab({ planId, duration, initialData }: Props) {
  const [form, setForm] = useState<InitialData>({ ...initialData });
  const [initial]       = useState<InitialData>({ ...initialData });
  const [isPending, startTransition] = useTransition();

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initial),
    [form, initial]
  );

  const isPaid = form.planType === "GUIDE_PAID";

  function handleSave() {
    if (isPaid && (!form.price || form.price <= 0)) {
      toast.error("Enter a price greater than 0");
      return;
    }
    startTransition(async () => {
      const res = await updatePlanPricing(planId, {
        planType:    form.planType as "GUIDE_FREE" | "GUIDE_PAID",
        price:       form.price,
        previewDays: form.previewDays,
      });
      if (!res.success) { toast.error(res.error); return; }
      toast.success("Pricing saved");
    });
  }

  return (
    <div className="max-w-lg space-y-4">

      {/* Unsaved changes banner */}
      {isDirty && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl">
          <p className="text-sm text-amber-800">You have unsaved changes</p>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="px-4 py-1.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save pricing"}
          </button>
        </div>
      )}

      {/* Plan type */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">
        <div>
          <h2 className="font-semibold text-gray-900">Pricing model</h2>
          <p className="text-xs text-gray-400 mt-0.5">Choose how travelers access your plan.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Free */}
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, planType: "GUIDE_FREE" as PlanType }))}
            className={[
              "flex flex-col items-start gap-3 p-5 rounded-2xl border-2 text-left transition-all",
              !isPaid ? "border-primary bg-primary/5" : "border-gray-100 bg-white hover:border-gray-200",
            ].join(" ")}
          >
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors ${!isPaid ? "bg-primary text-white" : "bg-gray-100 text-gray-500"}`}>
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className={`text-sm font-semibold ${!isPaid ? "text-primary" : "text-gray-700"}`}>Free</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">Anyone can access this plan at no cost</p>
            </div>
          </button>

          {/* Paid */}
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, planType: "GUIDE_PAID" as PlanType, price: f.price || 15 }))}
            className={[
              "flex flex-col items-start gap-3 p-5 rounded-2xl border-2 text-left transition-all",
              isPaid ? "border-primary bg-primary/5" : "border-gray-100 bg-white hover:border-gray-200",
            ].join(" ")}
          >
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors ${isPaid ? "bg-primary text-white" : "bg-gray-100 text-gray-500"}`}>
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <p className={`text-sm font-semibold ${isPaid ? "text-primary" : "text-gray-700"}`}>Paid</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">Travelers pay once to unlock the full plan</p>
            </div>
          </button>
        </div>

        {/* Paid-only fields */}
        {isPaid && (
          <div className="space-y-5 pt-2 border-t border-gray-100">

            {/* Price */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Price (TND)
              </label>
              <div className="relative max-w-xs">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400 select-none">
                  TND
                </span>
                <input
                  type="number"
                  min={1}
                  max={999}
                  step={1}
                  value={form.price || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: parseInt(e.target.value, 10) || 0 }))
                  }
                  className="w-full pl-14 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-colors"
                  placeholder="15"
                />
              </div>
            </div>

            {/* Preview days */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Free preview days
              </label>
              <p className="text-xs text-gray-400 mb-3">
                Travelers can read the first N days before buying — helps them decide. ({duration} total days)
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, previewDays: Math.max(1, f.previewDays - 1) }))}
                  disabled={form.previewDays <= 1}
                  className="h-9 w-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-600 disabled:opacity-40 text-lg"
                >
                  −
                </button>
                <span className="text-base font-bold text-gray-900 w-20 text-center">
                  {form.previewDays} {form.previewDays === 1 ? "day" : "days"}
                </span>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, previewDays: Math.min(duration - 1, f.previewDays + 1) }))}
                  disabled={form.previewDays >= duration - 1}
                  className="h-9 w-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-600 disabled:opacity-40 text-lg"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save footer */}
      {isDirty && (
        <button
          onClick={handleSave}
          disabled={isPending}
          className="w-full py-3 bg-primary text-white font-semibold text-sm rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save pricing"}
        </button>
      )}
    </div>
  );
}
