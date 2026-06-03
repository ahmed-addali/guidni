"use client";

import { FiMinus, FiPlus } from "react-icons/fi";

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function CounterInput({ value, onChange, min = 0, max = 99, disabled = false }: Props) {
  return (
    <div className="inline-flex items-center gap-0">
      <button
        type="button"
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="h-9 w-9 flex items-center justify-center rounded-l-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Decrease"
      >
        <FiMinus className="h-3.5 w-3.5" />
      </button>
      <div className="h-9 w-12 flex items-center justify-center border-t border-b border-gray-200 text-sm font-semibold text-gray-800 select-none tabular-nums">
        {value}
      </div>
      <button
        type="button"
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="h-9 w-9 flex items-center justify-center rounded-r-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Increase"
      >
        <FiPlus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
