"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { MdPeople } from "react-icons/md";
import { STAY_CATEGORIES } from "@/lib/utils/stay-categories";
import { cn } from "@/lib/utils";

type Props = {
  locale: string;
  clearAllLabel: string;
  priceChipLabel?: string;
  guestsChipLabel?: string;
};

export function StayFilterChips({ locale, clearAllLabel, priceChipLabel = "Price", guestsChipLabel = "Guests" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const categoryParam = searchParams.get("category") ?? "";
  const selected = categoryParam ? categoryParam.split(",").filter(Boolean) : [];
  const priceMin = searchParams.get("priceMin");
  const priceMax = searchParams.get("priceMax");
  const minGuests = searchParams.get("minGuests");

  const hasPrice = Boolean(priceMin || priceMax);
  const hasGuests = Boolean(minGuests && parseInt(minGuests, 10) > 1);
  const totalActive = selected.length + (hasPrice ? 1 : 0) + (hasGuests ? 1 : 0);

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

  const removePrice = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("priceMin");
    params.delete("priceMax");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const removeGuests = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("minGuests");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const clearAll = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.delete("priceMin");
    params.delete("priceMax");
    params.delete("minGuests");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  if (totalActive === 0) return null;

  const loc = locale as "en" | "fr" | "ar";
  const chipCls = "flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 transition-colors cursor-pointer";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {selected.map((id) => {
        const cat = STAY_CATEGORIES.find((c) => c.id === id);
        if (!cat) return null;
        const Icon = cat.icon;
        return (
          <button key={id} onClick={() => removeCategory(id)} className={cn(chipCls)}>
            <Icon className="w-3.5 h-3.5 shrink-0" />
            {cat.label[loc]}
            <X className="w-3 h-3 shrink-0" />
          </button>
        );
      })}

      {hasPrice && (
        <button onClick={removePrice} className={cn(chipCls)}>
          {priceChipLabel}
          {priceMin && priceMax ? `: ${priceMin}–${priceMax}` : priceMin ? `: ${priceMin}+` : priceMax ? `: ≤${priceMax}` : ""}
          <X className="w-3 h-3 shrink-0" />
        </button>
      )}

      {hasGuests && (
        <button onClick={removeGuests} className={cn(chipCls)}>
          <MdPeople className="w-3.5 h-3.5 shrink-0" />
          {guestsChipLabel}: {minGuests}+
          <X className="w-3 h-3 shrink-0" />
        </button>
      )}

      {totalActive > 1 && (
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
