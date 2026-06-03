"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const TYPES = [
  { value: "all",         label: "All" },
  { value: "RESTAURANT",  label: "Restaurants" },
  { value: "CAFEE_SHOP",  label: "Cafés" },
  { value: "BOTH",        label: "Restaurant & Café" },
];

interface Props {
  activeType: string | null;
  locale: string;
}

export function RestaurantTypeFilter({ activeType }: Props) {
  const router     = useRouter();
  const pathname   = usePathname();
  const searchParams = useSearchParams();

  function select(type: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (type === "all") {
      params.delete("type");
    } else {
      params.set("type", type);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const current = activeType ?? "all";

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 sm:px-6 pb-1">
      {TYPES.map((t) => (
        <button
          key={t.value}
          onClick={() => select(t.value)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-all",
            current === t.value
              ? "bg-primary text-white border-primary shadow-sm"
              : "bg-white text-gray-600 border-gray-200 hover:border-primary/50 hover:text-primary"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
