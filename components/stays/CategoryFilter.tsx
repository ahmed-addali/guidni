"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { HiViewGrid } from "react-icons/hi";
import { STAY_CATEGORIES } from "@/lib/utils/stay-categories";
import { cn } from "@/lib/utils";

type Props = {
  activeCategory: string | null;
  locale: string;
  allLabel: string;
};

export function CategoryFilter({ activeCategory, locale, allLabel }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setCategory = useCallback(
    (category: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (category) {
        params.set("category", category);
      } else {
        params.delete("category");
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const loc = (locale as "en" | "fr" | "ar") ?? "en";

  return (
    <div className="border-b border-gray-100">
      <div className="mx-auto w-full max-w-screen-xl px-4 md:px-20 flex gap-1 overflow-x-auto scrollbar-hide py-3">
        {/* All */}
        <button
          onClick={() => setCategory(null)}
          className={cn(
            "flex flex-col items-center gap-1 px-4 py-2 rounded-xl shrink-0 transition-all cursor-pointer",
            !activeCategory
              ? "bg-primary/10 text-primary"
              : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
          )}
        >
          <HiViewGrid className="h-5 w-5" />
          <span className={cn("text-xs whitespace-nowrap", !activeCategory ? "font-semibold" : "font-medium")}>
            {allLabel}
          </span>
        </button>

        {STAY_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl shrink-0 transition-all cursor-pointer",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className={cn("text-xs whitespace-nowrap", isActive ? "font-semibold" : "font-medium")}>
                {cat.label[loc]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
