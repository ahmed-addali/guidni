"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveHours } from "@/lib/actions/partner-restaurants";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type HourEntry = {
  day:              string;
  opening:          string;
  closing:          string;
  isClosed:         boolean;
  isFullDayOpening: boolean;
};

type RestaurantHour = {
  id:               string;
  day:              string;
  opening:          string | null;
  closing:          string | null;
  isClosed:         boolean;
  isFullDayOpening: boolean;
};

function buildInitialHours(existing: RestaurantHour[]): HourEntry[] {
  return DAYS.map((day) => {
    const found = existing.find((h) => h.day === day);
    return {
      day,
      opening:          found?.opening          ?? "09:00",
      closing:          found?.closing           ?? "22:00",
      isClosed:         found?.isClosed          ?? false,
      isFullDayOpening: found?.isFullDayOpening  ?? false,
    };
  });
}

const inputCls = "border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

export function HoursTab({
  restaurantId,
  initialHours,
}: {
  restaurantId:  string;
  initialHours:  RestaurantHour[];
}) {
  const [hours, setHours] = useState<HourEntry[]>(buildInitialHours(initialHours));
  const [pending, start]  = useTransition();

  function update(day: string, field: keyof HourEntry, value: string | boolean) {
    setHours((prev) =>
      prev.map((h) => (h.day === day ? { ...h, [field]: value } : h))
    );
  }

  function handleSubmit() {
    start(async () => {
      const res = await saveHours(restaurantId, hours);
      if (res.success) toast.success("Hours saved");
      else toast.error((res as any).error ?? "Failed to save hours");
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-800">Opening hours</h2>
        <p className="text-xs text-gray-400 mt-0.5">Set your weekly schedule. Guests will see this on your listing.</p>
      </div>

      <div className="space-y-2">
        {hours.map(({ day, opening, closing, isClosed, isFullDayOpening }) => (
          <div key={day} className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-colors ${isClosed ? "bg-gray-50 border-gray-100" : "bg-white border-gray-200"}`}>
            {/* Day label */}
            <span className="w-24 text-sm font-medium text-gray-700 shrink-0">{day}</span>

            {/* Closed toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={isClosed}
                onChange={(e) => update(day, "isClosed", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-xs text-gray-500">Closed</span>
            </label>

            {!isClosed && (
              <>
                {/* Open 24h toggle */}
                <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={isFullDayOpening}
                    onChange={(e) => update(day, "isFullDayOpening", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-xs text-gray-500">24h</span>
                </label>

                {!isFullDayOpening && (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={opening}
                      onChange={(e) => update(day, "opening", e.target.value)}
                      className={inputCls}
                    />
                    <span className="text-xs text-gray-400">to</span>
                    <input
                      type="time"
                      value={closing}
                      onChange={(e) => update(day, "closing", e.target.value)}
                      className={inputCls}
                    />
                  </div>
                )}

                {isFullDayOpening && (
                  <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-lg">Open all day</span>
                )}
              </>
            )}

            {isClosed && (
              <span className="text-xs text-gray-400 italic">Closed all day</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          disabled={pending}
          onClick={handleSubmit}
          className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save hours"}
        </button>
      </div>
    </div>
  );
}
