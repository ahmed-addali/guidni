"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { STAY_CATEGORIES } from "@/lib/utils/stay-categories";
import { cn } from "@/lib/utils";

type Props = {
  locale: string;
  clearAllLabel: string;
};

export function StayFilterChips({ locale, clearAllLabel }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const categoryParam = searchParams.get("category") ?? "";
  const selected = categoryParam ? categoryParam.split(",").filter(Boolean) : [];

  const remove = useCallback(
    (id: string) => {
      const next = selected.filter((v) => v !== id);
      const params = new URLSearchParams(searchParams.toString());
      if (next.length > 0) params.set("category", next.join(","));
      else params.delete("category");
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams, selected]
  );

  const clearAll = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  if (selected.length === 0) return null;

  const loc = locale as "en" | "fr" | "ar";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {selected.map((id) => {
        const cat = STAY_CATEGORIES.find((c) => c.id === id);
        if (!cat) return null;
        const Icon = cat.icon;
        return (
          <button
            key={id}
            onClick={() => remove(id)}
            className={cn(
              "flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-full text-xs font-medium",
              "bg-primary/10 text-primary border border-primary/20",
              "hover:bg-primary/15 transition-colors cursor-pointer"
            )}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            {cat.label[loc]}
            <X className="w-3 h-3 shrink-0" />
          </button>
        );
      })}
      {selected.length > 1 && (
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
