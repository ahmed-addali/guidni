"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FiCalendar, FiCheck } from "react-icons/fi";
import { createRentalReservation } from "@/lib/actions/rental-reservations";

interface Props {
  rentalId:    string;
  pricePerDay: number;
  minDays:     number;
}

export function RentalBookingWidget({ rentalId, pricePerDay, minDays }: Props) {
  const [startDate, setStartDate] = useState("");
  const [endDate,   setEndDate]   = useState("");
  const [notes,     setNotes]     = useState("");
  const [done,      setDone]      = useState(false);
  const [pending,   start]        = useTransition();

  const today = new Date().toISOString().split("T")[0];

  const days = (() => {
    if (!startDate || !endDate) return 0;
    const diff = (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24);
    return diff < minDays ? 0 : Math.round(diff);
  })();

  const total = days * pricePerDay;

  function handleBook() {
    if (!startDate || !endDate) return toast.error("Pick start and end dates");
    if (days < minDays) return toast.error(`Minimum rental is ${minDays} day${minDays > 1 ? "s" : ""}`);
    start(async () => {
      const res = await createRentalReservation({
        rentalId,
        startDate: new Date(startDate),
        endDate:   new Date(endDate),
        days,
        notes,
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
        <p className="font-semibold text-gray-900">Booking received!</p>
        <p className="text-sm text-gray-500">The rental owner will confirm your booking shortly.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-gray-900">{pricePerDay} TND</span>
        <span className="text-sm text-gray-400">/day</span>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Pick-up date</label>
          <div className="relative">
            <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="date"
              min={today}
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); if (endDate < e.target.value) setEndDate(""); }}
              className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Return date</label>
          <div className="relative">
            <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="date"
              min={startDate || today}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Delivery address, special requests..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
      </div>

      {days > 0 && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>{pricePerDay} TND × {days} day{days > 1 ? "s" : ""}</span>
            <span>{total} TND</span>
          </div>
          <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-200">
            <span>Total</span>
            <span>{total} TND</span>
          </div>
        </div>
      )}

      {days > 0 && days < minDays && (
        <p className="text-xs text-red-500">Minimum rental is {minDays} day{minDays > 1 ? "s" : ""}.</p>
      )}

      <button
        onClick={handleBook}
        disabled={pending || !startDate || !endDate || days < minDays}
        className="w-full bg-primary text-white rounded-xl py-3 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {pending ? "Booking…" : "Reserve now"}
      </button>

      <p className="text-xs text-center text-gray-400">You won't be charged yet — the owner will confirm first.</p>
    </div>
  );
}
