"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FiActivity, FiHome } from "react-icons/fi";
import { IoRestaurant } from "react-icons/io5";
import { TbCar, TbRoute } from "react-icons/tb";
import { FaStore, FaCompass } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { updateBusinessProfileCategories } from "@/lib/actions/partner";

const CATEGORY_OPTIONS = [
  {
    value: "activities",
    label: "Activities & Tours",
    description: "Day trips, guided tours, outdoor adventures",
    icon: FiActivity,
  },
  {
    value: "stays",
    label: "Stays & Accommodation",
    description: "Villas, apartments, guesthouses, hotels",
    icon: FiHome,
  },
  {
    value: "restaurant",
    label: "Restaurant & Café",
    description: "Restaurants, cafés, food & dining experiences",
    icon: IoRestaurant,
  },
  {
    value: "rentals",
    label: "Rentals",
    description: "Cars, bikes, scooters, boats",
    icon: TbCar,
  },
  {
    value: "transfers",
    label: "Transfers & Transport",
    description: "Airport pickups, city taxis, chauffeur services, shuttles",
    icon: TbRoute,
  },
  {
    value: "shop",
    label: "Shop",
    description: "Handmade, artisan, and local products",
    icon: FaStore,
  },
  {
    value: "guide",
    label: "Local Guide",
    description: "Sell curated trip plans based on your local expertise",
    icon: FaCompass,
  },
] as const;

interface Props {
  current: string[];
}

export function CategoriesSection({ current }: Props) {
  const [selected, setSelected] = useState<string[]>(current);
  const [pending, start] = useTransition();

  function toggle(value: string) {
    setSelected((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  }

  function handleSave() {
    if (selected.length === 0) {
      toast.error("Select at least one category.");
      return;
    }
    start(async () => {
      const res = await updateBusinessProfileCategories({ categories: selected });
      if (res.success) toast.success("Categories updated.");
      else toast.error(res.error ?? "Failed to update categories.");
    });
  }

  const dirty = JSON.stringify([...selected].sort()) !== JSON.stringify([...current].sort());

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">
      <div className="border-b border-gray-100 pb-3">
        <h2 className="font-semibold text-gray-800">Business Categories</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Choose which types of listings you manage. Only selected categories appear in your sidebar.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CATEGORY_OPTIONS.map(({ value, label, description, icon: Icon }) => {
          const active = selected.includes(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => toggle(value)}
              className={cn(
                "flex items-start gap-3 p-4 rounded-xl border text-left transition-colors",
                active
                  ? "border-primary/40 bg-primary/5"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              <div className={cn(
                "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                active ? "bg-primary/10" : "bg-gray-100"
              )}>
                <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-gray-500")} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium", active ? "text-primary" : "text-gray-800")}>
                  {label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 leading-snug">{description}</p>
              </div>
              <div className={cn(
                "h-4 w-4 rounded border-2 shrink-0 mt-1 flex items-center justify-center transition-colors",
                active ? "border-primary bg-primary" : "border-gray-300"
              )}>
                {active && (
                  <svg viewBox="0 0 8 8" className="h-2.5 w-2.5 text-white fill-current">
                    <path d="M1.5 4L3.5 6L6.5 2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {dirty && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={pending || selected.length === 0}
            className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save categories"}
          </button>
        </div>
      )}
    </div>
  );
}
