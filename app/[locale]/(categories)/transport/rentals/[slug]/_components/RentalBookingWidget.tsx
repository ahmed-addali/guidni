"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FiCheck, FiMinus, FiPlus } from "react-icons/fi";
import { DatePickerInput } from "@/components/shared/DatePickerInput";
import { createRentalReservation } from "@/lib/actions/rental-reservations";

interface Props {
  rentalId:    string;
  pricePerDay: number;
  minDays:     number;
  labels: {
    perDay:       string;
    pickupDate:   string;
    returnDate:   string;
    notes:        string;
    notesPlaceholder: string;
    reserve:      string;
    reserving:    string;
    total:        string;
    minDays:      string;
    noCharge:     string;
    doneTitle:    string;
    doneMessage:  string;
    pickDateErr:  string;
    minDaysErr:   string;
  };
}

export function RentalBookingWidget({ rentalId, pricePerDay, minDays, labels }: Props) {
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
      <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center space-y-3">
        <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <FiCheck className="h-6 w-6 text-green-600" />
        </div>
        <p className="font-semibold text-gray-900">{labels.doneTitle}</p>
        <p className="text-sm text-gray-500">{labels.doneMessage}</p>
      </div>
    );
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";
  const labelCls = "text-sm font-medium text-gray-700";

  return (
    <div id="booking-widget" className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
      {/* Price display */}
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-gray-900">{pricePerDay} TND</span>
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

      {/* Pricing summary */}
      {days > 0 && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>{pricePerDay} TND × {days} {labels.perDay.replace("/", "").trim()}</span>
            <span>{total} TND</span>
          </div>
          <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-200">
            <span>{labels.total}</span>
            <span>{total} TND</span>
          </div>
        </div>
      )}

      {startDate && endDate && days < minDays && days > 0 && (
        <p className="text-xs text-red-500">{labels.minDays.replace("{n}", String(minDays))}</p>
      )}

      <button
        onClick={handleBook}
        disabled={pending || !startDate || !endDate || days < minDays}
        className="w-full bg-primary text-white rounded-xl py-3 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {pending ? labels.reserving : labels.reserve}
      </button>

      <p className="text-xs text-center text-gray-400">{labels.noCharge}</p>
    </div>
  );
}
