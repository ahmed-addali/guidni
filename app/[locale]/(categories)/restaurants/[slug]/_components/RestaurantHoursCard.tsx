import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type Hours = {
  day: string;
  opening: string | null;
  closing: string | null;
  isClosed: boolean;
  isFullDayOpening: boolean;
};

type Props = {
  hours: Hours[];
  todayName: string;
  labels: {
    title: string;
    closed: string;
    open24h: string;
  };
};

export function RestaurantHoursCard({ hours, todayName, labels }: Props) {
  if (hours.length === 0) return null;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
        <Clock className="h-4 w-4 text-gray-400" />
        {labels.title}
      </h3>
      <div className="space-y-1.5">
        {DAYS_ORDER.map((day) => {
          const h = hours.find((x) => x.day.toLowerCase() === day.toLowerCase());
          const isToday = day.toLowerCase() === todayName.toLowerCase();
          return (
            <div
              key={day}
              className={cn(
                "flex items-center justify-between text-xs py-1 px-2 rounded-lg",
                isToday ? "bg-gray-50 font-semibold" : "",
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
