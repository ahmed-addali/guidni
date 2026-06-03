"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { cn } from "@/lib/utils";

interface Props {
  activeSpec?: string;
  activeSort: string;
  activeQuery?: string;
}

export function GuideFilters({ activeSpec, activeSort, activeQuery }: Props) {
  const t        = useTranslations("GuidesListing");
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useSearchParams();
  const [searchVal, setSearchVal] = useState(activeQuery ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const handleSearch = useCallback((value: string) => {
    setSearchVal(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setParam("q", value.trim() || null);
    }, 350);
  }, [params, pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4 mb-8">
      {/* Search input */}
      <div className="relative max-w-sm">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={searchVal}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        {searchVal && (
          <button
            type="button"
            onClick={() => handleSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <FiX className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="space-y-3">
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
    </div>
  );
}
