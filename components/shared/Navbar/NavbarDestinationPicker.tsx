"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MapPin, ChevronDown, Check, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDestinationStore } from "@/stores/destinationStore";
import { setDestinationCookie } from "@/lib/actions/destination-cookie";
import { cn } from "@/lib/utils";

type DestinationOption = {
  slug:    string;
  city:    string;
  country: string;
};

type Props = {
  destinations: DestinationOption[];
};

export function NavbarDestinationPicker({ destinations }: Props) {
  const t = useTranslations("DestinationPicker");
  const { destination, setDestination } = useDestinationStore();
  const [open, setOpen]               = useState(false);
  const [search, setSearch]           = useState("");
  const [activeCountry, setActiveCountry] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // All unique countries
  const countries = useMemo(
    () => Array.from(new Set(destinations.map((d) => d.country))),
    [destinations]
  );
  const hasMultipleCountries = countries.length > 1;

  // Filtered + grouped destinations
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return destinations.filter((d) => {
      const matchesSearch =
        !q ||
        d.city.toLowerCase().includes(q) ||
        d.country.toLowerCase().includes(q);
      const matchesCountry = !activeCountry || d.country === activeCountry;
      return matchesSearch && matchesCountry;
    });
  }, [destinations, search, activeCountry]);

  const grouped = useMemo(
    () =>
      filtered.reduce<Record<string, DestinationOption[]>>((acc, d) => {
        acc[d.country] = acc[d.country] ?? [];
        acc[d.country].push(d);
        return acc;
      }, {}),
    [filtered]
  );

  // Close on Escape, focus search when opened
  useEffect(() => {
    if (!open) {
      setSearch("");
      setActiveCountry(null);
      return;
    }
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler);
    // Delay so the panel has rendered
    const t = setTimeout(() => searchRef.current?.focus(), 50);
    return () => {
      window.removeEventListener("keydown", handler);
      clearTimeout(t);
    };
  }, [open]);

  async function select(dest: DestinationOption) {
    setDestination(dest);
    setOpen(false);
    await setDestinationCookie(dest.slug);
    router.refresh();
  }

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        aria-label={t("triggerAriaLabel")}
        className="flex items-center gap-2 h-9 px-2.5 sm:px-3.5 rounded-xl sm:border sm:border-gray-200 text-gray-700 hover:border-primary/50 hover:bg-gray-50 transition-colors cursor-pointer text-sm font-medium sm:max-w-[180px]"
      >
        <MapPin className="h-4 w-4 text-gray-600 shrink-0" />
        <span className="hidden sm:block truncate" suppressHydrationWarning>
          {destination.city}
        </span>
      </button>

      {/* Backdrop + panel */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col h-[480px]">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-base font-semibold text-gray-900">{t("title")}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{t("subtitle")}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search */}
            <div className="px-6 pt-4 pb-3 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="w-full h-9 pl-9 pr-8 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors bg-gray-50"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Country chips — only when >1 country */}
            {hasMultipleCountries && (
              <div className="px-6 pb-3 flex flex-wrap gap-1.5 shrink-0">
                <button
                  onClick={() => setActiveCountry(null)}
                  className={cn(
                    "h-7 px-3 rounded-full text-xs font-medium border transition-colors",
                    !activeCountry
                      ? "bg-primary text-white border-primary"
                      : "border-gray-200 text-gray-600 hover:border-primary/40 hover:bg-gray-50"
                  )}
                >
                  {t("allCountries")}
                </button>
                {countries.map((country) => (
                  <button
                    key={country}
                    onClick={() => setActiveCountry(activeCountry === country ? null : country)}
                    className={cn(
                      "h-7 px-3 rounded-full text-xs font-medium border transition-colors",
                      activeCountry === country
                        ? "bg-primary text-white border-primary"
                        : "border-gray-200 text-gray-600 hover:border-primary/40 hover:bg-gray-50"
                    )}
                  >
                    {country}
                  </button>
                ))}
              </div>
            )}

            {/* Destination list — scrollable, takes remaining space */}
            <div className="flex-1 overflow-y-auto px-6 pb-5 space-y-5">
              {Object.keys(grouped).length === 0 ? (
                <div className="py-10 flex flex-col items-center gap-2 text-center">
                  <MapPin className="h-8 w-8 text-gray-200" />
                  <p className="text-sm text-gray-500 font-medium">{t("emptyTitle")}</p>
                  <p className="text-xs text-gray-400">{t("emptySubtitle")}</p>
                  <button
                    onClick={() => { setSearch(""); setActiveCountry(null); }}
                    className="mt-2 text-xs text-primary hover:underline"
                  >
                    {t("clearFilters")}
                  </button>
                </div>
              ) : (
                Object.entries(grouped).map(([country, dests]) => (
                  <div key={country}>
                    {/* Country heading — only shown when multiple countries visible */}
                    {Object.keys(grouped).length > 1 && (
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
                        {country}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      {dests.map((d) => {
                        const isSelected = destination.slug === d.slug;
                        return (
                          <button
                            key={d.slug}
                            onClick={() => select(d)}
                            className={cn(
                              "relative flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium transition-colors text-left cursor-pointer",
                              isSelected
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-gray-200 text-gray-700 hover:border-primary/40 hover:bg-gray-50"
                            )}
                          >
                            <MapPin className={cn("h-4 w-4 shrink-0", isSelected ? "text-primary" : "text-gray-400")} />
                            <span className="truncate">{d.city}</span>
                            {isSelected && (
                              <Check className="h-3.5 w-3.5 shrink-0 ml-auto text-primary" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
