"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import type { MapActivity } from "./ActivityMapView";

// Dynamically import Leaflet only on the client
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon paths broken by Next.js asset hashing
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function ActivityMapInner({
  activities,
  locale,
}: {
  activities: MapActivity[];
  locale: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const pinned = activities.filter((a) => a.latitude != null && a.longitude != null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Default center: first pinned activity or fallback to world view
    const defaultCenter: [number, number] = pinned.length
      ? [pinned[0].latitude!, pinned[0].longitude!]
      : [25, 45];

    const map = L.map(mapRef.current, {
      center: defaultCenter,
      zoom: pinned.length > 1 ? 10 : 13,
      zoomControl: true,
    });

    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const customIcon = L.divIcon({
      className: "",
      html: `<div style="background:#1e3a8a;color:white;border-radius:50% 50% 50% 0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)"><span style="transform:rotate(45deg);font-size:14px">⚡</span></div>`,
      iconAnchor: [16, 32],
      popupAnchor: [0, -34],
    });

    for (const a of pinned) {
      const img = a.images[0]?.url ?? "/images/empty-cover-img.jpg";
      const href = `/${locale}/activities/${a.slug}`;
      const popup = L.popup({ maxWidth: 220, className: "activity-map-popup" }).setContent(`
        <a href="${href}" style="display:block;text-decoration:none;color:inherit">
          <img src="${img}" alt="${a.title}" style="width:100%;height:100px;object-fit:cover;border-radius:10px 10px 0 0;display:block" />
          <div style="padding:10px 12px 12px">
            <p style="font-weight:600;font-size:13px;color:#111827;margin:0 0 4px;line-height:1.3">${a.title}</p>
            <p style="font-size:12px;color:#1e3a8a;font-weight:700;margin:0">${a.price} TND / person</p>
          </div>
        </a>
      `);

      L.marker([a.latitude!, a.longitude!], { icon: customIcon })
        .addTo(map)
        .bindPopup(popup);
    }

    // Fit bounds to all markers
    if (pinned.length > 1) {
      const bounds = L.latLngBounds(pinned.map((a) => [a.latitude!, a.longitude!]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (pinned.length === 0) {
    return (
      <div className="w-full h-[520px] rounded-2xl bg-gray-100 flex items-center justify-center">
        <p className="text-sm text-gray-400">No location data available for these activities.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-600 shadow-sm">
        {pinned.length} activit{pinned.length !== 1 ? "ies" : "y"} on map
      </div>
    </div>
  );
}
