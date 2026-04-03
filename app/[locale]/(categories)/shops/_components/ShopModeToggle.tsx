"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { FaStore, FaBoxOpen } from "react-icons/fa6";
import { cn } from "@/lib/utils";

interface Props {
  mode:          "shops" | "products";
  shopsLabel:    string;
  productsLabel: string;
}

const MODES = [
  { value: "shops"    as const, icon: FaStore   },
  { value: "products" as const, icon: FaBoxOpen },
];

export function ShopModeToggle({ mode, shopsLabel, productsLabel }: Props) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const labels: Record<"shops" | "products", string> = {
    shops:    shopsLabel,
    products: productsLabel,
  };

  function setMode(m: "shops" | "products") {
    const p = new URLSearchParams(searchParams.toString());
    p.set("mode", m);
    p.delete("handmade");
    p.delete("q");
    p.delete("page");
    router.push(`${pathname}?${p.toString()}`);
  }

  return (
    <div className="flex gap-1">
      {MODES.map(({ value, icon: Icon }) => {
        const active = mode === value;
        return (
          <button
            key={value}
            onClick={() => setMode(value)}
            className={cn(
              "flex flex-col items-center gap-1 px-8 py-2 rounded-xl transition-all cursor-pointer",
              active
                ? "bg-primary/10 text-primary"
                : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className={cn("text-xs whitespace-nowrap", active ? "font-semibold" : "font-medium")}>
              {labels[value]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
