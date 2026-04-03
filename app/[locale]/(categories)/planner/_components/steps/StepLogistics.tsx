"use client";

import { useTranslations } from "next-intl";
import { PlaneTakeoff, PlaneLanding, Car, Bike } from "lucide-react";
import type { RentalType, UserPreferences } from "@/lib/planner/types";

type Props = {
  preferences: UserPreferences;
  onChange: (partial: Partial<UserPreferences>) => void;
};

export function StepLogistics({ preferences, onChange }: Props) {
  const t = useTranslations("PlannerStepLogistics");

  const CHECKS: { key: keyof UserPreferences; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      key: "needsAirportPickup",
      label: t("airportPickupLabel"),
      desc:  t("airportPickupDesc"),
      icon: <PlaneLanding className="h-5 w-5" />,
    },
    {
      key: "needsReturnTransfer",
      label: t("returnTransferLabel"),
      desc:  t("returnTransferDesc"),
      icon: <PlaneTakeoff className="h-5 w-5" />,
    },
    {
      key: "needsRental",
      label: t("rentalLabel"),
      desc:  t("rentalDesc"),
      icon: <Car className="h-5 w-5" />,
    },
  ];

  const RENTAL_TYPES: { value: RentalType; label: string; icon: React.ReactNode }[] = [
    { value: "car",     label: t("car"),     icon: <Car  className="h-4 w-4" /> },
    { value: "bike",    label: t("bike"),    icon: <Bike className="h-4 w-4" /> },
    { value: "scooter", label: t("scooter"), icon: <Bike className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-gray-700">{t("title")}</p>
        <p className="text-xs text-gray-400">{t("subtitle")}</p>
      </div>

      {CHECKS.map(({ key, label, desc, icon }) => {
        const checked = !!preferences[key];
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange({ [key]: !checked })}
            className={`w-full flex items-start gap-4 p-5 rounded-2xl border text-left transition-colors ${
              checked ? "bg-primary/5 border-primary" : "bg-white border-gray-200 hover:border-primary/30 hover:bg-gray-50"
            }`}
          >
            <div className={`mt-0.5 h-5 w-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-colors ${
              checked ? "bg-primary border-primary" : "border-gray-300"
            }`}>
              {checked && (
                <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <div className="flex items-start gap-3 min-w-0">
              <span className={`mt-0.5 shrink-0 ${checked ? "text-primary" : "text-gray-400"}`}>{icon}</span>
              <div>
                <p className={`text-sm font-semibold ${checked ? "text-primary" : "text-gray-800"}`}>{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
            </div>
          </button>
        );
      })}

      {preferences.needsRental && (
        <div className="ml-9 space-y-2">
          <p className="text-xs font-semibold text-gray-600">{t("rentalTypeTitle")}</p>
          <div className="flex gap-2">
            {RENTAL_TYPES.map(({ value, label, icon }) => {
              const active = preferences.rentalType === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => onChange({ rentalType: value })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
                    active ? "bg-primary text-white border-primary" : "bg-white border-gray-200 text-gray-600 hover:border-primary/40"
                  }`}
                >
                  {icon}
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
        💡 {t("skipNote")}
      </p>
    </div>
  );
}
