"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Loader2, Minus, Plus, Info, AlertCircle } from "lucide-react";
import { FiStar } from "react-icons/fi";
import { format } from "date-fns";
import { DatePickerInput } from "@/components/shared/DatePickerInput";
import { STAY_CLIENT_SERVICE_FEE, TUNISIA_TVA_RATE, CURRENCY } from "@/lib/constants/payments";

interface StayBookingCardProps {
  stayId: string;
  price: number;
  /** Combined array of all unavailable date strings (YYYY-MM-DD): manually blocked + confirmed + pending bookings */
  unavailableDates?: string[];
  cleaningFee?: number;
  serviceFee?: number;
  weeklyDiscount?: number;
  monthlyDiscount?: number;
  averageRating?: number | null;
  nbReviews: number;
  minStayNights: number;
  maxGuests?: number;
  cancelationPolicy?: string;
  labels: {
    perNight: string;
    cleaningFee: string;
    serviceFee: string;
    taxes: string;
    discount: string;
    total: string;
    bookNow: string;
    bookingNote: string;
    datesUnavailable: string;
    reviews: string;
    adults: string;
    children: string;
    checkIn: string;
    checkOut: string;
    freeCancel: string;
    minNights: string;
    night: string;
    nights: string;
    maxGuests: string;
  };
}

