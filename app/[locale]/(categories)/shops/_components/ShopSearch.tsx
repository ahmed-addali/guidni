"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { cn } from "@/lib/utils";

type Props = {
  placeholder: string;
  clearLabel: string;
  defaultValue?: string;
  paramKey?: string;
};

export function ShopSearch({ placeholder, clearLabel, defaultValue, paramKey = "q" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set(paramKey, value);
      } else {
        params.delete(paramKey);
      }
      params.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams, paramKey]
  );

  const handleClear = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(paramKey);
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }, [router, pathname, searchParams, paramKey]);

  return (
    <div className="relative max-w-md w-full">
      <FiSearch
        className={cn(
          "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none transition-colors",
          isPending ? "text-blue-500 animate-pulse" : "text-gray-400"
        )}
      />
      <input
        type="search"
        defaultValue={defaultValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 pl-10 pr-9 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 shadow-sm outline-none hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-colors"
      />
      {defaultValue && (
        <button
          onClick={handleClear}
          aria-label={clearLabel}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <FiX className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
