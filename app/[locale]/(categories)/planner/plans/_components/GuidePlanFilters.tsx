"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  activeType?: string;
  activeSort: string;
  activeQuery?: string;
  activeDifficulty?: string;
  activeSuitableFor?: string;
  activeMinDuration?: number;
  activeMaxDuration?: number;
  activeMaxPrice?: number;
}

export function GuidePlanFilters({
  activeType,
  activeSort,
  activeQuery,
  activeDifficulty,
  activeSuitableFor,
  activeMinDuration,
  activeMaxDuration,
  activeMaxPrice,
}: Props) {
  const t        = useTranslations("PlansListing");
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useSearchParams();

  const [searchVal, setSearchVal]       = useState(activeQuery ?? "");
  const [showAdvanced, setShowAdvanced] = useState(
    !!(activeDifficulty || activeSuitableFor || activeMinDuration || activeMaxDuration || activeMaxPrice)
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const SORT_OPTIONS = [
    { id: "popular",      label: t("sortPopular") },
    { id: "newest",       label: t("sortNewest") },
    { id: "price_asc",    label: t("sortPriceAsc") },
    { id: "price_desc",   label: t("sortPriceDesc") },
    { id: "duration_asc", label: t("sortDurationAsc") },
  ];

  const DIFFICULTY_OPTIONS = [
    { id: "easy",   label: t("difficultyEasy") },
    { id: "medium", label: t("difficultyMedium") },
    { id: "hard",   label: t("difficultyHard") },
  ];

  const SUITABLE_OPTIONS = [
    { id: "solo",    label: t("suitableSolo") },
    { id: "couple",  label: t("suitableCouple") },
    { id: "family",  label: t("suitableFamily") },
    { id: "friends", label: t("suitableFriends") },
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

  function setParams(updates: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }
    router.push(`${pathname}?${next.toString()}`);
  }

  const handleSearch = useCallback((value: string) => {
    setSearchVal(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setParam("q", value.trim() || null);
    }, 350);
  }, [params, pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasActiveFilters =
    !!activeType ||
    !!activeDifficulty ||
    !!activeSuitableFor ||
    !!activeMinDuration ||
    !!activeMaxDuration ||
    !!activeMaxPrice;

  function clearAllFilters() {
    setSearchVal("");
    router.push(pathname);
  }

  return (
    <div className="space-y-4 mb-8">
      {/* Row 1: Search + Advanced toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
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
              aria-label={t("clearSearch")}
            >
              <FiX className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-colors",
            showAdvanced
              ? "bg-primary text-white border-primary"
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {t("filters")}
          {hasActiveFilters && (
            <span className={cn(
              "inline-flex items-center justify-center h-4 w-4 rounded-full text-[10px] font-bold",
              showAdvanced ? "bg-white/20 text-white" : "bg-primary text-white"
            )}>
              {[activeType, activeDifficulty, activeSuitableFor, activeMinDuration, activeMaxDuration, activeMaxPrice].filter(Boolean).length}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="h-3 w-3" />
            {t("clearAll")}
          </button>
        )}
      </div>

      {/* Row 2: Type + Sort pills */}
      <div className="space-y-3">
        {/* Type chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setParam("type", null)}
            className={cn(
              "shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors",
              !activeType
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {t("typeAll")}
          </button>
          <button
            type="button"
            onClick={() => setParam("type", activeType === "GUIDE_FREE" ? null : "GUIDE_FREE")}
            className={cn(
              "shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors",
              activeType === "GUIDE_FREE"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {t("typeFree")}
          </button>
          <button
            type="button"
            onClick={() => setParam("type", activeType === "GUIDE_PAID" ? null : "GUIDE_PAID")}
            className={cn(
              "shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors",
              activeType === "GUIDE_PAID"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {t("typePaid")}
          </button>

          {/* Divider */}
          <span className="text-gray-200 shrink-0">|</span>

          {/* Sort inline */}
          <span className="text-xs text-gray-400 shrink-0">{t("sortBy")}:</span>
          {SORT_OPTIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setParam("sort", id === "popular" ? null : id)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                activeSort === id
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Advanced filters (expandable) */}
        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-gray-100">
            {/* Duration range */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">{t("durationLabel")}</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={30}
                  placeholder={t("durationMin")}
                  defaultValue={activeMinDuration ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setParam("minDur", v || null);
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <span className="text-gray-400 text-xs shrink-0">{t("durationTo")}</span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  placeholder={t("durationMax")}
                  defaultValue={activeMaxDuration ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setParam("maxDur", v || null);
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Max price */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">{t("maxPriceLabel")}</p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">TND</span>
                <input
                  type="number"
                  min={0}
                  placeholder={t("maxPricePlaceholder")}
                  defaultValue={activeMaxPrice ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setParam("maxPrice", v || null);
                  }}
                  className="w-full pl-12 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">{t("difficultyLabel")}</p>
              <div className="flex flex-wrap gap-1.5">
                {DIFFICULTY_OPTIONS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setParam("difficulty", activeDifficulty === id ? null : id)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                      activeDifficulty === id
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Suitable for */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">{t("suitableForLabel")}</p>
              <div className="flex flex-wrap gap-1.5">
                {SUITABLE_OPTIONS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setParam("for", activeSuitableFor === id ? null : id)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                      activeSuitableFor === id
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
        )}
      </div>
    </div>
  );
}
