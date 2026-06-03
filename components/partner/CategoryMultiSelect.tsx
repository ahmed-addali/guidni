"use client";

import { useTranslations } from "next-intl";
import { FiCheck } from "react-icons/fi";

export const ACTIVITY_CATEGORIES = [
  "Water Sports",
  "Desert",
  "Culture & History",
  "Food & Drink",
  "Adventure",
  "Wellness & Spa",
  "Nature & Wildlife",
  "Night Life",
  "Other",
] as const;

type Props = {
  value: string[];
  onChange: (cats: string[]) => void;
  error?: string;
};

export function CategoryMultiSelect({ value, onChange, error }: Props) {
  const t = useTranslations("Components.categoryMultiSelect");

  function toggle(cat: string) {
    if (value.includes(cat)) {
      onChange(value.filter((c) => c !== cat));
    } else {
      onChange([...value, cat]);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ACTIVITY_CATEGORIES.map((cat) => {
          const active = value.includes(cat);
          return (
            <button
              key={cat}
              type="button"
              onClick={() => toggle(cat)}
              className={`text-sm px-4 py-3 rounded-xl border font-medium text-left transition-all ${
                active
                  ? "bg-primary/10 text-primary border-primary/30 ring-2 ring-primary/20"
                  : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400"
              }`}
            >
              {active && <FiCheck className="h-3.5 w-3.5 inline me-1.5 mb-0.5" />}
              {t(cat as Parameters<typeof t>[0])}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
