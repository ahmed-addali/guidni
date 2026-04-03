"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Loader2, Minus, Plus, ChevronLeft, Info } from "lucide-react";
import { FiStar } from "react-icons/fi";
import { DatePickerInput } from "@/components/shared/DatePickerInput";
import { ACTIVITY_CLIENT_SERVICE_FEE, TUNISIA_TVA_RATE } from "@/lib/constants/payments";

interface ActivityBookingCardProps {
  activityId: string;
  price: number;
  capacity: number;
  cancelation?: boolean | null;
  paynow?: boolean | null;
  averageRating?: number | null;
  nbReviews: number;
  labels: {
    perPerson: string;
    date: string;
    adults: string;
    children: string;
    pickDate: string;
    checkAvailability: string;
    checking: string;
    selectTime: string;
    serviceFee: string;
    taxes: string;
    total: string;
    bookNow: string;
    noAvailability: string;
    errorMessage: string;
    back: string;
    reviews: string;
    freeCancel: string;
    payLater: string;
  };
}

export function ActivityBookingCard({
  activityId,
  price,
  capacity,
  cancelation,
  paynow,
  averageRating,
  nbReviews,
  labels,
}: ActivityBookingCardProps) {
  const locale       = useLocale();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const agentToken   = searchParams.get("agentToken") ?? undefined;

  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showStep2, setShowStep2] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const totalParticipants = adults + children;
  const subtotal = totalParticipants * price;
  const tva = Math.round(subtotal * TUNISIA_TVA_RATE);
  const serviceFee = ACTIVITY_CLIENT_SERVICE_FEE;
  const total = subtotal + tva + serviceFee;

  async function handleCheckAvailability() {
    if (!date || totalParticipants === 0) return;
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId,
          date: date.toISOString(),
          adults,
          children,
        }),
      });
      const data = await res.json();
      if (data.availableSlots?.length > 0) {
        setAvailableTimes(data.availableSlots);
        setSelectedTime(data.availableSlots[0]);
        setShowStep2(true);
      } else {
        setErrorMessage(labels.noAvailability);
      }
    } catch {
      setErrorMessage(labels.errorMessage);
    } finally {
      setLoading(false);
    }
  }

  function handleBookNow() {
    if (!selectedTime || !date) return;
    setLoadingCheckout(true);
    const urlParams: Record<string, string> = {
      type:      "activity",
      activityId,
      date:      date.toISOString(),
      time:      selectedTime,
      adults:    adults.toString(),
      children:  children.toString(),
    };
    if (agentToken) urlParams.agentToken = agentToken;
    router.push(`/${locale}/checkout?${new URLSearchParams(urlParams).toString()}`);
  }

  return (
    <div className="border border-gray-200 rounded-2xl p-6 space-y-5 lg:sticky lg:top-8">

      {/* Price header */}
      <div className="flex items-baseline justify-between">
        <div>
          <span className="text-2xl font-bold text-gray-900">{price} TND</span>
          <span className="text-sm text-gray-400 ml-1">{labels.perPerson}</span>
        </div>
        {averageRating && averageRating > 0 && (
          <a href="#reviews-section" className="flex items-center gap-1 text-sm text-gray-600 hover:underline">
            <FiStar className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
            <span className="font-medium">{averageRating.toFixed(1)}</span>
            <span className="text-gray-400">· {nbReviews} {labels.reviews}</span>
          </a>
        )}
      </div>

      {!showStep2 ? (
        <>
          {/* Date */}
          <div className="border border-gray-200 rounded-xl p-3">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              {labels.date}
            </p>
            <DatePickerInput
              selected={date}
              onDateChange={setDate}
              minDate={new Date()}
              placeholder={labels.pickDate}
            />
          </div>

          {/* Guests */}
          <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-sm font-medium text-gray-800">{labels.adults}</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAdults(Math.max(1, adults - 1))}
                  className="h-7 w-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-primary hover:text-primary transition-colors"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-4 text-center text-sm font-semibold">{adults}</span>
                <button
                  onClick={() => setAdults(Math.min(capacity, adults + 1))}
                  className="h-7 w-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-primary hover:text-primary transition-colors"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-sm font-medium text-gray-800">{labels.children}</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setChildren(Math.max(0, children - 1))}
                  className="h-7 w-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-primary hover:text-primary transition-colors"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-4 text-center text-sm font-semibold">{children}</span>
                <button
                  onClick={() => setChildren(Math.min(capacity - adults, children + 1))}
                  className="h-7 w-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-primary hover:text-primary transition-colors"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          {errorMessage && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
              {errorMessage}
            </p>
          )}

          <Button
            className="w-full rounded-xl h-12 text-base font-semibold"
            onClick={handleCheckAvailability}
            disabled={!date || totalParticipants === 0 || loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : labels.checkAvailability}
          </Button>

          {(cancelation || paynow === false) && (
            <div className="space-y-1">
              {cancelation && (
                <p className="text-xs text-green-700 text-center font-medium">✓ {labels.freeCancel}</p>
              )}
              {paynow === false && (
                <p className="text-xs text-gray-500 text-center">✓ {labels.payLater}</p>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Back to step 1 */}
          <button
            onClick={() => { setShowStep2(false); setErrorMessage(""); }}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors -mb-1"
          >
            <ChevronLeft className="h-4 w-4" />
            {labels.back}
          </button>

          {/* Time slots */}
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-3">{labels.selectTime}</p>
            <div className="flex flex-wrap gap-2">
              {availableTimes.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`px-4 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                    selectedTime === time
                      ? "bg-primary text-white border-primary"
                      : "border-gray-200 text-gray-700 hover:border-primary hover:text-primary"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* Price breakdown */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>{price} TND × {totalParticipants}</span>
              <span>{subtotal} TND</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span className="flex items-center gap-1">
                {labels.serviceFee}
                <Info className="h-3.5 w-3.5 text-gray-400" />
              </span>
              <span>{serviceFee} TND</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>{labels.taxes}</span>
              <span>{tva} TND</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-100 pt-2">
              <span>{labels.total}</span>
              <span>{total} TND</span>
            </div>
          </div>

          <Button
            className="w-full rounded-xl h-12 text-base font-semibold"
            onClick={handleBookNow}
            disabled={!selectedTime || loadingCheckout}
          >
            {loadingCheckout ? <Loader2 className="h-4 w-4 animate-spin" /> : labels.bookNow}
          </Button>
        </>
      )}
    </div>
  );
}
