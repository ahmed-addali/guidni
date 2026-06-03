"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { SlidersHorizontal, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const VEHICLE_TYPES = [
  { value: "CAR",       emoji: "🚗" },
  { value: "MOTORBIKE", emoji: "🏍️" },
  { value: "SCOOTER",   emoji: "🛵" },
  { value: "BICYCLE",   emoji: "🚲" },
  { value: "BOAT",      emoji: "⛵" },
  { value: "QUAD",      emoji: "🏎️" },
  { value: "BUGGY",     emoji: "🪖" },
  { value: "JET_SKI",   emoji: "🌊" },
  { value: "OTHER",     emoji: "🔧" },
] as const;

const TRANSFER_TYPES = [
  { value: "AIRPORT_TRANSFER", emoji: "✈️" },
  { value: "TAXI",             emoji: "🚕" },
  { value: "SHUTTLE",          emoji: "🚌" },
] as const;

type Props = { service: string };

export function TransportFilterSheet({ service }: Props) {
  const t            = useTranslations("TransportPage");
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const activeType = searchParams.get("type") ?? "";
  const hasFilter  = Boolean(activeType);

  const selectType = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (activeType === value) params.delete("type");
      else params.set("type", value);
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams, activeType]
  );

  const clearType = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("type");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  // Chauffeur service has no sub-filter
  if (service === "chauffeur") return null;

  const TYPE_LABEL: Record<string, string> = {
    CAR:              t("cars"),
    MOTORBIKE:        t("motorbikes"),
    SCOOTER:          t("scooters"),
    BICYCLE:          t("bicycles"),
    BOAT:             t("boats"),
    QUAD:             t("quads"),
    BUGGY:            t("buggies"),
    JET_SKI:          t("jetSkis"),
    OTHER:            t("other"),
    AIRPORT_TRANSFER: t("airportTransfers"),
    TAXI:             t("cityTaxi"),
    SHUTTLE:          t("shuttle"),
  };

  const options = service === "rentals" ? VEHICLE_TYPES : TRANSFER_TYPES;
  const sectionLabel = service === "rentals" ? t("vehicleType") : t("transferType");

  return (
    <Sheet>
      <SheetTrigger
        className={cn(
          "flex items-center gap-2 h-11 px-4 rounded-xl border text-sm font-medium transition-all shrink-0 cursor-pointer whitespace-nowrap",
          hasFilter
            ? "border-primary bg-primary/10 text-primary"
            : "border-gray-200 bg-white text-gray-600 hover:border-primary/40 shadow-sm"
        )}
      >
        <SlidersHorizontal className="w-4 h-4" />
        {hasFilter ? `${t("filtersLabel")} · 1` : t("filtersLabel")}
      </SheetTrigger>

      <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-safe max-h-[70vh]">
        <SheetHeader className="px-5 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-semibold text-gray-900">
              {t("filtersLabel")}
            </SheetTitle>
            {hasFilter && (
              <button
                onClick={clearType}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
                {t("clearFilters")}
              </button>
            )}
          </div>
        </SheetHeader>

        <div className="p-5 pb-8 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
            {sectionLabel}
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {options.map(({ value, emoji }) => {
              const isActive = activeType === value;
              return (
                <button
                  key={value}
                  onClick={() => selectType(value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border transition-all cursor-pointer",
                    isActive
                      ? "bg-primary/10 border-primary/20 text-primary"
                      : "bg-white border-gray-100 text-gray-500 hover:border-gray-200 hover:text-gray-700"
                  )}
                >
                  <span className="text-2xl leading-none">{emoji}</span>
                  <span className={cn("text-xs text-center leading-tight", isActive ? "font-semibold" : "font-medium")}>
                    {TYPE_LABEL[value]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
