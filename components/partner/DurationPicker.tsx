"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { cn } from "@/lib/utils";

// ─── Formatting ───────────────────────────────────────────────────────────────

type DurationLabels = { day: string; days: string; hour: string; hourShort: string; minShort: string };

function formatDuration(d: number, h: number, m: number, labels: DurationLabels): string {
  if (d === 0 && h === 0 && m === 0) return "";
  const parts: string[] = [];
  if (d > 0) parts.push(d === 1 ? `1 ${labels.day}` : `${d} ${labels.days}`);
  if (h > 0) parts.push(h === 1 ? `1 ${labels.hour}` : `${h}${labels.hourShort}`);
  if (m > 0) parts.push(`${m}${labels.minShort}`);
  return parts.join(" ");
}

// ─── Parse legacy free-text values ───────────────────────────────────────────

function parse(value: string): { days: number; hours: number; minutes: number } {
  const base = { days: 0, hours: 0, minutes: 0 };
  if (!value || value === "Half day" || value === "Full day") return base;

  let d = 0, h = 0, m = 0;
  const dayMatch  = value.match(/(\d+)\s*days?/i);
  const hourMatch = value.match(/([\d.]+)\s*h(?:ours?)?/i);
  const minMatch  = value.match(/(\d+)\s*min/i);

  if (dayMatch)  d = Math.min(parseInt(dayMatch[1]), 14);
  if (hourMatch) {
    const raw = parseFloat(hourMatch[1]);
    h = Math.min(Math.floor(raw), 23);
    if (raw % 1 !== 0) m = Math.round((raw % 1) * 60 / 5) * 5;
  }
  if (minMatch) m = Math.min(Math.round(parseInt(minMatch[1]) / 5) * 5, 55);

  return { days: d, hours: h, minutes: Math.min(m, 55) };
}

// ─── Column ───────────────────────────────────────────────────────────────────

function Column({
  label, value, min, max, step, onChange,
}: {
  label:    string;
  value:    number;
  min:      number;
  max:      number;
  step:     number;
  onChange: (v: number) => void;
}) {
  const [raw, setRaw] = useState(String(value));

  // Keep raw in sync if parent resets (e.g. on initial render)
  useEffect(() => { setRaw(String(value)); }, [value]);

  function commit(str: string) {
    const n = parseInt(str, 10);
    if (!isNaN(n)) onChange(Math.min(Math.max(n, min), max));
    else setRaw(String(value)); // revert on invalid
  }

  return (
    <div className="flex flex-col items-center gap-1 flex-1 px-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 select-none">
        {label}
      </p>

      {/* Up */}
      <button
        type="button"
        onClick={() => onChange(Math.min(value + step, max))}
        disabled={value >= max}
        className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
      >
        <FiChevronUp className="h-4 w-4" />
      </button>

      {/* Editable number */}
      <input
        type="number"
        min={min}
        max={max}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={(e)  => commit(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit((e.target as HTMLInputElement).value); } }}
        className="w-14 text-center text-2xl font-bold text-gray-900 tabular-nums bg-transparent border-none outline-none focus:bg-gray-50 focus:rounded-lg focus:ring-0 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />

      {/* Down */}
      <button
        type="button"
        onClick={() => onChange(Math.max(value - step, min))}
        disabled={value <= min}
        className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
      >
        <FiChevronDown className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = { value: string; onChange: (str: string, totalMinutes: number) => void; error?: string };

// ─── DurationPicker ───────────────────────────────────────────────────────────

export function DurationPicker({ value, onChange, error }: Props) {
  const t      = useTranslations("Components.durationPicker");
  const labels: DurationLabels = {
    day:      t("day"),
    days:     t("days"),
    hour:     t("hour"),
    hourShort: t("hourShort"),
    minShort:  t("minShort"),
  };
  const init = parse(value);

  const [open,    setOpen]    = useState(false);
  const [days,    setDays]    = useState(init.days);
  const [hours,   setHours]   = useState(init.hours);
  const [minutes, setMinutes] = useState(init.minutes);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [open]);

  function update(d: number, h: number, m: number) {
    onChange(formatDuration(d, h, m, labels), d * 1440 + h * 60 + m);
  }

  const displayValue = formatDuration(days, hours, minutes, labels);

  return (
    <div ref={ref} className="relative">

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between gap-2 border rounded-xl px-3 py-2.5 text-sm text-left bg-white transition-colors",
          open
            ? "border-primary ring-2 ring-primary/20"
            : "border-gray-200 hover:border-gray-400",
          !displayValue && "text-gray-400"
        )}
      >
        <span>{displayValue || t("placeholder")}</span>
        <FiChevronDown
          className={cn("h-4 w-4 text-gray-400 shrink-0 transition-transform duration-150", open && "rotate-180")}
        />
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border border-gray-200 rounded-2xl shadow-lg py-5">
          <div className="flex" dir="ltr">
            <Column
              label={t("colDays")}    value={days}    min={0} max={14} step={1}
              onChange={(v) => { setDays(v);    update(v, hours, minutes); }}
            />
            <div className="w-px bg-gray-100 self-stretch" />
            <Column
              label={t("colHours")}   value={hours}   min={0} max={23} step={1}
              onChange={(v) => { setHours(v);   update(days, v, minutes); }}
            />
            <div className="w-px bg-gray-100 self-stretch" />
            <Column
              label={t("colMinutes")} value={minutes} min={0} max={55} step={5}
              onChange={(v) => { setMinutes(v); update(days, hours, v); }}
            />
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
    </div>
  );
}
