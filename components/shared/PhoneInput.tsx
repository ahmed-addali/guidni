"use client";

import { useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { FiChevronDown, FiPhone, FiSearch, FiX } from "react-icons/fi";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  PHONE_COUNTRIES,
  DEFAULT_COUNTRY_CODE,
  type PhoneCountry,
  getCountryByCode,
  parsePhoneValue,
  digitsOnly,
  formatLocal,
} from "@/lib/utils/phone-countries";

// ─── Props ────────────────────────────────────────────────────────────────────

interface PhoneInputProps {
  /** Full phone value including dial code, e.g. "+216 20 123 456" */
  value: string;
  /** Called with the new full phone string on every change */
  onChange: (value: string) => void;
  /** Falls back to country placeholder if omitted */
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  /** Must match the htmlFor on the external <label> */
  id?: string;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PhoneInput({
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  id: externalId,
  className,
}: PhoneInputProps) {
  const t = useTranslations("Components.phoneInput");
  const generatedId = useId();
  const inputId = externalId ?? generatedId;

  // ── Parse initial state from value prop ──────────────────────────────────
  const { country: initialCountry, local: initialLocal } = parsePhoneValue(value);
  const [country, setCountry] = useState<PhoneCountry>(initialCountry);
  const [localRaw, setLocalRaw] = useState<string>(initialLocal);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────
  function emitChange(c: PhoneCountry, local: string) {
    const digits = digitsOnly(local);
    const formatted = formatLocal(c, digits);
    if (!formatted) {
      onChange("");
    } else {
      onChange(`${c.dialCode} ${formatted}`);
    }
  }

  function handleLocalChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = digitsOnly(e.target.value);
    const formatted = formatLocal(country, digits);
    setLocalRaw(formatted);
    emitChange(country, formatted);
  }

  function handleCountrySelect(c: PhoneCountry) {
    setCountry(c);
    setOpen(false);
    setSearch("");
    emitChange(c, localRaw);
  }

  function handleClear() {
    setLocalRaw("");
    onChange("");
  }

  // ── Filtered list ────────────────────────────────────────────────────────
  const filtered = search.trim()
    ? PHONE_COUNTRIES.filter((c) => {
        const q = search.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.nameFr.toLowerCase().includes(q) ||
          c.dialCode.includes(q) ||
          c.code.toLowerCase().includes(q)
        );
      })
    : PHONE_COUNTRIES;

  // ── Styles ───────────────────────────────────────────────────────────────
  const hasError = Boolean(error);
  const wrapperCls = cn(
    "flex items-stretch h-11 rounded-xl border bg-white transition-colors",
    "focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary",
    hasError
      ? "border-red-400 focus-within:ring-red-200 focus-within:border-red-400"
      : "border-gray-200",
    disabled && "opacity-50 cursor-not-allowed bg-gray-50",
    className
  );

  return (
    <div className="w-full">
      {/* Input row */}
      <div className={wrapperCls}>
        {/* ── Country selector ─────────────────────────────── */}
        <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) setTimeout(() => searchRef.current?.focus(), 50); }}>
          <PopoverTrigger
            type="button"
            disabled={disabled}
            aria-label={t("selectCountry")}
            className={cn(
              "flex items-center gap-1.5 px-3 border-e border-gray-200",
              "text-sm text-gray-700 shrink-0 hover:bg-gray-50 rounded-s-xl transition-colors",
              "focus:outline-none focus-visible:ring-0",
              disabled && "pointer-events-none"
            )}
          >
            <span className="text-base leading-none">{country.flag}</span>
            <span className="font-medium text-gray-600 tabular-nums">
              {country.dialCode}
            </span>
            <FiChevronDown
              className={cn(
                "h-3.5 w-3.5 text-gray-400 transition-transform duration-200",
                open && "rotate-180"
              )}
            />
          </PopoverTrigger>

          <PopoverContent
            align="start"
            sideOffset={4}
            className="p-0 w-72 shadow-xl border border-gray-100 rounded-xl overflow-hidden"
          >
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
              <FiSearch className="h-4 w-4 text-gray-400 shrink-0" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Country list */}
            <ul className="max-h-60 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-4 py-3 text-sm text-gray-400 text-center">
                  {t("noResults")}
                </li>
              ) : (
                filtered.map((c) => (
                  <li key={c.code}>
                    <button
                      type="button"
                      onClick={() => handleCountrySelect(c)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left",
                        "hover:bg-gray-50 transition-colors",
                        c.code === country.code && "bg-primary/5 text-primary font-medium"
                      )}
                    >
                      <span className="text-base shrink-0">{c.flag}</span>
                      <span className="flex-1 truncate">{c.name}</span>
                      <span className="text-gray-400 tabular-nums text-xs font-mono shrink-0">
                        {c.dialCode}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </PopoverContent>
        </Popover>

        {/* ── Phone icon + number input ─────────────────────── */}
        <div className="flex items-center flex-1 min-w-0 px-3 gap-2">
          <FiPhone className="h-4 w-4 text-gray-400 shrink-0" />
          <input
            id={inputId}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            value={localRaw}
            onChange={handleLocalChange}
            disabled={disabled}
            placeholder={placeholder ?? country.placeholder}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${inputId}-error` : undefined}
            className={cn(
              "flex-1 min-w-0 bg-transparent text-sm text-gray-900",
              "placeholder:text-gray-400 outline-none",
              disabled && "pointer-events-none"
            )}
          />
          {/* Clear button — only when there's a value */}
          {localRaw && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              aria-label={t("clear")}
              className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FiX className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-red-500 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Re-export helpers for use in Zod schemas / server actions ────────────────

export { DEFAULT_COUNTRY_CODE, getCountryByCode, parsePhoneValue } from "@/lib/utils/phone-countries";
