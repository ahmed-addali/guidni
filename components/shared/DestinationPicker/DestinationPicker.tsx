"use client";

import { useState, useTransition } from "react";
import { MapPin, ChevronDown, X } from "lucide-react";
import { useDestination } from "@/hooks/useDestination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Destination = {
  slug: string;
  city: string;
  country: string;
};

type Props = {
  destinations: Destination[];
};

export function DestinationPicker({ destinations }: Props) {
  const { destination, setDestination } = useDestination();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const active = destinations.find((d) => d.slug === destination);

  const grouped = destinations.reduce<Record<string, Destination[]>>(
    (acc, d) => {
      acc[d.country] = acc[d.country] ?? [];
      acc[d.country].push(d);
      return acc;
    },
    {}
  );

  function select(slug: string | null) {
    startTransition(() => setDestination(slug));
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-normal border border-gray-200 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="max-w-[120px] truncate">
          {active ? active.city : "All Destinations"}
        </span>
        {active ? (
          <X
            className="h-3 w-3 text-gray-400 hover:text-gray-600 ml-0.5 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              select(null);
            }}
          />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
        )}
      </PopoverTrigger>

      <PopoverContent align="start" className="w-56 p-1">
        <button
          onClick={() => select(null)}
          className={cn(
            "w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors",
            !destination && "bg-primary/10 text-primary font-medium"
          )}
        >
          All Destinations
        </button>

        <div className="my-1 h-px bg-gray-100" />

        {Object.entries(grouped).map(([country, dests]) => (
          <div key={country}>
            <p className="px-3 pt-1 pb-0.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {country}
            </p>
            {dests.map((d) => (
              <button
                key={d.slug}
                onClick={() => select(d.slug)}
                className={cn(
                  "w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 transition-colors flex items-center gap-2",
                  destination === d.slug &&
                    "bg-primary/10 text-primary font-medium"
                )}
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 opacity-50" />
                {d.city}
              </button>
            ))}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}
