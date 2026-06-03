"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { TAXES, SERVICE_FEE } from "@/lib/constants/payments";

// ─── Activity variant ─────────────────────────────────────────────────────────

interface ActivityMiniSummaryProps {
  title: string;
  coverImageUrl?: string;
  price: number;
  date: string;
  time: string;
  adults: number;
  children: number;
  locale: string;
  labels: {
    adults: string;
    children: string;
    perPerson: string;
    taxes: string;
    serviceFee: string;
    total: string;
  };
}

export function ActivityMiniSummaryBar({
  title,
  coverImageUrl,
  price,
  date,
  time,
  adults,
  children,
  locale,
  labels,
}: ActivityMiniSummaryProps) {
  const [open, setOpen] = useState(false);

  const subtotal = (adults + children) * price;
  const total = subtotal + TAXES + SERVICE_FEE;

  const localeMap: Record<string, string> = { en: "en-GB", fr: "fr-FR", ar: "ar-TN" };
  const displayDate = new Date(date).toLocaleDateString(localeMap[locale] ?? "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="lg:hidden sticky top-16 z-30 bg-white border-b border-gray-100 -mx-4 px-4 py-3 shadow-sm">
      {/* Collapsed row */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          {coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImageUrl}
              alt={title}
              className="h-10 w-14 rounded-lg object-cover shrink-0"
            />
          )}
          <span className="text-sm font-medium text-gray-900 truncate">{title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold text-primary">{total} TND</span>
          {open ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded breakdown */}
      {open && (
        <div className="mt-3 space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>{displayDate} · {time}</span>
            <span>
              {adults} {labels.adults}
              {children > 0 ? `, ${children} ${labels.children}` : ""}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span>
              {adults + children} × {price} TND {labels.perPerson}
            </span>
            <span>{subtotal} TND</span>
          </div>
          <div className="flex justify-between">
            <span>{labels.taxes}</span>
            <span>{TAXES} TND</span>
          </div>
          <div className="flex justify-between">
            <span>{labels.serviceFee}</span>
            <span>{SERVICE_FEE} TND</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold text-gray-900">
            <span>{labels.total}</span>
            <span>{total} TND</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stay variant ─────────────────────────────────────────────────────────────

interface StayMiniSummaryProps {
  title: string;
  coverImageUrl?: string;
  pricePerNight: number;
  cleaningFee?: number;
  serviceFee?: number;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  locale: string;
  labels: {
    nights: string;
    adults: string;
    children: string;
    perNight: string;
    cleaningFee: string;
    serviceFee: string;
    taxes: string;
    total: string;
  };
}

export function StayMiniSummaryBar({
  title,
  coverImageUrl,
  pricePerNight,
  cleaningFee = 0,
  serviceFee = 0,
  checkIn,
  checkOut,
  nights,
  adults,
  children,
  locale,
  labels,
}: StayMiniSummaryProps) {
  const [open, setOpen] = useState(false);

  const basePrice = pricePerNight * nights;
  const taxes = Math.round((basePrice + cleaningFee + serviceFee) * 0.07);
  const total = basePrice + cleaningFee + serviceFee + taxes;

  const localeMap: Record<string, string> = { en: "en-GB", fr: "fr-FR", ar: "ar-TN" };
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(localeMap[locale] ?? "en-GB", {
      day: "numeric",
      month: "short",
    });

  return (
    <div className="lg:hidden sticky top-16 z-30 bg-white border-b border-gray-100 -mx-4 px-4 py-3 shadow-sm">
      {/* Collapsed row */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          {coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImageUrl}
              alt={title}
              className="h-10 w-14 rounded-lg object-cover shrink-0"
            />
          )}
          <span className="text-sm font-medium text-gray-900 truncate">{title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold text-primary">{total} TND</span>
          {open ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded breakdown */}
      {open && (
        <div className="mt-3 space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>{fmt(checkIn)} → {fmt(checkOut)}</span>
            <span>
              {nights} {labels.nights} · {adults} {labels.adults}
              {children > 0 ? `, ${children} ${labels.children}` : ""}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span>{pricePerNight} TND × {nights} {labels.nights}</span>
            <span>{basePrice} TND</span>
          </div>
          {cleaningFee > 0 && (
            <div className="flex justify-between">
              <span>{labels.cleaningFee}</span>
              <span>{cleaningFee} TND</span>
            </div>
          )}
          {serviceFee > 0 && (
            <div className="flex justify-between">
              <span>{labels.serviceFee}</span>
              <span>{serviceFee} TND</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>{labels.taxes}</span>
            <span>{taxes} TND</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold text-gray-900">
            <span>{labels.total}</span>
            <span>{total} TND</span>
          </div>
        </div>
      )}
    </div>
  );
}
