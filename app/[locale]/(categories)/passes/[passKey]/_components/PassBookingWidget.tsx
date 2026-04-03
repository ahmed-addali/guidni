"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createPassReservation } from "@/lib/actions/pass-reservations";

type OptionalActivity = { id: string; title: string };

type PassBookingWidgetProps = {
  pass: {
    id:                 string;
    passKey:            string;
    price:              number;
    discount:           number;
    optionalCount:      number;
    optionalActivities: OptionalActivity[];
  };
  locale: string;
  labels: {
    price:          string;
    originalPrice:  string | null;
    perPerson:      string;
    date:           string;
    participants:   string;
    notes:          string;
    book:           string;
    booking:        string;
    chooseOptional: string;
    upTo:           string;
    loginRequired:  string;
  };
};

export function PassBookingWidget({ pass, locale, labels }: PassBookingWidgetProps) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const [date, setDate] = useState("");
  const [participants, setParticipants] = useState(1);
  const [notes, setNotes] = useState("");
  const [selectedOptional, setSelectedOptional] = useState<string[]>([]);

  function toggleOptional(id: string) {
    setSelectedOptional((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= pass.optionalCount) return prev;
      return [...prev, id];
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await createPassReservation({
        passId:       pass.id,
        passKey:      pass.passKey,
        date,
        participants,
        totalPrice:
          pass.discount > 0
            ? Math.round(pass.price * (1 - pass.discount / 100)) * participants
            : pass.price * participants,
        notes: notes || undefined,
        selectedOptionalActivityIds: selectedOptional,
      });

      if (res.success) {
        toast.success("Pass booked!");
        router.push(`/${locale}/bookings/pass/${res.data.bookingRef}`);
      } else {
        if (res.error === "Not authenticated") {
          toast.error(labels.loginRequired);
          router.push(`/${locale}/login`);
        } else {
          toast.error(res.error ?? "Failed to book");
        }
      }
    });
  }

  const fieldCls =
    "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-5">
      {/* Price */}
      <div>
        <p className="text-2xl font-bold text-gray-900">{labels.price}</p>
        {labels.originalPrice && (
          <p className="text-sm text-gray-400 line-through">{labels.originalPrice}</p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">{labels.perPerson}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{labels.date}</label>
          <input
            type="date"
            required
            value={date}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setDate(e.target.value)}
            className={fieldCls}
          />
        </div>

        {/* Participants */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {labels.participants}
          </label>
          <input
            type="number"
            min={1}
            max={20}
            required
            value={participants}
            onChange={(e) => setParticipants(Number(e.target.value))}
            className={fieldCls}
          />
        </div>

        {/* Optional activity picker */}
        {pass.optionalActivities.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {labels.chooseOptional}
            </label>
            <p className="text-xs text-gray-400 mb-2">{labels.upTo}</p>
            <div className="space-y-2">
              {pass.optionalActivities.map((act) => {
                const checked = selectedOptional.includes(act.id);
                const disabled = !checked && selectedOptional.length >= pass.optionalCount;
                return (
                  <label
                    key={act.id}
                    className={`flex items-center gap-2.5 text-sm rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                      checked
                        ? "border-primary/40 bg-primary/5 text-gray-900"
                        : disabled
                        ? "border-gray-100 text-gray-300 cursor-not-allowed"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleOptional(act.id)}
                      className="accent-primary"
                    />
                    {act.title}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{labels.notes}</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={`${fieldCls} resize-none`}
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {pending ? labels.booking : labels.book}
        </button>
      </form>
    </div>
  );
}
