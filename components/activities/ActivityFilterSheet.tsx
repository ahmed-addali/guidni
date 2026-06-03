"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { HiViewGrid } from "react-icons/hi";
import { ACTIVITY_CATEGORIES } from "@/lib/utils/activity-categories";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type SortKey     = "popular" | "price_asc" | "price_desc" | "rating" | "newest";
type PriceKey    = "0-50" | "50-150" | "150-300" | "300+";
type DurationKey = "short" | "half" | "full" | "multi";

type Props = {
  locale: string;
  allLabel: string;
  filtersLabel: string;
  clearLabel: string;
  sortLabel: string;
  sortOptions: Record<SortKey, string>;
  priceLabel: string;
  priceOptions: Record<PriceKey, string>;
  durationLabel: string;
  durationOptions: Record<DurationKey, string>;
};

export function ActivityFilterSheet({
  locale,
  allLabel,
  filtersLabel,
  clearLabel,
  sortLabel,
  sortOptions,
  priceLabel,
  priceOptions,
  durationLabel,
  durationOptions,
}: Props) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const categoryParam  = searchParams.get("category")   ?? "";
  const sortParam      = searchParams.get("sort")        ?? "";
  const priceParam     = searchParams.get("priceRange")  ?? "";
  const durationParam  = searchParams.get("duration")    ?? "";

  const selected = categoryParam ? categoryParam.split(",").filter(Boolean) : [];

  // Count active non-category filters
  const extraCount = [sortParam, priceParam, durationParam].filter(Boolean).length;
  const activeCount = selected.length + extraCount;

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const toggleCategory = useCallback(
    (id: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id === null) {
        params.delete("category");
      } else {
        const next = selected.includes(id)
          ? selected.filter((v) => v !== id)
          : [...selected, id];
        if (next.length > 0) params.set("category", next.join(","));
        else params.delete("category");
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams, selected]
  );

  const clearAll = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.delete("sort");
    params.delete("priceRange");
    params.delete("duration");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  return (
    <Sheet>
      <SheetTrigger
        className={cn(
          "flex items-center gap-2 h-11 px-4 rounded-xl border text-sm font-medium transition-all shrink-0 cursor-pointer whitespace-nowrap",
          activeCount > 0
            ? "border-primary bg-primary/10 text-primary"
            : "border-gray-200 bg-white text-gray-600 hover:border-primary/40 shadow-sm"
        )}
      >
        <SlidersHorizontal className="w-4 h-4" />
        {activeCount > 0 ? `${filtersLabel} · ${activeCount}` : filtersLabel}
      </SheetTrigger>

      <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-safe max-h-[85vh]">
        <SheetHeader className="px-5 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-semibold text-gray-900">
              {filtersLabel}
            </SheetTitle>
            {activeCount > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
                {clearLabel}
              </button>
            )}
          </div>
        </SheetHeader>

        <div className="overflow-y-auto p-5 pb-10 space-y-6">

          {/* ── Sort ── */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5">{sortLabel}</p>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(sortOptions) as [SortKey, string][]).map(([key, label]) => {
                const isActive = key === "popular" ? !sortParam : sortParam === key;
                return (
                  <button
                    key={key}
                    onClick={() => setParam("sort", key === "popular" ? null : key)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer",
                      isActive
                        ? "bg-primary/10 border-primary/20 text-primary"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Price range ── */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5">{priceLabel}</p>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(priceOptions) as [PriceKey, string][]).map(([key, label]) => {
                const isActive = priceParam === key;
                return (
                  <button
                    key={key}
                    onClick={() => setParam("priceRange", isActive ? null : key)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer",
                      isActive
                        ? "bg-primary/10 border-primary/20 text-primary"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Duration ── */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5">{durationLabel}</p>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(durationOptions) as [DurationKey, string][]).map(([key, label]) => {
                const isActive = durationParam === key;
                return (
                  <button
                    key={key}
                    onClick={() => setParam("duration", isActive ? null : key)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer",
                      isActive
                        ? "bg-primary/10 border-primary/20 text-primary"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Categories ── */}
          <div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              <button
                onClick={() => toggleCategory(null)}
                className={cn(
                  "flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border transition-all cursor-pointer",
                  selected.length === 0
                    ? "bg-primary/10 border-primary/20 text-primary"
                    : "bg-white border-gray-100 text-gray-500 hover:border-gray-200 hover:text-gray-700"
                )}
              >
                <HiViewGrid className="w-5 h-5" />
                <span className={cn("text-xs text-center leading-tight", selected.length === 0 ? "font-semibold" : "font-medium")}>
                  {allLabel}
                </span>
              </button>

              {ACTIVITY_CATEGORIES.map((cat) => {
                const Icon    = cat.icon;
                const label   = cat.label[locale as "en" | "fr" | "ar"] ?? cat.label.en;
                const isActive = selected.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border transition-all cursor-pointer",
                      isActive
                        ? "bg-primary/10 border-primary/20 text-primary"
                        : "bg-white border-gray-100 text-gray-500 hover:border-gray-200 hover:text-gray-700"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className={cn("text-xs text-center leading-tight", isActive ? "font-semibold" : "font-medium")}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </SheetContent>
    </Sheet>
  );
}
