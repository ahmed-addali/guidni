"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  searchPlaceholder: string;
  clearLabel: string;
  countryPlaceholder: string;
  filterAll: string;
  countries: string[];
  flags: Record<string, string>;
  defaultSearch?: string;
  defaultCountry?: string;
};

export function DestinationFilters({
  searchPlaceholder,
  clearLabel,
  countryPlaceholder,
  filterAll,
  countries,
  flags,
  defaultSearch,
  defaultCountry,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function navigate(patches: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(patches)) {
      if (val) params.set(key, val);
      else params.delete(key);
    }
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  const handleSearch = useCallback(
    (value: string) => {
      // Search always scans all — clear country
      navigate({ q: value.trim(), country: "" });
    },
    [searchParams]
  );

  const handleClear = useCallback(() => {
    navigate({ q: "", country: defaultCountry ?? "" });
  }, [searchParams, defaultCountry]);

  const handleCountry = useCallback(
    (value: string | null) => {
      // Country select always clears search
      navigate({ country: value ?? "", q: "" });
    },
    [searchParams]
  );

  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xl">
      {/* ── Search input ── */}
      <div className="relative flex-1">
        <FiSearch
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none transition-colors",
            isPending ? "text-blue-500 animate-pulse" : "text-gray-400"
          )}
        />
        <input
          type="search"
          defaultValue={defaultSearch}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full h-11 pl-10 pr-9 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 shadow-sm outline-none hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-colors"
        />
        {defaultSearch && (
          <button
            onClick={handleClear}
            aria-label={clearLabel}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Country select ── */}
      {countries.length > 1 && (
        <div className="w-[160px] shrink-0">
        <Select
          value={defaultCountry ?? null}
          onValueChange={handleCountry}
        >
          <SelectTrigger className="!h-11 shadow-sm">
            <SelectValue placeholder={countryPlaceholder} />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="">
              {filterAll}
            </SelectItem>
            {countries.map((c) => (
              <SelectItem key={c} value={c}>
                {flags[c] ? `${flags[c]} ${c}` : c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        </div>
      )}
    </div>
  );
}
