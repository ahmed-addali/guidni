"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle } from "lucide-react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { DatePickerInput } from "@/components/shared/DatePickerInput";
import { createReservation } from "@/lib/actions/restaurant-reservations";

interface Props {
  restaurantId: string;
  restaurantName: string;
  maxGuests: number | null;
  locale: string;
  labels: {
    title: string;
    date: string;
    time: string;
    guests: string;
    maxGuests: string;
    notes: string;
    notesPlaceholder: string;
    submit: string;
    submitting: string;
    cancelNote: string;
    successTitle: string;
    successMessage: string;
  };
}

export function ReservationWidget({
  restaurantId,
  restaurantName,
  maxGuests,
  locale,
  labels,
}: Props) {
  const today = new Date();
  const [date,    setDate]    = useState<Date | undefined>(today);
  const [time,    setTime]    = useState("");
  const [guests,  setGuests]  = useState(2);
  const [notes,   setNotes]   = useState("");
  const [done,    setDone]    = useState(false);
  const [pending, start]      = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return;
    start(async () => {
      const result = await createReservation({
        restaurantId,
        date: date.toISOString().split("T")[0],
        time,
        guests,
        notes: notes || undefined,
      });
      if (result.success) {
        setDone(true);
      } else {
        toast.error(result.error);
      }
    });
  }

  if (done) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center space-y-3">
        <CheckCircle className="h-10 w-10 text-green-500 mx-auto" />
        <p className="font-semibold text-gray-800">{labels.successTitle}</p>
        <p className="text-sm text-gray-500">
          {labels.successMessage.replace("{name}", restaurantName)}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
      <h3 className="font-semibold text-gray-900 text-base">{labels.title}</h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Date */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">{labels.date}</label>
          <DatePickerInput
            selected={date}
            onDateChange={setDate}
            minDate={today}
            placeholder={labels.date}
            locale={locale}
          />
        </div>

        {/* Time */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">{labels.time}</label>
          <input
            type="time"
            required
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Guests */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
            <Users className="h-3 w-3" />
            {labels.guests}
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setGuests((g) => Math.max(1, g - 1))}
              className="h-8 w-8 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="font-semibold text-gray-800 w-6 text-center">{guests}</span>
            <button
              type="button"
              onClick={() => setGuests((g) => Math.min(maxGuests ?? 20, g + 1))}
              className="h-8 w-8 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          {maxGuests && (
            <p className="text-xs text-gray-400 mt-1">
              {labels.maxGuests.replace("{n}", String(maxGuests))}
            </p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">{labels.notes}</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder={labels.notesPlaceholder}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        <Button
          type="submit"
          disabled={pending || !date}
          className="w-full bg-primary text-white rounded-xl py-5 disabled:opacity-60"
        >
          {pending ? labels.submitting : labels.submit}
        </Button>
      </form>

      <p className="text-xs text-gray-400 text-center">{labels.cancelNote}</p>
    </div>
  );
}
