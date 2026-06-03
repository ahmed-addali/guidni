"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Globe, MapPin, ChevronDown, Search, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DestinationOption = {
  id: string;
  slug: string;
  city: string;
  country: string;
};

interface Props {
  destinations: DestinationOption[];
  /** Currently selected destinationId */
  value: string;
  onChange: (opt: DestinationOption) => void;
  error?: string;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DestinationInput({ destinations, value, onChange, error, className }: Props) {
  const t = useTranslations("DestinationInput");

  // ── Derive current selection ─────────────────────────────────────────────
  const selected = destinations.find((d) => d.id === value) ?? null;

  // ── Internal country state — defaults to selected dest's country ─────────
  const [selectedCountry, setSelectedCountry] = useState<string>(
    selected?.country ?? ""
  );

  // ── Popover open states ──────────────────────────────────────────────────
  const [countryOpen, setCountryOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  // ── Search states ────────────────────────────────────────────────────────
  const [countrySearch, setCountrySearch] = useState("");
  const [citySearch, setCitySearch] = useState("");

  const countrySearchRef = useRef<HTMLInputElement>(null);
  const citySearchRef = useRef<HTMLInputElement>(null);

  // ── Derived lists ────────────────────────────────────────────────────────
  const countries = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const d of destinations) {
      if (!seen.has(d.country)) { seen.add(d.country); list.push(d.country); }
    }
    return list.sort();
  }, [destinations]);

  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    return q ? countries.filter((c) => c.toLowerCase().includes(q)) : countries;
  }, [countries, countrySearch]);

  const citiesForCountry = useMemo(
    () => destinations.filter((d) => d.country === selectedCountry),
    [destinations, selectedCountry]
  );

  const filteredCities = useMemo(() => {
    const q = citySearch.trim().toLowerCase();
    return q ? citiesForCountry.filter((d) => d.city.toLowerCase().includes(q)) : citiesForCountry;
  }, [citiesForCountry, citySearch]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  function handleCountrySelect(country: string) {
    setSelectedCountry(country);
    setCountrySearch("");
    setCountryOpen(false);
    // Auto-select first city of that country
    const first = destinations.find((d) => d.country === country);
    if (first) onChange(first);
    // Open city popover after a brief delay
    setTimeout(() => {
      setCityOpen(true);
      setTimeout(() => citySearchRef.current?.focus(), 50);
    }, 150);
  }

  function handleCitySelect(opt: DestinationOption) {
    onChange(opt);
    setCitySearch("");
    setCityOpen(false);
  }

  // ── Styles ───────────────────────────────────────────────────────────────
  const hasError = Boolean(error);
  const wrapperCls = cn(
    "flex items-stretch h-11 rounded-xl border bg-white transition-colors",
    "focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary",
    hasError
      ? "border-red-400 focus-within:ring-red-200 focus-within:border-red-400"
      : "border-gray-200",
    className
  );

  return (
    <div className="w-full">
      <div className={wrapperCls}>

        {/* ── Country selector ─────────────────────────────────────────── */}
        <Popover
          open={countryOpen}
          onOpenChange={(o) => {
            setCountryOpen(o);
            if (o) setTimeout(() => countrySearchRef.current?.focus(), 50);
          }}
        >
          <PopoverTrigger
            type="button"
            aria-label={t("selectCountry")}
            className={cn(
              "flex items-center gap-1.5 px-3 border-e border-gray-200 shrink-0",
              "text-sm text-gray-700 hover:bg-gray-50 rounded-s-xl transition-colors",
              "focus:outline-none focus-visible:ring-0"
            )}
          >
            <Globe className="h-4 w-4 text-gray-400 shrink-0" />
            <span className={cn("font-medium", selectedCountry ? "text-gray-800" : "text-gray-400")}>
              {selectedCountry || t("countryPlaceholder")}
            </span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-gray-400 transition-transform duration-200",
                countryOpen && "rotate-180"
              )}
            />
          </PopoverTrigger>

          <PopoverContent
            align="start"
            sideOffset={4}
            className="p-0 w-64 shadow-xl border border-gray-100 rounded-xl overflow-hidden"
          >
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
              <Search className="h-4 w-4 text-gray-400 shrink-0" />
              <input
                ref={countrySearchRef}
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                placeholder={t("searchCountry")}
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400"
              />
              {countrySearch && (
                <button type="button" onClick={() => setCountrySearch("")} className="text-gray-400 hover:text-gray-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Country list */}
            <ul className="max-h-52 overflow-y-auto py-1">
              {filteredCountries.length === 0 ? (
                <li className="px-4 py-3 text-sm text-gray-400 text-center">{t("noResults")}</li>
              ) : (
                filteredCountries.map((country) => (
                  <li key={country}>
                    <button
                      type="button"
                      onClick={() => handleCountrySelect(country)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left",
                        "hover:bg-gray-50 transition-colors",
                        country === selectedCountry && "bg-primary/5 text-primary font-medium"
                      )}
                    >
                      <Globe className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                      <span className="flex-1 truncate">{country}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </PopoverContent>
        </Popover>

        {/* ── City selector ─────────────────────────────────────────────── */}
        <Popover
          open={cityOpen}
          onOpenChange={(o) => {
            setCityOpen(o);
            if (o) setTimeout(() => citySearchRef.current?.focus(), 50);
          }}
        >
          <PopoverTrigger
            type="button"
            aria-label={t("selectCity")}
            disabled={!selectedCountry}
            className={cn(
              "flex items-center gap-1.5 px-3 flex-1 min-w-0",
              "text-sm text-gray-700 hover:bg-gray-50 rounded-e-xl transition-colors",
              "focus:outline-none focus-visible:ring-0",
              !selectedCountry && "pointer-events-none"
            )}
          >
            <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
            <span className={cn("flex-1 truncate text-left font-medium", selected ? "text-gray-800" : "text-gray-400")}>
              {selected ? selected.city : t("cityPlaceholder")}
            </span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-gray-400 shrink-0 transition-transform duration-200",
                cityOpen && "rotate-180"
              )}
            />
          </PopoverTrigger>

          <PopoverContent
            align="start"
            sideOffset={4}
            className="p-0 w-64 shadow-xl border border-gray-100 rounded-xl overflow-hidden"
          >
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
              <Search className="h-4 w-4 text-gray-400 shrink-0" />
              <input
                ref={citySearchRef}
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                placeholder={t("searchCity")}
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400"
              />
              {citySearch && (
                <button type="button" onClick={() => setCitySearch("")} className="text-gray-400 hover:text-gray-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* City list */}
            <ul className="max-h-52 overflow-y-auto py-1">
              {filteredCities.length === 0 ? (
                <li className="px-4 py-3 text-sm text-gray-400 text-center">{t("noResults")}</li>
              ) : (
                filteredCities.map((opt) => (
                  <li key={opt.id}>
                    <button
                      type="button"
                      onClick={() => handleCitySelect(opt)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left",
                        "hover:bg-gray-50 transition-colors",
                        opt.id === value && "bg-primary/5 text-primary font-medium"
                      )}
                    >
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                      <span className="flex-1 truncate">{opt.city}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </PopoverContent>
        </Popover>

      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}
