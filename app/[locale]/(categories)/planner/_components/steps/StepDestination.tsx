"use client";

import { useTranslations } from "next-intl";
import { Leaf, Zap, Flame } from "lucide-react";
import { format, parseISO } from "date-fns";
import { DatePickerInput } from "@/components/shared/DatePickerInput";
import { DestinationInput } from "@/components/shared/DestinationInput";
import type { TravelStyle, UserPreferences } from "@/lib/planner/types";

type DestinationOption = {
  id: string;
  slug: string;
  city: string;
  country: string;
};

type Props = {
  preferences: UserPreferences;
  destinations: DestinationOption[];
  onChange: (partial: Partial<UserPreferences>) => void;
};

const DURATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14];

export function StepDestination({ preferences, destinations, onChange }: Props) {
  const t = useTranslations("PlannerStepDestination");

  const STYLES: { value: TravelStyle; label: string; desc: string; icon: React.ReactNode }[] = [
    { value: "relaxed",  label: t("styleRelaxed"),  desc: t("styleRelaxedDesc"),  icon: <Leaf  className="h-5 w-5" /> },
    { value: "balanced", label: t("styleBalanced"), desc: t("styleBalancedDesc"), icon: <Zap   className="h-5 w-5" /> },
    { value: "active",   label: t("styleActive"),   desc: t("styleActiveDesc"),   icon: <Flame className="h-5 w-5" /> },
  ];

  // Date value for DatePickerInput
  const selectedDate = preferences.startDate ? parseISO(preferences.startDate) : undefined;

  return (
    <div className="space-y-8">

      {/* Destination — country + city */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">{t("whereGoing")}</label>
        <DestinationInput
          destinations={destinations}
          value={preferences.destinationId}
          onChange={(opt) => onChange({
            destinationId:   opt.id,
            destinationName: `${opt.city}, ${opt.country}`,
            destinationCity: opt.city,
          })}
        />
      </div>

      {/* Arrival date */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">
          {t("whenArriving")}{" "}
          <span className="text-gray-400 font-normal">{t("optional")}</span>
        </label>
        <div className="w-full max-w-xs px-4 py-2.5 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/60 transition-colors bg-white">
          <DatePickerInput
            selected={selectedDate}
            minDate={new Date()}
            placeholder={t("whenArriving")}
            onDateChange={(date) =>
              onChange({ startDate: date ? format(date, "yyyy-MM-dd") : undefined })
            }
          />
        </div>
        <p className="text-xs text-gray-400">{t("dateHelp")}</p>
      </div>

      {/* Duration */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">{t("howManyDays")}</label>
        <div className="flex flex-wrap gap-2">
          {DURATIONS.map((d) => {
            const active = preferences.duration === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => onChange({ duration: d })}
                className={`w-12 h-12 rounded-xl border text-sm font-bold transition-colors ${
                  active ? "bg-primary text-white border-primary" : "bg-white border-gray-200 text-gray-700 hover:border-primary/40"
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* Travel style */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">{t("travelStyle")}</label>
        <div className="grid grid-cols-3 gap-3">
          {STYLES.map(({ value, label, desc, icon }) => {
            const active = preferences.travelStyle === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onChange({ travelStyle: value })}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition-colors ${
                  active ? "bg-primary/5 border-primary text-primary" : "bg-white border-gray-200 text-gray-600 hover:border-primary/40 hover:bg-gray-50"
                }`}
              >
                <span className={active ? "text-primary" : "text-gray-400"}>{icon}</span>
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-xs text-gray-400 leading-tight">{desc}</span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
