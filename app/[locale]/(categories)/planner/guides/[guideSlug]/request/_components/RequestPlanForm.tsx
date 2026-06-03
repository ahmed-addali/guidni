"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { format, parseISO } from "date-fns";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CounterInput } from "@/components/shared/CounterInput";
import { DatePickerInput } from "@/components/shared/DatePickerInput";
import { createPlanRequest } from "@/lib/actions/plan-requests";

const INTEREST_KEYS = [
  "interestAdventures",
  "interestWaterSports",
  "interestCulture",
  "interestFoodDrink",
  "interestNatureWildlife",
  "interestSightseeing",
  "interestWellness",
  "interestShopping",
  "interestFamilyFriendly",
  "interestWorkshops",
] as const;

const INTEREST_IDS = [
  "adventures",
  "water_sports",
  "culture",
  "food_drink",
  "nature_wildlife",
  "sightseeing",
  "wellness",
  "shopping",
  "family_friendly",
  "workshops",
] as const;

interface Props {
  guideId: string;
  guideName: string;
  locale: string;
  onSuccess?: (requestId: string) => void;
}

export function RequestPlanForm({ guideId, guideName, locale, onSuccess }: Props) {
  const t = useTranslations("RequestPlanPage");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [duration,   setDuration]   = useState(3);
  const [budget,     setBudget]     = useState(200);
  const [groupSize,  setGroupSize]  = useState(2);
  const [interests,  setInterests]  = useState<string[]>([]);
  const [startDate,  setStartDate]  = useState<Date | undefined>(undefined);
  const [message,    setMessage]    = useState("");

  const firstName = guideName.split(" ")[0];

  function toggleInterest(id: string) {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!message.trim()) {
      toast.error(t("errorNoMessage"));
      return;
    }
    if (interests.length === 0) {
      toast.error(t("errorNoInterests"));
      return;
    }

    startTransition(async () => {
      const result = await createPlanRequest({
        guideId,
        message,
        duration,
        budget,
        groupSize,
        interests,
        startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(t("successToast"));
      onSuccess?.(result.requestId);
      router.push(`/${locale}/my-plans?tab=requests`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Trip details */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-6">
        <h2 className="text-base font-semibold text-gray-900">{t("tripDetailsTitle")}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Duration */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t("durationLabel")}
            </label>
            <CounterInput value={duration} onChange={setDuration} min={1} max={30} />
          </div>

          {/* Group size */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t("groupSizeLabel")}
            </label>
            <CounterInput value={groupSize} onChange={setGroupSize} min={1} max={20} />
          </div>

          {/* Start date */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t("startDateLabel")}{" "}
              <span className="text-gray-400 font-normal">({t("optional")})</span>
            </label>
            <div className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/60 transition-colors bg-white h-11 flex items-center">
              <DatePickerInput
                selected={startDate}
                minDate={new Date()}
                placeholder={t("startDateLabel")}
                onDateChange={setStartDate}
              />
            </div>
          </div>
        </div>

        {/* Budget */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">{t("budgetLabel")}</label>
            <span className="text-sm font-semibold text-gray-900">TND {budget.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min={50}
            max={5000}
            step={50}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>TND 50</span>
            <span>TND 5,000</span>
          </div>
        </div>
      </div>

      {/* Interests */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          {t("interestsTitle")}{" "}
          {interests.length > 0 && (
            <span className="text-xs font-normal text-blue-600 ml-1">
              {t("interestsSelected", { count: interests.length })}
            </span>
          )}
        </h2>
        <div className="flex flex-wrap gap-2">
          {INTEREST_KEYS.map((key, idx) => {
            const id = INTEREST_IDS[idx];
            const selected = interests.includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleInterest(id)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-colors",
                  selected
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {selected && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                {t(key)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Message */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">
          {t("messageTitle", { name: firstName })}
        </h2>
        <p className="text-xs text-gray-400 mb-4 leading-relaxed">{t("messageHint")}</p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("messagePlaceholder")}
          rows={5}
          maxLength={1500}
          className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
        />
        <p className="text-xs text-gray-400 text-right mt-1">{message.length}/1500</p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? t("submittingButton") : t("submitButton", { name: guideName })}
      </button>

    </form>
  );
}
