"use client";

import Link from "next/link";
import { Plane, Car, Bike, ArrowRight } from "lucide-react";
import type { PlanLogisticsBlock } from "@/lib/planner/types";

const LOGISTICS_STYLES: Record<
  string,
  { bg: string; border: string; text: string; label: string }
> = {
  ARRIVAL_TRANSFER:   { bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700",   label: "Arrival Transfer" },
  DEPARTURE_TRANSFER: { bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700",   label: "Departure Transfer" },
  RENTAL_PICKUP:      { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", label: "Rental Pickup" },
  RENTAL_DROPOFF:     { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", label: "Rental Drop-off" },
  CITY_TRANSFER:      { bg: "bg-sky-50",    border: "border-sky-200",    text: "text-sky-700",    label: "City Transfer" },
};

const LOGISTICS_ICONS: Record<string, React.ReactNode> = {
  ARRIVAL_TRANSFER:   <Plane className="h-4 w-4 rotate-[-45deg]" />,
  DEPARTURE_TRANSFER: <Plane className="h-4 w-4 rotate-45" />,
  RENTAL_PICKUP:      <Car className="h-4 w-4" />,
  RENTAL_DROPOFF:     <Car className="h-4 w-4" />,
  CITY_TRANSFER:      <Bike className="h-4 w-4" />,
};

type Props = {
  logistics: PlanLogisticsBlock;
  locale: string;
};

export function LogisticsCard({ logistics, locale }: Props) {
  const { type, item, note } = logistics;
  const style = LOGISTICS_STYLES[type] ?? LOGISTICS_STYLES.CITY_TRANSFER;
  const icon = LOGISTICS_ICONS[type] ?? <Car className="h-4 w-4" />;

  const priceText =
    item.price > 0
      ? `From TND ${item.price}${item.priceLabel ? ` / ${item.priceLabel}` : ""}`
      : "Included";

  return (
    <div className={`rounded-2xl border ${style.border} ${style.bg} px-4 py-3`}>
      <div className="flex items-start gap-3 justify-between">
        <div className="flex items-start gap-3 min-w-0">
          {/* Icon */}
          <span className={`mt-0.5 shrink-0 ${style.text}`}>{icon}</span>

          {/* Content */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-[10px] font-semibold uppercase tracking-wide ${style.text}`}>
                {style.label}
              </span>
            </div>
            <p className={`text-sm font-semibold ${style.text} truncate`}>{item.name}</p>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{note}</p>
            <p className={`text-xs font-medium mt-1 ${style.text}`}>{priceText}</p>
          </div>
        </div>

        {/* Book CTA */}
        {item.bookingUrl && (
          <Link
            href={`/${locale}${item.bookingUrl}`}
            className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border ${style.border} ${style.text} hover:opacity-80 transition-opacity whitespace-nowrap shrink-0`}
          >
            Book <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
