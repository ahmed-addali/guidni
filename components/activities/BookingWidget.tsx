"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { InfoIcon, Loader2, Minus, Plus } from "lucide-react";

type BookingWidgetProps = {
  activityId: string;
  price: number;
  t: {
    title: string;
    checkAvailability: string;
    checking: string;
    selectTime: string;
    breakdown: string;
    adults: string;
    children: string;
    taxes: string;
    serviceFee: string;
    serviceDesc: string;
    total: string;
    totalNote: string;
    bookNow: string;
    noAvailability: string;
    errorMessage: string;
    perPerson: string;
  };
};

const SERVICE_FEE = 5;
const TAXES = 3;

export function BookingWidget({ activityId, price, t }: BookingWidgetProps) {
  const locale = useLocale();
  const router = useRouter();

  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [message, setMessage] = useState("");

  const totalParticipants = adults + children;
  const subtotal = (adults + children) * price;
  const total = subtotal + TAXES + SERVICE_FEE;

  const handleCheckAvailability = async () => {
    if (!date || totalParticipants === 0) return;
    setLoading(true);
    setShowDetails(false);
    setMessage("");

    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId,
          date: new Date(date).toISOString(),
          adults,
          children,
        }),
      });
      const data = await res.json();
      if (data.availableSlots?.length > 0) {
        setAvailableTimes(data.availableSlots);
        setSelectedTime(data.availableSlots[0]);
        setShowDetails(true);
      } else {
        setMessage(t.noAvailability);
      }
    } catch {
      setMessage(t.errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = () => {
    if (!selectedTime || !date) return;
    setLoadingCheckout(true);
    const params = new URLSearchParams({
      type: "activity",
      activityId,
      date: new Date(date).toISOString(),
      time: selectedTime,
      adults: adults.toString(),
      children: children.toString(),
    }).toString();
    router.push(`/${locale}/checkout?${params}`);
  };

  return (
    <div className="w-full max-w-2xl space-y-4">
      {/* Inputs card */}
      <div className="border border-gray-200 rounded-lg p-6 space-y-4 bg-white">
        <h3 className="text-lg font-semibold text-gray-900 text-center">
          {t.title}
        </h3>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Participants */}
          <div className="flex-1 border border-gray-200 rounded-md p-3 space-y-2">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              {t.adults}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAdults(Math.max(0, adults - 1))}
                className="h-7 w-7 rounded-full border border-gray-300 flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-4 text-center font-semibold">{adults}</span>
              <button
                onClick={() => setAdults(adults + 1)}
                className="h-7 w-7 rounded-full border border-gray-300 flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="flex-1 border border-gray-200 rounded-md p-3 space-y-2">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              {t.children}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setChildren(Math.max(0, children - 1))}
                className="h-7 w-7 rounded-full border border-gray-300 flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-4 text-center font-semibold">{children}</span>
              <button
                onClick={() => setChildren(children + 1)}
                className="h-7 w-7 rounded-full border border-gray-300 flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Date */}
          <div className="flex-1 border border-gray-200 rounded-md p-3 space-y-2">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              Date
            </p>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-sm text-gray-700 bg-transparent outline-none"
            />
          </div>
        </div>

        <Button
          className="w-full gap-2"
          onClick={handleCheckAvailability}
          disabled={!date || totalParticipants === 0 || loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t.checking}
            </>
          ) : (
            <>
              <IoMdCheckmarkCircleOutline className="h-4 w-4" />
              {t.checkAvailability}
            </>
          )}
        </Button>

        {message && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-md text-sm">
            <InfoIcon className="h-4 w-4 shrink-0" />
            {message}
          </div>
        )}
      </div>

      {/* Details card — shown after availability check */}
      {showDetails && (
        <div className="border border-primary/30 rounded-lg p-6 bg-white space-y-4">
          {/* Time slots */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3">
              {t.selectTime}
            </h4>
            <div className="flex flex-wrap gap-2">
              {availableTimes.map((time) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTime(time)}
                >
                  {time}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Price breakdown */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3">
              {t.breakdown}
            </h4>
            <div className="bg-gray-50 rounded-md p-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>
                  {t.adults} × {adults} × {price} TND
                </span>
                <span>{adults * price} TND</span>
              </div>
              {children > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>
                    {t.children} × {children} × {price} TND
                  </span>
                  <span>{children * price} TND</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>{t.taxes}</span>
                <span>{TAXES} TND</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <Popover>
                  <PopoverTrigger className="flex items-center gap-1 hover:underline">
                    {t.serviceFee}
                    <InfoIcon className="h-3 w-3" />
                  </PopoverTrigger>
                  <PopoverContent className="w-64 text-sm">
                    {t.serviceDesc}
                  </PopoverContent>
                </Popover>
                <span>{SERVICE_FEE} TND</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">{t.total}</p>
              <p className="text-xs text-gray-400">{t.totalNote}</p>
            </div>
            <span className="text-2xl font-bold text-primary">{total} TND</span>
          </div>

          <Button
            size="lg"
            className="w-full rounded-full"
            onClick={handleBookNow}
            disabled={!selectedTime || loadingCheckout}
          >
            {loadingCheckout ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t.bookNow
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
