"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { ACTIVITY_CATEGORIES } from "@/lib/utils/activity-categories";
import { cn } from "@/lib/utils";

type Props = {
  locale: string;
  clearAllLabel: string;
  sortOptions:     Record<string, string>;
  priceOptions:    Record<string, string>;
  durationOptions: Record<string, string>;
};

export function ActivityFilterChips({
  locale,
  clearAllLabel,
  sortOptions,
  priceOptions,
  durationOptions,
}: Props) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const categoryParam = searchParams.get("category")  ?? "";
  const sortParam     = searchParams.get("sort")       ?? "";
  const priceParam    = searchParams.get("priceRange") ?? "";
  const durationParam = searchParams.get("duration")   ?? "";

  const selected = categoryParam ? categoryParam.split(",").filter(Boolean) : [];

  const removeParam = useCallback(
    (key: string, value?: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (key === "category" && value) {
        const next = selected.filter((v) => v !== value);
        if (next.length > 0) params.set("category", next.join(","));
        else params.delete("category");
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams, selected]
  );

  const clearAll = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.delete("sort");
    params.delete("priceRange");
    params.delete("duration");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const chips: { key: string; value: string; label: string }[] = [];

  // Sort chip (only if not default)
  if (sortParam && sortOptions[sortParam]) {
    chips.push({ key: "sort", value: sortParam, label: sortOptions[sortParam] });
  }
  // Price chip
  if (priceParam && priceOptions[priceParam]) {
    chips.push({ key: "priceRange", value: priceParam, label: priceOptions[priceParam] });
  }
  // Duration chip
  if (durationParam && durationOptions[durationParam]) {
    chips.push({ key: "duration", value: durationParam, label: durationOptions[durationParam] });
  }
  // Category chips
  for (const id of selected) {
    const cat = ACTIVITY_CATEGORIES.find((c) => c.id === id);
    if (!cat) continue;
    const Icon  = cat.icon;
    chips.push({ key: "category", value: id, label: cat.label[locale as "en" | "fr" | "ar"] ?? cat.label.en });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map(({ key, value, label }) => {
        const cat  = key === "category" ? ACTIVITY_CATEGORIES.find((c) => c.id === value) : null;
        const Icon = cat?.icon;
        return (
          <button
            key={`${key}-${value}`}
            onClick={() => removeParam(key, key === "category" ? value : undefined)}
            className={cn(
              "flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-full text-xs font-medium",
              "bg-primary/10 text-primary border border-primary/20",
              "hover:bg-primary/15 transition-colors cursor-pointer"
            )}
          >
            {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
            {label}
            <X className="w-3 h-3 shrink-0" />
          </button>
        );
      })}
      {chips.length > 1 && (
        <button
          onClick={clearAll}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors cursor-pointer underline-offset-2 hover:underline"
        >
          {clearAllLabel}
        </button>
      )}
    </div>
  );
}
