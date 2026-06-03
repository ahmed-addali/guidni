"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { UtensilsCrossed, Coffee, Egg, Wifi, Heart, Users, Moon, Tag, Sunset, Sunrise, MapPin, Baby } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─── Intent definitions ───────────────────────────────────────────────────────
// Each intent carries smart-default filter params applied on click.
// `attributes` is a comma-separated list — server uses OR logic (any match).

type IntentId = "all" | "breakfast" | "brunch" | "work" | "date" | "hangout" | "night" | "cheap" | "cosy" | "scenic" | "local" | "family";

type Intent = {
  id:       IntentId;
  icon:     LucideIcon;
  defaults: Partial<Record<"meal" | "type" | "attributes", string>>;
};

// Params controlled by intents — cleared when switching/deactivating
const INTENT_PARAMS = ["meal", "type", "attributes"] as const;

const INTENTS: Intent[] = [
  { id: "all",       icon: UtensilsCrossed, defaults: {} },
  { id: "breakfast", icon: Sunrise,         defaults: { meal: "Breakfast" } },
  { id: "brunch",    icon: Egg,             defaults: { meal: "Brunch" } },
  { id: "work",      icon: Wifi,            defaults: { type: "CAFEE_SHOP", attributes: "wifi" } },
  { id: "date",      icon: Heart,           defaults: { meal: "Dinner", attributes: "romantic" } },
  { id: "hangout",   icon: Users,           defaults: { attributes: "board_games" } },
  { id: "night",     icon: Moon,            defaults: { meal: "Dinner", type: "RESTAURANT", attributes: "live_music" } },
  { id: "cheap",     icon: Tag,             defaults: {} },
  { id: "cosy",      icon: Coffee,          defaults: { attributes: "cosy" } },
  { id: "scenic",    icon: Sunset,          defaults: { attributes: "sea_view,panoramic_view,rooftop" } },
  { id: "local",     icon: MapPin,          defaults: { type: "RESTAURANT" } },
  { id: "family",    icon: Baby,            defaults: { attributes: "family_friendly,children_menu,baby_space" } },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function RestaurantIntentTabs() {
  const t            = useTranslations("RestaurantsPage");
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const activeIntent = searchParams.get("intent") ?? "";

  function selectIntent(intent: Intent) {
    if (intent.id === "all") {
      router.push(pathname);
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    if (activeIntent === intent.id) {
      // Toggle off — remove intent marker and all intent-controlled params
      params.delete("intent");
      for (const key of INTENT_PARAMS) params.delete(key);
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
      return;
    }

    // Switch intent — clear previous intent params, apply new defaults
    // (cuisine, diet, reservation, foodType are kept as precision filters)
    for (const key of INTENT_PARAMS) params.delete(key);
    params.set("intent", intent.id);
    for (const [key, val] of Object.entries(intent.defaults)) {
      if (val) params.set(key, val as string);
    }

    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="border-b border-gray-100">
      <div className="mx-auto w-full max-w-screen-xl px-4 md:px-20 overflow-x-auto scrollbar-hide py-3">
        <div className="flex gap-1 w-fit mx-auto">
        {INTENTS.map((intent) => {
          const active =
            intent.id === "all" ? !activeIntent : activeIntent === intent.id;

          return (
            <button
              key={intent.id}
              onClick={() => selectIntent(intent)}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl shrink-0 transition-all cursor-pointer",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
              )}
            >
              <intent.icon size={20} strokeWidth={1.75} />
              <span className={cn(
                "text-xs whitespace-nowrap",
                active ? "font-semibold" : "font-medium"
              )}>
                {t(`intents.${intent.id}`)}
              </span>
            </button>
          );
        })}
        </div>
      </div>
    </div>
  );
}
