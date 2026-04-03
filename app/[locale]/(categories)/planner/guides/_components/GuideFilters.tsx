"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface Props {
  activeSpec?: string;
  activeSort: string;
}

export function GuideFilters({ activeSpec, activeSort }: Props) {
  const t       = useTranslations("GuidesListing");
  const router  = useRouter();
  const pathname = usePathname();
  const params  = useSearchParams();

  const SPECIALIZATIONS = [
    { id: "adventures",      label: t("specAdventures") },
    { id: "water_sports",    label: t("specWaterSports") },
    { id: "culture",         label: t("specCulture") },
    { id: "food_drink",      label: t("specFoodDrink") },
    { id: "nature_wildlife", label: t("specNature") },
    { id: "shopping",        label: t("specShopping") },
    { id: "wellness",        label: t("specWellness") },
    { id: "family_friendly", label: t("specFamily") },
    { id: "sightseeing",     label: t("specSightseeing") },
    { id: "workshops",       label: t("specWorkshops") },
  ];

  const SORT_OPTIONS = [
    { id: "featured", label: t("sortFeatured") },
    { id: "plans",    label: t("sortMostPlans") },
    { id: "rated",    label: t("sortTopRated") },
    { id: "newest",   label: t("sortNewest") },
  ];

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value === null) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    router.push(`${pathname}?${next.toString()}`);
  }

  function toggleSpec(id: string) {
    setParam("spec", activeSpec === id ? null : id);
  }

  return (
    <div className="space-y-3 mb-8">
      {/* Specialization chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setParam("spec", null)}
          className={cn(
            "shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors",
            !activeSpec
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          {t("filterAll")}
        </button>
        {SPECIALIZATIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => toggleSpec(id)}
            className={cn(
              "shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors",
              activeSpec === id
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sort row */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 shrink-0">{t("sortBy")}:</span>
        <div className="flex items-center gap-1.5">
          {SORT_OPTIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setParam("sort", id === "featured" ? null : id)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                activeSort === id
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
