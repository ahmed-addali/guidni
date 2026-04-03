"use client";

import { useTranslations } from "next-intl";
import {
  Mountain, Waves, Landmark, UtensilsCrossed, TreePine,
  Eye, Map, Paintbrush, Sparkles, ShoppingBag, Users, Music, Compass,
} from "lucide-react";
import type { InterestId, UserPreferences } from "@/lib/planner/types";

type Props = {
  preferences: UserPreferences;
  onChange: (partial: Partial<UserPreferences>) => void;
};

export function StepInterests({ preferences, onChange }: Props) {
  const t = useTranslations("PlannerStepInterests");

  const INTEREST_OPTIONS: { id: InterestId; label: string; icon: React.ReactNode }[] = [
    { id: "adventures",      label: t("adventures"),      icon: <Mountain        className="h-5 w-5" /> },
    { id: "water_sports",    label: t("waterSports"),     icon: <Waves           className="h-5 w-5" /> },
    { id: "culture",         label: t("culture"),         icon: <Landmark        className="h-5 w-5" /> },
    { id: "food_drink",      label: t("foodDrink"),       icon: <UtensilsCrossed className="h-5 w-5" /> },
    { id: "nature_wildlife", label: t("natureWildlife"),  icon: <TreePine        className="h-5 w-5" /> },
    { id: "attractions",     label: t("attractions"),     icon: <Eye             className="h-5 w-5" /> },
    { id: "sightseeing",     label: t("sightseeing"),     icon: <Map             className="h-5 w-5" /> },
    { id: "workshops",       label: t("workshops"),       icon: <Paintbrush      className="h-5 w-5" /> },
    { id: "wellness",        label: t("wellness"),        icon: <Sparkles        className="h-5 w-5" /> },
    { id: "shopping",        label: t("shopping"),        icon: <ShoppingBag     className="h-5 w-5" /> },
    { id: "family_friendly", label: t("familyFriendly"),  icon: <Users           className="h-5 w-5" /> },
    { id: "events",          label: t("events"),          icon: <Music           className="h-5 w-5" /> },
    { id: "trips",           label: t("dayTrips"),        icon: <Compass         className="h-5 w-5" /> },
  ];

  const toggle = (id: InterestId) => {
    const next = preferences.interests.includes(id)
      ? preferences.interests.filter((i) => i !== id)
      : [...preferences.interests, id];
    onChange({ interests: next });
  };

  const count = preferences.interests.length;

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-gray-700">{t("title")}</p>
        <p className="text-xs text-gray-400">
          {t("subtitle")}
          {count > 0 && (
            <span className="text-primary font-semibold ml-1">
              {t("selectedCount", { count })}
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {INTEREST_OPTIONS.map(({ id, label, icon }) => {
          const active = preferences.interests.includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-sm font-medium transition-colors ${
                active
                  ? "bg-primary/5 border-primary text-primary"
                  : "bg-white border-gray-200 text-gray-600 hover:border-primary/40 hover:bg-gray-50"
              }`}
            >
              <span className={`shrink-0 ${active ? "text-primary" : "text-gray-400"}`}>{icon}</span>
              {label}
            </button>
          );
        })}
      </div>

      {count === 0 && (
        <p className="text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2.5 border border-amber-100">
          {t("hint")}
        </p>
      )}
    </div>
  );
}
