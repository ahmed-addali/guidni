"use client";

import { useTranslations } from "next-intl";
import { Wallet, CreditCard, Gem, User, Heart, Users, UsersRound, Building2, Home, Hotel, Tent } from "lucide-react";
import type { AccommodationType, BudgetLevel, GroupType, UserPreferences } from "@/lib/planner/types";

type Props = {
  preferences: UserPreferences;
  onChange: (partial: Partial<UserPreferences>) => void;
};

export function StepBudgetGroup({ preferences, onChange }: Props) {
  const t = useTranslations("PlannerStepBudget");

  const BUDGETS: { value: BudgetLevel; label: string; range: string; icon: React.ReactNode }[] = [
    { value: 1, label: t("budgetLabel"),   range: t("budgetRange"),   icon: <Wallet     className="h-5 w-5" /> },
    { value: 2, label: t("midrangeLabel"), range: t("midrangeRange"), icon: <CreditCard className="h-5 w-5" /> },
    { value: 3, label: t("luxuryLabel"),   range: t("luxuryRange"),   icon: <Gem        className="h-5 w-5" /> },
  ];

  const GROUPS: { value: GroupType; label: string; icon: React.ReactNode }[] = [
    { value: "solo",    label: t("solo"),    icon: <User       className="h-5 w-5" /> },
    { value: "couple",  label: t("couple"),  icon: <Heart      className="h-5 w-5" /> },
    { value: "family",  label: t("family"),  icon: <Users      className="h-5 w-5" /> },
    { value: "friends", label: t("friends"), icon: <UsersRound className="h-5 w-5" /> },
  ];

  const ACCOMMODATIONS: { value: AccommodationType; label: string; desc: string; icon: React.ReactNode }[] = [
    { value: "hotel",     label: t("hotel"),     desc: t("hotelDesc"),     icon: <Hotel    className="h-5 w-5" /> },
    { value: "riad",      label: t("riad"),      desc: t("riadDesc"),      icon: <Building2 className="h-5 w-5" /> },
    { value: "apartment", label: t("apartment"), desc: t("apartmentDesc"), icon: <Home     className="h-5 w-5" /> },
    { value: "hostel",    label: t("hostel"),    desc: t("hostelDesc"),    icon: <Tent     className="h-5 w-5" /> },
  ];

  return (
    <div className="space-y-8">

      {/* Budget */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">{t("budgetTitle")}</label>
        <div className="grid grid-cols-3 gap-3">
          {BUDGETS.map(({ value, label, range, icon }) => {
            const active = preferences.budget === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onChange({ budget: value })}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition-colors ${
                  active ? "bg-primary/5 border-primary text-primary" : "bg-white border-gray-200 text-gray-600 hover:border-primary/40 hover:bg-gray-50"
                }`}
              >
                <span className={active ? "text-primary" : "text-gray-400"}>{icon}</span>
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-xs text-gray-400">{range}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Group */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">{t("groupTitle")}</label>
        <div className="grid grid-cols-4 gap-3">
          {GROUPS.map(({ value, label, icon }) => {
            const active = preferences.groupType === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onChange({ groupType: value })}
                className={`flex flex-col items-center gap-2 py-4 rounded-2xl border text-center transition-colors ${
                  active ? "bg-primary/5 border-primary text-primary" : "bg-white border-gray-200 text-gray-600 hover:border-primary/40 hover:bg-gray-50"
                }`}
              >
                <span className={active ? "text-primary" : "text-gray-400"}>{icon}</span>
                <span className="text-xs font-semibold">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Accommodation */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">{t("accommodationTitle")}</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ACCOMMODATIONS.map(({ value, label, desc, icon }) => {
            const active = preferences.accommodationType === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onChange({ accommodationType: value })}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition-colors ${
                  active ? "bg-primary/5 border-primary text-primary" : "bg-white border-gray-200 text-gray-600 hover:border-primary/40 hover:bg-gray-50"
                }`}
              >
                <span className={active ? "text-primary" : "text-gray-400"}>{icon}</span>
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-xs text-gray-400">{desc}</span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
