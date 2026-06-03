"use client";

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type Hours = {
  day:              string;
  opening:          string | null;
  closing:          string | null;
  isClosed:         boolean;
  isFullDayOpening: boolean;
};

interface Props {
  hours: Hours[];
  labels: {
    title:      string;
    closed:     string;
    open24h:    string;
    openNow:    string;
    closedNow:  string;
  };
}

function getTodayName() {
  return new Date().toLocaleDateString("en-US", { weekday: "long" });
}

function isCurrentlyOpen(hours: Hours[]): boolean {
  const today = getTodayName();
  const h = hours.find((x) => x.day.toLowerCase() === today.toLowerCase());
  if (!h || h.isClosed) return false;
  if (h.isFullDayOpening) return true;
  if (!h.opening || !h.closing) return false;
  const now = new Date();
  const [openH, openM] = h.opening.split(":").map(Number);
  const [closeH, closeM] = h.closing.split(":").map(Number);
  const nowMins  = now.getHours() * 60 + now.getMinutes();
  const openMins  = openH * 60 + openM;
  const closeMins = closeH * 60 + closeM;
  return nowMins >= openMins && nowMins < closeMins;
}

export function ShopOpeningHours({ hours, labels }: Props) {
  if (hours.length === 0) return null;

  const today   = getTodayName();
  const openNow = isCurrentlyOpen(hours);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-gray-400" />
          {labels.title}
        </h3>
        <span
          className={cn(
            "text-xs font-semibold px-2.5 py-0.5 rounded-full",
            openNow
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-600 border border-red-200"
          )}
        >
          {openNow ? labels.openNow : labels.closedNow}
        </span>
      </div>

      <div className="space-y-1.5">
        {DAYS_ORDER.map((day) => {
          const h       = hours.find((x) => x.day.toLowerCase() === day.toLowerCase());
          const isToday = day.toLowerCase() === today.toLowerCase();
          return (
            <div
              key={day}
              className={cn(
                "flex items-center justify-between text-xs py-1 px-2 rounded-lg",
                isToday ? "bg-gray-50 font-semibold" : ""
              )}
            >
              <span className={cn("w-24", isToday ? "text-gray-900" : "text-gray-600")}>{day}</span>
              {!h || h.isClosed ? (
                <span className="text-red-500">{labels.closed}</span>
              ) : h.isFullDayOpening ? (
                <span className="text-green-600">{labels.open24h}</span>
              ) : (
                <span className={isToday ? "text-gray-900" : "text-gray-500"}>
                  {h.opening} – {h.closing}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
