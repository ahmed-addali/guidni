"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_EMOJI: Record<string, string> = {
  CAR:              "🚗",
  BIKE:             "🚲",
  SCOOTER:          "🛵",
  BOAT:             "⛵",
  OTHER:            "🔧",
  AIRPORT_TRANSFER: "✈️",
  TAXI:             "🚕",
  SHUTTLE:          "🚌",
};

export function TransportFilterChips() {
  const t            = useTranslations("TransportPage");
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const activeType = searchParams.get("type") ?? "";

  const clear = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("type");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  if (!activeType) return null;

  const TYPE_LABEL: Record<string, string> = {
    CAR:              t("cars"),
    BIKE:             t("bikes"),
    SCOOTER:          t("scooters"),
    BOAT:             t("boats"),
    OTHER:            t("other"),
    AIRPORT_TRANSFER: t("airportTransfers"),
    TAXI:             t("cityTaxi"),
    SHUTTLE:          t("shuttle"),
  };

  const label = TYPE_LABEL[activeType] ?? activeType;
  const emoji = TYPE_EMOJI[activeType] ?? "";

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={clear}
        className={cn(
          "flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-full text-xs font-medium",
          "bg-primary/10 text-primary border border-primary/20",
          "hover:bg-primary/15 transition-colors cursor-pointer"
        )}
      >
        {emoji && <span className="text-sm leading-none">{emoji}</span>}
        {label}
        <X className="w-3 h-3 shrink-0" />
      </button>
    </div>
  );
}
