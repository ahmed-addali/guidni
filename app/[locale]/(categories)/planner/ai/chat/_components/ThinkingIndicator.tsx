"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Brain, Wrench } from "lucide-react";
import type { ThinkingStep } from "@/types/chat";

type Props = {
  steps: ThinkingStep[];
  isThinking: boolean;
};

export function ThinkingIndicator({ steps, isThinking }: Props) {
  const [open, setOpen] = useState(false);

  if (isThinking) {
    return (
      <div className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 rounded-xl">
        <div className="relative flex items-center justify-center h-5 w-5">
          <Brain className="h-4 w-4 text-violet-500" />
          <span className="absolute inset-0 rounded-full border-2 border-violet-300 border-t-violet-600 animate-spin" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-violet-700">Thinking…</p>
          <div className="flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    );
  }

  if (steps.length === 0) return null;

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center gap-1.5 font-medium">
          <Brain className="h-3 w-3 text-violet-500" />
          {steps.length} reasoning step{steps.length !== 1 ? "s" : ""}
        </span>
        {open ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </button>

      {open && (
        <div className="border-t border-gray-100 px-3 py-2 space-y-2 bg-gray-50/50">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="h-4 w-4 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                {i + 1}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-700 leading-relaxed">
                  {step.step}
                </p>
                {step.tool_used && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                    <Wrench className="h-2.5 w-2.5" />
                    {step.tool_used}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
