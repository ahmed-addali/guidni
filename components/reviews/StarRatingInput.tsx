"use client";

import { useState } from "react";
import { FaStar } from "react-icons/fa";
import { cn } from "@/lib/utils";

const LABELS = ["Terrible", "Poor", "Average", "Very good", "Excellent"];

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
}

export function StarRatingInput({ value, onChange }: StarRatingInputProps) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => i + 1).map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            aria-label={`Rate ${star} out of 5`}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <FaStar
              className={cn(
                "h-7 w-7 transition-colors",
                star <= active ? "text-yellow-400" : "text-gray-200"
              )}
            />
          </button>
        ))}
      </div>
      {active > 0 && (
        <span className="text-sm font-medium text-gray-600">
          {LABELS[active - 1]}
        </span>
      )}
    </div>
  );
}
