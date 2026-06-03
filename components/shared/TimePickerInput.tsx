"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { useLocale } from "next-intl";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const HOURS   = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

interface TimePickerInputProps {
  value: string;            // "HH:mm" or ""
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /**
   * List of "HH:MM" strings that are unavailable.
   * Hours where all 12 minute slots are blocked are fully disabled.
   * Hours where some slots are blocked show a warning indicator.
   * Individual minutes that are blocked are shown with a strikethrough and disabled.
   */
  unavailableTimes?: string[];
}

export function TimePickerInput({
  value,
  onChange,
  placeholder = "Pick a time",
  className,
  unavailableTimes,
}: TimePickerInputProps) {
  const locale = useLocale();
  const isRtl  = locale === "ar";
  const [open, setOpen] = useState(false);

  const hourColRef   = useRef<HTMLDivElement>(null);
  const minuteColRef = useRef<HTMLDivElement>(null);

  const parts          = value ? value.split(":") : [];
  const selectedHour   = parts[0] != null && parts[0] !== "" ? parseInt(parts[0], 10) : null;
  const selectedMinute = parts[1] != null && parts[1] !== "" ? parseInt(parts[1], 10) : null;

  // O(1) lookups
  const unavailableSet = useMemo(
    () => new Set(unavailableTimes ?? []),
    [unavailableTimes]
  );

  // Per-hour availability status
  const hourStatus = useMemo(() => {
    if (!unavailableSet.size) return {} as Record<number, "free" | "partial" | "full">;
    const result: Record<number, "free" | "partial" | "full"> = {};
    for (const h of HOURS) {
      const hh = String(h).padStart(2, "0");
      const blocked = MINUTES.filter((m) =>
        unavailableSet.has(`${hh}:${String(m).padStart(2, "0")}`)
      ).length;
      result[h] = blocked === 0 ? "free" : blocked === MINUTES.length ? "full" : "partial";
    }
    return result;
  }, [unavailableSet]);

  // Auto-scroll to selected values whenever the popover opens
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      if (hourColRef.current && selectedHour != null) {
        const btn = hourColRef.current.querySelector(
          `[data-hour="${selectedHour}"]`
        ) as HTMLElement | null;
        btn?.scrollIntoView({ block: "center", behavior: "instant" });
      }
      if (minuteColRef.current && selectedMinute != null) {
        const btn = minuteColRef.current.querySelector(
          `[data-minute="${selectedMinute}"]`
        ) as HTMLElement | null;
        btn?.scrollIntoView({ block: "center", behavior: "instant" });
      }
    }, 40);
    return () => clearTimeout(t);
  }, [open, selectedHour, selectedMinute]);

  function handleHour(h: number) {
    if (hourStatus[h] === "full") return;
    const m = selectedMinute ?? 0;
    onChange(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }

  function handleMinute(m: number) {
    const h = selectedHour ?? 0;
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    if (unavailableSet.has(`${hh}:${mm}`)) return;
    onChange(`${hh}:${mm}`);
    setOpen(false);
  }

  const display =
    selectedHour != null && selectedMinute != null
      ? `${String(selectedHour).padStart(2, "0")}:${String(selectedMinute).padStart(2, "0")}`
      : null;

  const hasUnavailable = unavailableSet.size > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "w-full flex items-center gap-2 text-sm text-left bg-transparent outline-none",
          display ? "text-gray-800" : "text-gray-400",
          className
        )}
      >
        <Clock className="h-4 w-4 text-gray-400 shrink-0" />
        <span>{display ?? placeholder}</span>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-0 overflow-hidden"
        align={isRtl ? "end" : "start"}
      >
        <div dir={isRtl ? "rtl" : "ltr"}>

          {/* Column headers */}
          <div className="flex border-b border-gray-100">
            <div className="w-20 px-4 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-center border-r border-gray-100">
              HH
            </div>
            <div className="w-20 px-4 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-center">
              MM
            </div>
          </div>

          {/* Scrollable columns */}
          <div className="flex">

            {/* Hours — 00 … 23 */}
            <div
              ref={hourColRef}
              className="w-20 h-52 overflow-y-auto p-1 scrollbar-hide border-r border-gray-100"
            >
              {HOURS.map((h) => {
                const status = hourStatus[h] ?? "free";
                const isFull    = status === "full";
                const isPartial = status === "partial";
                const isSelected = selectedHour === h;

                return (
                  <button
                    key={h}
                    type="button"
                    data-hour={h}
                    onClick={() => handleHour(h)}
                    disabled={isFull}
                    className={cn(
                      "w-full py-1.5 text-sm rounded-lg transition-colors text-center relative",
                      isSelected && !isFull
                        ? "bg-primary text-white font-semibold"
                        : isFull
                        ? "text-gray-300 cursor-not-allowed line-through bg-red-50"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    {String(h).padStart(2, "0")}
                    {/* Partial warning dot */}
                    {isPartial && !isSelected && (
                      <span className="absolute top-1 right-1.5 h-1.5 w-1.5 rounded-full bg-orange-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Minutes — 00, 05, 10 … 55 */}
            <div
              ref={minuteColRef}
              className="w-20 h-52 overflow-y-auto p-1 scrollbar-hide"
            >
              {MINUTES.map((m) => {
                const hh = String(selectedHour ?? 0).padStart(2, "0");
                const mm = String(m).padStart(2, "0");
                const isUnavailable = unavailableSet.has(`${hh}:${mm}`);
                const isSelected    = selectedMinute === m;

                return (
                  <button
                    key={m}
                    type="button"
                    data-minute={m}
                    onClick={() => handleMinute(m)}
                    disabled={isUnavailable}
                    className={cn(
                      "w-full py-1.5 text-sm rounded-lg transition-colors text-center",
                      isSelected && !isUnavailable
                        ? "bg-primary text-white font-semibold"
                        : isUnavailable
                        ? "text-red-300 line-through cursor-not-allowed bg-red-50"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    {String(m).padStart(2, "0")}
                  </button>
                );
              })}
            </div>

          </div>

          {/* Legend — shown only when there are unavailable times */}
          {hasUnavailable && (
            <div className="border-t border-gray-100 px-3 py-2 flex items-center gap-3 text-[10px] text-gray-400">
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded bg-red-50 border border-red-200 line-through text-red-300 text-[8px] leading-3 text-center">–</span>
                Unavailable
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-400" />
                Partial
              </span>
            </div>
          )}

        </div>
      </PopoverContent>
    </Popover>
  );
}
