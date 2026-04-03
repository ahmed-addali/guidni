import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FiCalendar, FiUsers } from "react-icons/fi";
import { IoBedOutline } from "react-icons/io5";
import { CheckCircle, XCircle } from "lucide-react";

const LOCALE_MAP: Record<string, string> = { en: "en-GB", fr: "fr-FR", ar: "ar-TN" };

interface StaySummaryProps {
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
  freeCancel: boolean;
  locale: string;
  labels: {
    adults: string;
    children: string;
    nights: string;
    cleaningFee: string;
    serviceFee: string;
    taxes: string;
    total: string;
    totalNote: string;
    perNight: string;
    freeCancel: string;
    nonRefundable: string;
  };
}

export function OrderSummaryStay({
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
  freeCancel,
  locale,
  labels,
}: StaySummaryProps) {
  const basePrice = pricePerNight * nights;
  const taxes = Math.round((basePrice + cleaningFee + serviceFee) * 0.07);
  const total = basePrice + cleaningFee + serviceFee + taxes;

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(LOCALE_MAP[locale] ?? "en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <Card>
      {coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverImageUrl}
          alt={title}
          className="w-full h-44 object-cover rounded-t-lg"
        />
      )}
      <CardContent className="p-5 space-y-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <FiCalendar className="h-4 w-4 shrink-0" />
            <span>
              {fmt(checkIn)} → {fmt(checkOut)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <IoBedOutline className="h-4 w-4 shrink-0" />
            <span>
              {nights} {labels.nights}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FiUsers className="h-4 w-4 shrink-0" />
            <span>
              {adults} {labels.adults}
              {children > 0 ? `, ${children} ${labels.children}` : ""}
            </span>
          </div>
        </div>

        <Separator />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>
              {pricePerNight} TND × {nights} {labels.nights}
            </span>
            <span>{basePrice} TND</span>
          </div>
          {cleaningFee > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>{labels.cleaningFee}</span>
              <span>{cleaningFee} TND</span>
            </div>
          )}
          {serviceFee > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>{labels.serviceFee}</span>
              <span>{serviceFee} TND</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <span>{labels.taxes}</span>
            <span>{taxes} TND</span>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between items-end">
          <div>
            <p className="font-semibold text-gray-900">{labels.total}</p>
            <p className="text-xs text-gray-400">{labels.totalNote}</p>
          </div>
          <span className="text-xl font-bold text-primary">{total} TND</span>
        </div>

        {/* Cancellation policy */}
        <div className={`flex items-center gap-1.5 text-xs font-medium ${freeCancel ? "text-green-600" : "text-red-500"}`}>
          {freeCancel ? (
            <CheckCircle className="h-3.5 w-3.5" />
          ) : (
            <XCircle className="h-3.5 w-3.5" />
          )}
          <span>{freeCancel ? labels.freeCancel : labels.nonRefundable}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function computeStayTotal(
  pricePerNight: number,
  nights: number,
  cleaningFee = 0,
  serviceFee = 0
): number {
  const base = pricePerNight * nights;
  const taxes = Math.round((base + cleaningFee + serviceFee) * 0.07);
  return base + cleaningFee + serviceFee + taxes;
}
