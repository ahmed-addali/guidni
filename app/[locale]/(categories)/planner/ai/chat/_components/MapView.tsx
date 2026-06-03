"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef } from "react";
import { useChatPlannerStore } from "@/stores/chatPlannerStore";

const DJERBA_CENTER: [number, number] = [33.8076, 10.8451];
const DEFAULT_ZOOM = 12;

const MARKER_COLORS: Record<string, string> = {
  activity: "#3b82f6",
  restaurant: "#22c55e",
  meal: "#22c55e",
  attraction: "#f59e0b",
  rest: "#f59e0b",
  stay_suggestion: "#a855f7",
  accommodation: "#a855f7",
};

type MarkerData = {
  lat: number;
  lng: number;
  title: string;
  type: string;
  time: string;
  day: number;
};

export function MapView() {
  const plan = useChatPlannerStore((s) => s.plan);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const markers = useMemo<MarkerData[]>(() => {
    if (!plan) return [];
    const result: MarkerData[] = [];
    for (const day of plan.days) {
      for (const slot of day.slots) {
        if (slot.latitude && slot.longitude) {
          result.push({
            lat: slot.latitude, lng: slot.longitude,
            title: slot.title, type: slot.type,
            time: slot.end_time ? `${slot.time}–${slot.end_time}` : slot.time, day: day.day_number,
          });
        }
      }
    }
    return result;
  }, [plan]);

  useEffect(() => {
    if (!mapRef.current || typeof window === "undefined") return;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      if (cancelled || leafletMap.current) return;
      const map = L.map(mapRef.current!, { center: DJERBA_CENTER, zoom: DEFAULT_ZOOM });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      leafletMap.current = map;
      setTimeout(() => map.invalidateSize(), 100);
    })();

    return () => { cancelled = true; if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null; } };
  }, []);

  useEffect(() => {
    if (!leafletMap.current || typeof window === "undefined") return;
    (async () => {
      const L = (await import("leaflet")).default;
      const map = leafletMap.current!;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (markers.length === 0) return;
      for (const m of markers) {
        const color = MARKER_COLORS[m.type] ?? MARKER_COLORS.activity;
        const icon = L.divIcon({
          className: "custom-marker",
          html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:bold">${m.day}</div>`,
          iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -16],
        });
        const marker = L.marker([m.lat, m.lng], { icon }).addTo(map);
        marker.bindPopup(`<div style="min-width:150px"><p style="margin:0;font-weight:600;font-size:13px">${m.title}</p><p style="margin:4px 0 0;font-size:11px;color:#666">Day ${m.day} · ${m.time}</p><span style="display:inline-block;margin-top:4px;padding:2px 8px;font-size:10px;font-weight:600;border-radius:999px;background:${color}15;color:${color}">${m.type}</span></div>`);
        markersRef.current.push(marker);
      }
      const group = L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.1));
    })();
  }, [markers]);

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-4">
        <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <span className="text-4xl">📍</span>
        </div>
        <p className="text-base font-semibold text-gray-900">No locations to show</p>
        <p className="text-sm text-gray-500 max-w-sm">Generate a plan first to see activity locations on the map.</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <div ref={mapRef} className="h-full w-full" />
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl px-3 py-2 z-[1000]">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Legend</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {Object.entries(MARKER_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full border-2 border-white shadow-sm" style={{ background: color }} />
              <span className="text-[10px] text-gray-600 capitalize">{type.replace("_", " ")}</span>
            </div>
          ))}
        </div>
      </div>
      {markers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm z-[1000]">
          <div className="text-center px-6">
            <p className="text-sm font-semibold text-gray-700">No coordinates available</p>
            <p className="text-xs text-gray-500 mt-1">Locations will appear as coordinate data becomes available.</p>
          </div>
        </div>
      )}
    </div>
  );
}
