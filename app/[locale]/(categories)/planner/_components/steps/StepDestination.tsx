"use client";

import { useTranslations } from "next-intl";
import { MapPin, Calendar, Leaf, Zap, Flame } from "lucide-react";
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

  return (
    <div className="space-y-8">

      {/* Destination */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">{t("whereGoing")}</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {destinations.map((dest) => {
            const active = preferences.destinationId === dest.id;
            return (
              <button
                key={dest.id}
                type="button"
                onClick={() => onChange({ destinationId: dest.id, destinationName: `${dest.city}, ${dest.country}`, destinationCity: dest.city })}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                  active ? "bg-primary text-white border-primary" : "bg-white border-gray-200 text-gray-700 hover:border-primary/40 hover:bg-gray-50"
                }`}
              >
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate">{dest.city}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Arrival date */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">
          {t("whenArriving")}{" "}
          <span className="text-gray-400 font-normal">{t("optional")}</span>
        </label>
        <div className="relative max-w-xs">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="date"
            value={preferences.startDate ?? ""}
            onChange={(e) => onChange({ startDate: e.target.value || undefined })}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-colors"
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
