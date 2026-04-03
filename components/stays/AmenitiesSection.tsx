"use client";

import { useState } from "react";
import { FaWifi, FaSwimmingPool, FaTree } from "react-icons/fa";
import { FaWheelchair } from "react-icons/fa6";
import { TbAirConditioning, TbToolsKitchen2, TbElevator } from "react-icons/tb";
import { LuHeater, LuCircleParking, LuConciergeBell } from "react-icons/lu";
import { MdBalcony } from "react-icons/md";
import { PiSecurityCameraBold } from "react-icons/pi";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StayDetail } from "@/types/stay";

interface AmenitiesSectionProps {
  stay: StayDetail;
  labels: {
    wifi: string;
    kitchen: string;
    ac: string;
    heating: string;
    pool: string;
    garden: string;
    balcony: string;
    parking: string;
    security: string;
    concierge: string;
    wheelchair: string;
    elevator: string;
    groupEssentials: string;
    groupOutdoors: string;
    groupSafety: string;
    showAll: string;
    showLess: string;
  };
}

const ALL_AMENITIES = [
  { key: "hasWifi",             icon: FaWifi,               labelKey: "wifi"       },
  { key: "hasKitchen",          icon: TbToolsKitchen2,      labelKey: "kitchen"    },
  { key: "hasAirConditioning",  icon: TbAirConditioning,    labelKey: "ac"         },
  { key: "hasHeating",          icon: LuHeater,             labelKey: "heating"    },
  { key: "hasPool",             icon: FaSwimmingPool,       labelKey: "pool"       },
  { key: "hasGarden",           icon: FaTree,               labelKey: "garden"     },
  { key: "hasBalcony",          icon: MdBalcony,            labelKey: "balcony"    },
  { key: "hasParking",          icon: LuCircleParking,      labelKey: "parking"    },
  { key: "hasSecurity",         icon: PiSecurityCameraBold, labelKey: "security"   },
  { key: "hasConcierge",        icon: LuConciergeBell,      labelKey: "concierge"  },
  { key: "wheelchairAccessible",icon: FaWheelchair,         labelKey: "wheelchair" },
  { key: "elevatorAvailable",   icon: TbElevator,           labelKey: "elevator"   },
] as const;

type LabelKey = "wifi" | "kitchen" | "ac" | "heating" | "pool" | "garden" | "balcony" | "parking" | "security" | "concierge" | "wheelchair" | "elevator";

const COLLAPSED_LIMIT = 8;

export function AmenitiesSection({ stay, labels }: AmenitiesSectionProps) {
  const [expanded, setExpanded] = useState(false);

  const available = ALL_AMENITIES.filter(
    (a) => stay[a.key as keyof StayDetail] === true
  );

  const visible = expanded ? available : available.slice(0, COLLAPSED_LIMIT);
  const hasMore = available.length > COLLAPSED_LIMIT;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {visible.map((amenity) => {
          const Icon = amenity.icon;
          return (
            <div
              key={amenity.key}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 border border-gray-100 bg-gray-50 text-sm"
            >
              <Icon className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-xs font-medium text-gray-700">
                {labels[amenity.labelKey as LabelKey]}
              </span>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 text-sm font-medium underline text-gray-700 hover:text-gray-900 transition-colors"
          )}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              {labels.showLess}
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              {labels.showAll.replace("{n}", available.length.toString())}
            </>
          )}
        </button>
      )}
    </div>
  );
}
