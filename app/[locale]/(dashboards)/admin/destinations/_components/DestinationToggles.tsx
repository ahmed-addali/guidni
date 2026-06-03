"use client";

import { useState, useTransition } from "react";
import { toggleDestinationActive, toggleDestinationFeatured } from "@/lib/actions/admin";

interface Props {
  id: string;
  active: boolean;
  featured: boolean;
}

function Toggle({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
          value ? "bg-primary" : "bg-gray-200"
        }`}
        role="switch"
        aria-checked={value}
        aria-label={label}
      >
        <span
          className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-md transition-transform ${
            value ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export function DestinationToggles({ id, active, featured }: Props) {
  const [isActive,   setIsActive]   = useState(active);
  const [isFeatured, setIsFeatured] = useState(featured);
  const [, startTransition] = useTransition();

  function handleActive(v: boolean) {
    setIsActive(v);
    startTransition(async () => {
      const result = await toggleDestinationActive(id, v);
      if (!result.success) setIsActive(!v);
    });
  }

  function handleFeatured(v: boolean) {
    setIsFeatured(v);
    startTransition(async () => {
      const result = await toggleDestinationFeatured(id, v);
      if (!result.success) setIsFeatured(!v);
    });
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Toggle value={isActive} onChange={handleActive} label="Active" />
        <span className={`text-xs font-medium ${isActive ? "text-green-600" : "text-gray-400"}`}>
          {isActive ? "Active" : "Inactive"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Toggle value={isFeatured} onChange={handleFeatured} label="Featured" />
        <span className={`text-xs font-medium ${isFeatured ? "text-primary" : "text-gray-400"}`}>
          {isFeatured ? "Featured" : "Normal"}
        </span>
      </div>
    </div>
  );
}
