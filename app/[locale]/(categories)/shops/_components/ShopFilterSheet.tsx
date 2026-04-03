"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, Check } from "lucide-react";
import { SHOP_CATEGORIES } from "@/lib/utils/shop-categories";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type Props = {
  mode: "shops" | "products";
  locale: string;
  allLabel: string;
  filtersLabel: string;
  clearLabel: string;
  handmadeLabel: string;
};

export function ShopFilterSheet({
  mode,
  locale,
  allLabel,
  filtersLabel,
  clearLabel,
  handmadeLabel,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const categoryParam = searchParams.get("category") ?? "";
  const selected = categoryParam ? categoryParam.split(",").filter(Boolean) : [];
  const handmade = searchParams.get("handmade") === "true";

  const activeCount = selected.length + (mode === "products" && handmade ? 1 : 0);

  const toggleCategory = useCallback(
    (id: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id === null) {
        params.delete("category");
      } else {
        const next = selected.includes(id)
          ? selected.filter((v) => v !== id)
          : [...selected, id];
        if (next.length > 0) params.set("category", next.join(","));
        else params.delete("category");
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams, selected]
  );

  const toggleHandmade = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (handmade) params.delete("handmade");
    else params.set("handmade", "true");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams, handmade]);

  const clearAll = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.delete("handmade");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const loc = locale as "en" | "fr" | "ar";

  return (
    <Sheet>
      <SheetTrigger
        className={cn(
          "flex items-center gap-2 h-11 px-4 rounded-xl border text-sm font-medium transition-all shrink-0 cursor-pointer whitespace-nowrap",
          activeCount > 0
            ? "border-primary bg-primary/10 text-primary"
            : "border-gray-200 bg-white text-gray-600 hover:border-primary/40 shadow-sm"
        )}
      >
        <SlidersHorizontal className="w-4 h-4" />
        {activeCount > 0 ? `${filtersLabel} · ${activeCount}` : filtersLabel}
      </SheetTrigger>

      <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-safe max-h-[85vh]">
        <SheetHeader className="px-5 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-semibold text-gray-900">
              {filtersLabel}
            </SheetTitle>
            {activeCount > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
                {clearLabel}
              </button>
            )}
          </div>
        </SheetHeader>

        <div className="overflow-y-auto p-4 pb-8 space-y-5">

          {/* Categories */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
              Category
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              <button
                onClick={() => toggleCategory(null)}
                className={cn(
                  "flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border transition-all cursor-pointer",
                  selected.length === 0
                    ? "bg-primary/10 border-primary/20 text-primary"
                    : "bg-white border-gray-100 text-gray-500 hover:border-gray-200 hover:text-gray-700"
                )}
              >
                <span className="text-xl leading-none">🏪</span>
                <span className={cn("text-xs text-center leading-tight", selected.length === 0 ? "font-semibold" : "font-medium")}>
                  {allLabel}
                </span>
              </button>

              {SHOP_CATEGORIES.map((cat) => {
                const isActive = selected.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border transition-all cursor-pointer",
                      isActive
                        ? "bg-primary/10 border-primary/20 text-primary"
                        : "bg-white border-gray-100 text-gray-500 hover:border-gray-200 hover:text-gray-700"
                    )}
                  >
                    <span className="text-xl leading-none">{cat.icon}</span>
                    <span className={cn("text-xs text-center leading-tight", isActive ? "font-semibold" : "font-medium")}>
                      {cat.label[loc]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Handmade toggle — products mode only */}
          {mode === "products" && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
                Product type
              </p>
              <button
                onClick={toggleHandmade}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all cursor-pointer",
                  handmade
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                )}
              >
                {handmade && <Check className="w-3.5 h-3.5 shrink-0" />}
                {handmadeLabel}
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
