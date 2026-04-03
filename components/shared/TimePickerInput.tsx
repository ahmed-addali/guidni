"use client";

import { useEffect, useRef, useState } from "react";
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
}

export function TimePickerInput({
  value,
  onChange,
  placeholder = "Pick a time",
  className,
}: TimePickerInputProps) {
  const locale  = useLocale();
  const isRtl   = locale === "ar";
  const [open, setOpen] = useState(false);

  const hourColRef   = useRef<HTMLDivElement>(null);
  const minuteColRef = useRef<HTMLDivElement>(null);

  const parts          = value ? value.split(":") : [];
  const selectedHour   = parts[0] != null && parts[0] !== "" ? parseInt(parts[0], 10) : null;
  const selectedMinute = parts[1] != null && parts[1] !== "" ? parseInt(parts[1], 10) : null;

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
    const m = selectedMinute ?? 0;
    onChange(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }

  function handleMinute(m: number) {
    const h = selectedHour ?? 0;
    onChange(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    setOpen(false);
  }

  const display = selectedHour != null && selectedMinute != null
    ? `${String(selectedHour).padStart(2, "0")}:${String(selectedMinute).padStart(2, "0")}`
    : null;

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
              {HOURS.map((h) => (
                <button
                  key={h}
                  type="button"
                  data-hour={h}
                  onClick={() => handleHour(h)}
                  className={cn(
                    "w-full py-1.5 text-sm rounded-lg transition-colors text-center",
                    selectedHour === h
                      ? "bg-primary text-white font-semibold"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {String(h).padStart(2, "0")}
                </button>
              ))}
            </div>

            {/* Minutes — 00, 05, 10 … 55 */}
            <div
              ref={minuteColRef}
              className="w-20 h-52 overflow-y-auto p-1 scrollbar-hide"
            >
              {MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  data-minute={m}
                  onClick={() => handleMinute(m)}
                  className={cn(
                    "w-full py-1.5 text-sm rounded-lg transition-colors text-center",
                    selectedMinute === m
                      ? "bg-primary text-white font-semibold"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {String(m).padStart(2, "0")}
                </button>
              ))}
            </div>

          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
