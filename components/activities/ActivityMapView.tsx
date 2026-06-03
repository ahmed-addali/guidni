"use client";

import dynamic from "next/dynamic";

export type MapActivity = {
  id: string;
  slug: string;
  title: string;
  price: number;
  latitude: number | null;
  longitude: number | null;
  images: { id: string; url: string }[];
  destination?: { slug: string; city: string; country: string } | null;
};

// Leaflet requires client-only rendering — no SSR
const ActivityMapInner = dynamic(() => import("./ActivityMapInner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[520px] rounded-2xl bg-gray-100 animate-pulse flex items-center justify-center">
      <span className="text-sm text-gray-400">Loading map…</span>
    </div>
  ),
});

export function ActivityMapView({ activities, locale }: { activities: MapActivity[]; locale: string }) {
  return <ActivityMapInner activities={activities} locale={locale} />;
}
