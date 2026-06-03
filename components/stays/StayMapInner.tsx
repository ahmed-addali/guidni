"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import { FiMapPin } from "react-icons/fi";
import type { StayListItem } from "@/types/stay";

// Inline-styled price pin — avoids Leaflet default icon path issue
function createPriceIcon(price: number, currency: string) {
  const label = `${price} ${currency}`;
  return L.divIcon({
    className: "",
    html: `<div style="background:#1e3a8a;color:#fff;font-size:11px;font-weight:700;padding:4px 9px;border-radius:9999px;box-shadow:0 2px 8px rgba(0,0,0,.3);border:2px solid #fff;white-space:nowrap;cursor:pointer">${label}</div>`,
    iconSize: undefined,
    iconAnchor: [0, 8],
    popupAnchor: [30, -8],
  });
}

interface Props {
  stays: StayListItem[];
  locale: string;
  perNight: string;
  currency: string;
  viewLabel: string;
}

export function StayMapInner({ stays, locale, perNight, currency, viewLabel }: Props) {
  const mapped = stays.filter((s) => s.latitude != null && s.longitude != null);

  // Centroid of all mapped stays
  const center: [number, number] = mapped.length > 0
    ? [
        mapped.reduce((sum, s) => sum + s.latitude!, 0) / mapped.length,
        mapped.reduce((sum, s) => sum + s.longitude!, 0) / mapped.length,
      ]
    : [33.8869, 9.5375]; // Tunisia default

  const zoom = mapped.length > 0 ? 11 : 6;

  // Fix Leaflet icon issue in webpack/Next.js
  useEffect(() => {
    // no-op: we use divIcon so the default icon issue doesn't apply
  }, []);

  if (mapped.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] bg-gray-50 rounded-2xl border border-gray-100 gap-3">
        <FiMapPin className="h-10 w-10 text-gray-300" />
        <p className="text-sm text-gray-400">No stays with map coordinates.</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom
      style={{ height: "60vh", width: "100%", borderRadius: "1rem", zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {mapped.map((stay) => {
        const title = stay.title;
        const coverUrl = stay.images[0]?.url ?? null;
        return (
          <Marker
            key={stay.id}
            position={[stay.latitude!, stay.longitude!]}
            icon={createPriceIcon(stay.price, currency)}
          >
            <Popup minWidth={180} maxWidth={200}>
              <div className="space-y-1.5 p-1">
                {coverUrl && (
                  <img
                    src={coverUrl}
                    alt={title}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                )}
                <p className="font-semibold text-gray-900 text-xs leading-snug line-clamp-2">{title}</p>
                {stay.destination?.city && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <FiMapPin className="h-3 w-3 shrink-0" />
                    {stay.destination.city}
                  </p>
                )}
                <p className="text-xs font-bold text-gray-900">
                  {stay.price} {currency}
                  <span className="font-normal text-gray-400 ml-1">{perNight}</span>
                </p>
                <Link
                  href={`/${locale}/stays/${stay.slug}`}
                  className="block text-xs text-primary font-medium hover:underline mt-1"
                >
                  {viewLabel} →
                </Link>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
