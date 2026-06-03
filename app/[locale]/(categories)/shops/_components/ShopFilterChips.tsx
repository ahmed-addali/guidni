"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { SHOP_CATEGORIES } from "@/lib/utils/shop-categories";
import { cn } from "@/lib/utils";

type Props = {
  mode: "shops" | "products";
  locale: string;
  clearAllLabel: string;
  handmadeLabel: string;
};

export function ShopFilterChips({ mode, locale, clearAllLabel, handmadeLabel }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const categoryParam = searchParams.get("category") ?? "";
  const selected = categoryParam ? categoryParam.split(",").filter(Boolean) : [];
  const handmade = searchParams.get("handmade") === "true";

  const totalCount = selected.length + (mode === "products" && handmade ? 1 : 0);

  const removeCategory = useCallback(
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

  const removeHandmade = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("handmade");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const clearAll = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.delete("handmade");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  if (totalCount === 0) return null;

  const loc = locale as "en" | "fr" | "ar";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {selected.map((id) => {
        const cat = SHOP_CATEGORIES.find((c) => c.id === id);
        if (!cat) return null;
        return (
          <button
            key={id}
            onClick={() => removeCategory(id)}
            className={cn(
              "flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-full text-xs font-medium",
              "bg-primary/10 text-primary border border-primary/20",
              "hover:bg-primary/15 transition-colors cursor-pointer"
            )}
          >
            <span className="text-sm leading-none">{cat.icon}</span>
            {cat.label[loc]}
            <X className="w-3 h-3 shrink-0" />
          </button>
        );
      })}

      {mode === "products" && handmade && (
        <button
          onClick={removeHandmade}
          className={cn(
            "flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-full text-xs font-medium",
            "bg-primary/10 text-primary border border-primary/20",
            "hover:bg-primary/15 transition-colors cursor-pointer"
          )}
        >
          ✋ {handmadeLabel}
          <X className="w-3 h-3 shrink-0" />
        </button>
      )}

      {totalCount > 1 && (
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
