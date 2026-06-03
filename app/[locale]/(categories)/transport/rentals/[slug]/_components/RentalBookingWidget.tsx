"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { FiCheck, FiAlertTriangle, FiCalendar, FiArrowRight } from "react-icons/fi";
import { format, eachDayOfInterval } from "date-fns";
import { DatePickerInput } from "@/components/shared/DatePickerInput";
import { createRentalReservation } from "@/lib/actions/rental-reservations";
import { PLATFORM_CURRENCY } from "@/lib/utils/constants";

interface Props {
  rentalId:          string;
  pricePerDay:       number;
  minDays:           number;
  unavailableDates?: string[];
  labels: {
    perDay:       string;
    pickupDate:   string;
    returnDate:   string;
    notes:        string;
    notesPlaceholder: string;
    reserve:      string;
    reserving:    string;
    total:        string;
    minDays:          string;
    noCharge:         string;
    doneTitle:        string;
    doneMessage:      string;
    pickDateErr:      string;
    minDaysErr:       string;
    unavailableRange: string;
    viewBooking:      string;
    bookAgain:        string;
  };
}

export function RentalBookingWidget({ rentalId, pricePerDay, minDays, unavailableDates = [], labels }: Props) {
  const params = useParams();
  const locale = params.locale as string;

  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate,   setEndDate]   = useState<Date | undefined>();
  const [notes,     setNotes]     = useState("");
  const [done,      setDone]      = useState(false);
  const [pending,   start]        = useTransition();

  const days = (() => {
    if (!startDate || !endDate) return 0;
    const diff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    return diff < minDays ? 0 : Math.round(diff);
  })();

  const unavailableSet = useMemo(() => new Set(unavailableDates), [unavailableDates]);

  const hasConflict = useMemo(() => {
    if (!startDate || !endDate || startDate >= endDate) return false;
    return eachDayOfInterval({ start: startDate, end: endDate }).some(
      (d) => unavailableSet.has(format(d, "yyyy-MM-dd"))
    );
  }, [startDate, endDate, unavailableSet]);

  const total = days * pricePerDay;

  function handleBook() {
    if (!startDate || !endDate) return toast.error(labels.pickDateErr);
    if (days < minDays) return toast.error(labels.minDaysErr.replace("{n}", String(minDays)));
    start(async () => {
      const res = await createRentalReservation({
        rentalId,
        startDate,
        endDate,
        days,
        notes: notes || undefined,
      });
      if (res.success) setDone(true);
      else toast.error(res.error);
    });
  }

  if (done) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center space-y-4">
        <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <FiCheck className="h-6 w-6 text-green-600" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-gray-900">{labels.doneTitle}</p>
          <p className="text-sm text-gray-500">{labels.doneMessage}</p>
        </div>
        <div className="flex flex-col gap-2 pt-1">
          <Link
            href={`/${locale}/bookings?tab=rentals`}
            className="flex items-center justify-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
          >
            <FiArrowRight className="h-4 w-4" />
            {labels.viewBooking}
          </Link>
          <button
            type="button"
            onClick={() => { setDone(false); setStartDate(undefined); setEndDate(undefined); setNotes(""); }}
            className="flex items-center justify-center gap-2 text-sm font-medium text-gray-600 border border-gray-200 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <FiCalendar className="h-4 w-4" />
            {labels.bookAgain}
          </button>
        </div>
      </div>
    );
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";
  const labelCls = "text-sm font-medium text-gray-700";

  return (
    <div id="booking-widget" className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
      {/* Price display */}
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-gray-900">{pricePerDay} {PLATFORM_CURRENCY}</span>
        <span className="text-sm text-gray-400">{labels.perDay}</span>
      </div>

      <div className="space-y-3">
        {/* Pick-up date */}
        <div className="space-y-1.5">
          <label className={labelCls}>{labels.pickupDate}</label>
          <div className={`${inputCls} flex items-center`}>
            <DatePickerInput
              selected={startDate}
              onDateChange={(d) => {
                setStartDate(d);
                if (d && endDate && endDate <= d) setEndDate(undefined);
              }}
              minDate={new Date()}
              placeholder={labels.pickupDate}
              disabledDates={unavailableDates}
            />
          </div>
        </div>

        {/* Return date */}
        <div className="space-y-1.5">
          <label className={labelCls}>{labels.returnDate}</label>
          <div className={`${inputCls} flex items-center`}>
            <DatePickerInput
              selected={endDate}
              onDateChange={setEndDate}
              minDate={startDate ?? new Date()}
              placeholder={labels.returnDate}
              disabledDates={unavailableDates}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className={labelCls}>{labels.notes}</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder={labels.notesPlaceholder}
            className={`${inputCls} resize-none`}
          />
        </div>
      </div>

      {/* Unavailable range warning */}
      {hasConflict && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <FiAlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{labels.unavailableRange}</p>
        </div>
      )}

      {/* Pricing summary */}
      {days > 0 && !hasConflict && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>{pricePerDay} {PLATFORM_CURRENCY} × {days} {labels.perDay.replace("/", "").trim()}</span>
            <span>{total} {PLATFORM_CURRENCY}</span>
          </div>
          <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-200">
            <span>{labels.total}</span>
            <span>{total} {PLATFORM_CURRENCY}</span>
          </div>
        </div>
      )}

      {startDate && endDate && days < minDays && days > 0 && !hasConflict && (
        <p className="text-xs text-red-500">{labels.minDays.replace("{n}", String(minDays))}</p>
      )}

      <button
        onClick={handleBook}
        disabled={pending || !startDate || !endDate || days < minDays || hasConflict}
        className="w-full bg-primary text-white rounded-xl py-3 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {pending ? labels.reserving : labels.reserve}
      </button>

      <p className="text-xs text-center text-gray-400">{labels.noCharge}</p>
    </div>
  );
}