/** Returns true if any date in [checkIn, checkOut) is in the unavailable set. */
function hasConflict(checkIn: Date, checkOut: Date, unavailableSet: Set<string>): boolean {
  const cur = new Date(Date.UTC(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate()));
  const end = new Date(Date.UTC(checkOut.getFullYear(), checkOut.getMonth(), checkOut.getDate()));
  while (cur < end) {
    if (unavailableSet.has(format(cur, "yyyy-MM-dd"))) return true;
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return false;
}

export function StayBookingCard({
  stayId,
  price,
  unavailableDates = [],
  cleaningFee = 0,
  weeklyDiscount = 0,
  monthlyDiscount = 0,
  averageRating,
  nbReviews,
  minStayNights,
  maxGuests,
  cancelationPolicy,
  labels,
}: StayBookingCardProps) {
  const router = useRouter();
  const locale = useLocale();

  const today      = new Date();
  const defaultOut = new Date(Date.now() + Math.max(minStayNights, 1) * 86_400_000);

  const [checkIn,  setCheckIn]  = useState<Date | undefined>(today);
  const [checkOut, setCheckOut] = useState<Date | undefined>(defaultOut);
  const [adults,   setAdults]   = useState(1);
  const [children, setChildren] = useState(0);
  const [loading,  setLoading]  = useState(false);

  const unavailableSet = useMemo(() => new Set(unavailableDates), [unavailableDates]);

  const nights = checkIn && checkOut
    ? Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / 86_400_000))
    : Math.max(minStayNights, 1);

  // ── Availability validation ────────────────────────────────────────────
  const rangeConflict = useMemo(
    () => checkIn && checkOut ? hasConflict(checkIn, checkOut, unavailableSet) : false,
    [checkIn, checkOut, unavailableSet]
  );

  // ── Price calculation ────────────────────────────────────────────────
  const baseTotal    = price * nights;
  const cleaning     = cleaningFee;
  const discountRate =
    nights >= 28 && monthlyDiscount > 0
      ? monthlyDiscount / 100
      : nights >= 7 && weeklyDiscount > 0
      ? weeklyDiscount / 100
      : 0;
  const discountAmount        = Math.round(baseTotal * discountRate);
  const accommodationSubtotal = baseTotal - discountAmount + cleaning;
  const tva                   = Math.round(accommodationSubtotal * TUNISIA_TVA_RATE);
  const clientFee             = STAY_CLIENT_SERVICE_FEE;
  const total                 = accommodationSubtotal + tva + clientFee;

  const belowMinStay = nights < minStayNights;
  const totalGuests  = adults + children;
  const overCapacity = maxGuests ? totalGuests > maxGuests : false;

  const isBookingDisabled = loading || belowMinStay || overCapacity || rangeConflict;

  function handleBook() {
    if (isBookingDisabled || !checkIn || !checkOut) return;
    setLoading(true);
    const params = new URLSearchParams({
      type:     "stay",
      stayId,
      checkIn:  checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
      adults:   adults.toString(),
      children: children.toString(),
    }).toString();
    router.push(`/${locale}/checkout?${params}`);
  }

  // When check-in changes, clear check-out if it's now in conflict or before new check-in
  function handleCheckInChange(date: Date | undefined) {
    setCheckIn(date);
    if (date && checkOut && (checkOut <= date)) {
      setCheckOut(new Date(date.getTime() + Math.max(minStayNights, 1) * 86_400_000));
    }
  }

  const isFlexible  = cancelationPolicy?.toLowerCase() === "flexible";
  const nightLabel  = nights === 1 ? labels.night : labels.nights;

  return (
    <div className="border border-gray-200 rounded-2xl p-6 space-y-5 lg:sticky lg:top-8">
      {/* Price header */}
      <div className="flex items-baseline justify-between">
        <div>
          <span className="text-2xl font-bold text-gray-900">{price} {CURRENCY}</span>
          <span className="text-sm text-gray-400 ml-1">{labels.perNight}</span>
        </div>
        {(averageRating ?? 0) > 0 && nbReviews > 0 && (
          <a href="#reviews-section" className="flex items-center gap-1 text-sm text-gray-600 hover:underline">
            <FiStar className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
            <span className="font-medium">{(averageRating as number).toFixed(1)}</span>
            <span className="text-gray-400">· {nbReviews} {labels.reviews}</span>
          </a>
        )}
      </div>

      {/* Date pickers */}
      <div className={`grid grid-cols-2 border rounded-xl overflow-hidden divide-x divide-gray-200 ${rangeConflict ? "border-red-300" : "border-gray-200"}`}>
        <div className="p-3">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
            {labels.checkIn}
          </p>
          <DatePickerInput
            selected={checkIn}
            onDateChange={handleCheckInChange}
            minDate={today}
            placeholder={labels.checkIn}
            disabledDates={unavailableDates}
          />
        </div>
        <div className="p-3">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
            {labels.checkOut}
          </p>
          <DatePickerInput
            selected={checkOut}
            onDateChange={setCheckOut}
            minDate={checkIn ?? today}
            placeholder={labels.checkOut}
            disabledDates={unavailableDates}
          />
        </div>
      </div>

      {/* Guests */}
      <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm font-medium text-gray-800">{labels.adults}</p>
          <div className="flex items-center gap-3">
            <button onClick={() => setAdults(Math.max(1, adults - 1))} className="h-7 w-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-primary hover:text-primary transition-colors">
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-4 text-center text-sm font-semibold">{adults}</span>
            <button onClick={() => setAdults(adults + 1)} className="h-7 w-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-primary hover:text-primary transition-colors">
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm font-medium text-gray-800">{labels.children}</p>
          <div className="flex items-center gap-3">
            <button onClick={() => setChildren(Math.max(0, children - 1))} className="h-7 w-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-primary hover:text-primary transition-colors">
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-4 text-center text-sm font-semibold">{children}</span>
            <button onClick={() => setChildren(children + 1)} className="h-7 w-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-primary hover:text-primary transition-colors">
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Validation messages */}
      {rangeConflict && (
        <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{labels.datesUnavailable}</span>
        </div>
      )}
      {!rangeConflict && belowMinStay && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
          {labels.minNights}
        </p>
      )}
      {overCapacity && maxGuests && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {labels.maxGuests}
        </p>
      )}

      {/* Price breakdown */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>{price} {CURRENCY} × {nights} {nightLabel}</span>
          <span>{baseTotal} {CURRENCY}</span>
        </div>
        {cleaning > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>{labels.cleaningFee}</span>
            <span>{cleaning} {CURRENCY}</span>
          </div>
        )}
        {discountAmount > 0 && (
          <div className="flex justify-between text-green-700">
            <span>{labels.discount} ({discountRate * 100}%)</span>
            <span>−{discountAmount} {CURRENCY}</span>
          </div>
        )}
        <div className="flex justify-between text-gray-600">
          <span className="flex items-center gap-1">
            {labels.serviceFee}
            <Info className="h-3.5 w-3.5 text-gray-400" />
          </span>
          <span>{clientFee} {CURRENCY}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>{labels.taxes}</span>
          <span>{tva} {CURRENCY}</span>
        </div>
        <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-100 pt-2">
          <span>{labels.total}</span>
          <span>{total} {CURRENCY}</span>
        </div>
      </div>

      {/* CTA */}
      <Button
        className="w-full rounded-xl h-12 text-base font-semibold"
        onClick={handleBook}
        disabled={isBookingDisabled}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : labels.bookNow}
      </Button>

      <p className="text-xs text-gray-400 text-center">{labels.bookingNote}</p>

      {isFlexible && (
        <p className="text-xs text-green-700 text-center font-medium">
          ✓ {labels.freeCancel}
        </p>
      )}
    </div>
  );
}
