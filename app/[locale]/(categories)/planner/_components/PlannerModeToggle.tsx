"use client";

import { FaRobot, FaCompass } from "react-icons/fa6";

type Mode = "ai" | "guides";

type Props = {
  mode: Mode;
  onChange: (mode: Mode) => void;
};

export function PlannerModeToggle({ mode, onChange }: Props) {
  return (
    <div className="flex gap-3 justify-center mb-8">
      {(["ai", "guides"] as const).map((m) => {
        const Icon  = m === "ai" ? FaRobot : FaCompass;
        const label = m === "ai" ? "AI Planner" : "Local Guides";
        const desc  = m === "ai"
          ? "Personalized plan in seconds"
          : "Crafted by local experts";

        return (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            className={`flex-1 max-w-xs text-left p-5 rounded-2xl border-2 transition-all flex items-start gap-4 ${
              mode === m
                ? "border-primary bg-primary/5"
                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
              mode === m ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
            }`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className={`font-semibold text-sm ${mode === m ? "text-primary" : "text-gray-800"}`}>{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
