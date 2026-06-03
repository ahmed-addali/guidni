"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { StayListItem } from "@/types/stay";

const StayMapInner = dynamic(
  () => import("./StayMapInner").then((m) => m.StayMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[60vh] bg-gray-50 rounded-2xl border border-gray-100">
        <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
      </div>
    ),
  }
);

interface Props {
  stays: StayListItem[];
  locale: string;
  perNight: string;
  currency: string;
  viewLabel: string;
  noCoordsBanner?: string;
}

export function StayMapView({ stays, locale, perNight, currency, viewLabel, noCoordsBanner }: Props) {
  const withoutCoords = stays.filter((s) => s.latitude == null || s.longitude == null);

  return (
    <div className="space-y-4">
      {withoutCoords.length > 0 && noCoordsBanner && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2">
          {noCoordsBanner}
        </p>
      )}
      <StayMapInner
        stays={stays}
        locale={locale}
        perNight={perNight}
        currency={currency}
        viewLabel={viewLabel}
      />
    </div>
  );
}
