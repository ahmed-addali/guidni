"use client";

import { useCallback, useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { HiViewGrid } from "react-icons/hi";
import { MdPeople } from "react-icons/md";
import { STAY_CATEGORIES } from "@/lib/utils/stay-categories";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CounterInput } from "@/components/shared/CounterInput";
import { cn } from "@/lib/utils";

type Labels = {
  filterCategories: string;
  filterPrice: string;
  filterPriceMin: string;
  filterPriceMax: string;
  filterGuests: string;
  filterGuestsAny: string;
};

type Props = {
  locale: string;
  allLabel: string;
  filtersLabel: string;
  clearLabel: string;
  labels: Labels;
};

export function StayFilterSheet({ locale, allLabel, filtersLabel, clearLabel, labels }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const categoryParam = searchParams.get("category") ?? "";
  const selected = categoryParam ? categoryParam.split(",").filter(Boolean) : [];

  const [priceMin, setPriceMin] = useState(searchParams.get("priceMin") ?? "");
  const [priceMax, setPriceMax] = useState(searchParams.get("priceMax") ?? "");
  const [minGuests, setMinGuests] = useState(parseInt(searchParams.get("minGuests") ?? "1", 10) || 1);

  // Sync from URL when searchParams change (e.g. on clear)
  useEffect(() => {
    setPriceMin(searchParams.get("priceMin") ?? "");
    setPriceMax(searchParams.get("priceMax") ?? "");
    setMinGuests(parseInt(searchParams.get("minGuests") ?? "1", 10) || 1);
  }, [searchParams]);

  const activeCount =
    selected.length +
    (priceMin || priceMax ? 1 : 0) +
    (minGuests > 1 ? 1 : 0);

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

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (priceMin) params.set("priceMin", priceMin); else params.delete("priceMin");
    if (priceMax) params.set("priceMax", priceMax); else params.delete("priceMax");
    if (minGuests > 1) params.set("minGuests", String(minGuests)); else params.delete("minGuests");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams, priceMin, priceMax, minGuests]);

  const clearAll = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.delete("priceMin");
    params.delete("priceMax");
    params.delete("minGuests");
    params.delete("page");
    setPriceMin("");
    setPriceMax("");
    setMinGuests(1);
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const loc = locale as "en" | "fr" | "ar";
  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

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

        <div className="overflow-y-auto p-5 pb-8 space-y-6">
          {/* ── Categories ── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{labels.filterCategories}</p>
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

              {STAY_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
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
                      {cat.label[loc]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Price range ── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{labels.filterPrice}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-500">{labels.filterPriceMin}</label>
                <input
                  type="number"
                  min={0}
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  onBlur={applyFilters}
                  placeholder="0"
                  className={inputCls}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">{labels.filterPriceMax}</label>
                <input
                  type="number"
                  min={0}
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  onBlur={applyFilters}
                  placeholder="∞"
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* ── Guests ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{labels.filterGuests}</p>
              {minGuests > 1 && (
                <span className="text-xs text-primary font-medium flex items-center gap-1">
                  <MdPeople className="w-3.5 h-3.5" />
                  {minGuests}+
                </span>
              )}
            </div>
            <CounterInput
              value={minGuests}
              onChange={(v) => {
                setMinGuests(v);
                const params = new URLSearchParams(searchParams.toString());
                if (v > 1) params.set("minGuests", String(v)); else params.delete("minGuests");
                params.delete("page");
                router.push(`${pathname}?${params.toString()}`);
              }}
              min={1}
              max={20}
            />
            {minGuests === 1 && (
              <p className="text-xs text-gray-400">{labels.filterGuestsAny}</p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
