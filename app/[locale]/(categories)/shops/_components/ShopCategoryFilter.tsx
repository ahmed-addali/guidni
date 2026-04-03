"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SHOP_CATEGORIES } from "@/lib/utils/shop-categories";
import { cn } from "@/lib/utils";

interface Props {
  activeCategory: string;
  allLabel:       string;
  locale:         string;
}

export function ShopCategoryFilter({ activeCategory, allLabel, locale }: Props) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  function setCategory(cat: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (cat) {
      p.set("category", cat);
    } else {
      p.delete("category");
    }
    router.push(`${pathname}?${p.toString()}`);
  }

  const categories = [
    { id: "", icon: "🏪", label: allLabel },
    ...SHOP_CATEGORIES.map((c) => ({
      id:    c.id,
      icon:  c.icon,
      label: c.label[locale as keyof typeof c.label] ?? c.label.en,
    })),
  ];

  return (
    <div className="border-b border-gray-100">
      <div className="mx-auto w-full max-w-screen-xl px-4 md:px-20 overflow-x-auto scrollbar-hide py-3">
        <div className="flex gap-1 w-fit mx-auto">
        {categories.map(({ id, icon, label }) => {
          const isActive = activeCategory === id;
          return (
            <button
              key={id}
              onClick={() => setCategory(id)}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl shrink-0 transition-all cursor-pointer",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
              )}
            >
              <span className="text-xl leading-none">{icon}</span>
              <span className={cn("text-xs whitespace-nowrap", isActive ? "font-semibold" : "font-medium")}>
                {label}
              </span>
            </button>
          );
        })}
        </div>
      </div>
    </div>
  );
}
