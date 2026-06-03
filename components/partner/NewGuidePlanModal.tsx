"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, Sparkles, LayoutGrid, ChevronDown, Plus, Minus } from "lucide-react";
import { createGuidePlan } from "@/lib/actions/guide-plan-editor";

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface Destination {
  id:   string;
  city: string;
  country: string;
}

interface Props {
  locale:       string;
  destinations: Destination[];
  /** Pre-select a destination (e.g. guide's own destination) */
  defaultDestinationId?: string;
  /** Pre-fill duration (e.g. from a custom request) */
  defaultDuration?: number;
  onClose: () => void;
}

type StartMode = "ai" | "blank";

const INTERESTS = [
  { id: "culture",         label: "Culture & History" },
  { id: "food_drink",      label: "Food & Drink" },
  { id: "adventures",      label: "Adventures" },
  { id: "water_sports",    label: "Water Sports" },
  { id: "nature_wildlife", label: "Nature" },
  { id: "sightseeing",     label: "Sightseeing" },
  { id: "shopping",        label: "Shopping" },
  { id: "wellness",        label: "Wellness" },
  { id: "family_friendly", label: "Family-friendly" },
];

/* ── Component ─────────────────────────────────────────────────────────────── */

export function NewGuidePlanModal({ locale, destinations, defaultDestinationId, defaultDuration, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [mode,            setMode]            = useState<StartMode>("ai");
  const [destinationId,   setDestinationId]   = useState(defaultDestinationId ?? destinations[0]?.id ?? "");
  const [duration,        setDuration]        = useState(defaultDuration ?? 3);
  const [title,           setTitle]           = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>(["culture", "food_drink"]);
  const [destOpen,        setDestOpen]        = useState(false);
  const destRef = useRef<HTMLDivElement>(null);

  // Close destination dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (destRef.current && !destRef.current.contains(e.target as Node)) {
        setDestOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const selectedDest = destinations.find((d) => d.id === destinationId);

  function toggleInterest(id: string) {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function handleCreate() {
    if (!destinationId) {
      toast.error("Please select a destination");
      return;
    }
    if (mode === "blank" && !title.trim()) {
      toast.error("Please enter a plan title");
      return;
    }

    startTransition(async () => {
      const result = await createGuidePlan({
        destinationId,
        duration,
        title: title.trim() || undefined,
        useAI: mode === "ai",
        interests: mode === "ai" ? selectedInterests : undefined,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(mode === "ai" ? "Plan generated! Customize it below." : "Blank plan created.");
      onClose();
      router.push(`/${locale}/planner/${result.planId}/edit`);
    });
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-semibold text-gray-900">Start a new plan</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Mode choice */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode("ai")}
              className={[
                "flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all",
                mode === "ai"
                  ? "border-primary bg-primary/5"
                  : "border-gray-100 hover:border-gray-200",
              ].join(" ")}
            >
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${mode === "ai" ? "bg-primary text-white" : "bg-gray-100 text-gray-500"}`}>
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className={`text-sm font-semibold ${mode === "ai" ? "text-primary" : "text-gray-700"}`}>
                  AI-generated
                </p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                  AI builds a starting point you customize
                </p>
              </div>
            </button>

            <button
              onClick={() => setMode("blank")}
              className={[
                "flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all",
                mode === "blank"
                  ? "border-primary bg-primary/5"
                  : "border-gray-100 hover:border-gray-200",
              ].join(" ")}
            >
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${mode === "blank" ? "bg-primary text-white" : "bg-gray-100 text-gray-500"}`}>
                <LayoutGrid className="h-4 w-4" />
              </div>
              <div>
                <p className={`text-sm font-semibold ${mode === "blank" ? "text-primary" : "text-gray-700"}`}>
                  Blank canvas
                </p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                  Build your route slot by slot
                </p>
              </div>
            </button>
          </div>

          {/* Destination */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Destination
            </label>
            <div ref={destRef} className="relative">
              <button
                type="button"
                onClick={() => setDestOpen((v) => !v)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 hover:border-gray-300 transition-colors bg-white"
              >
                <span>{selectedDest ? `${selectedDest.city}, ${selectedDest.country}` : "Select destination"}</span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${destOpen ? "rotate-180" : ""}`} />
              </button>
              {destOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-10 max-h-44 overflow-y-auto">
                  {destinations.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => { setDestinationId(d.id); setDestOpen(false); }}
                      className={`w-full text-left px-3.5 py-2.5 text-sm hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                        d.id === destinationId ? "text-primary font-medium bg-primary/5" : "text-gray-700"
                      }`}
                    >
                      {d.city}, {d.country}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Duration
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setDuration((v) => Math.max(1, v - 1))}
                className="h-9 w-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-600 disabled:opacity-40"
                disabled={duration <= 1}
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="text-lg font-bold text-gray-900 w-16 text-center">
                {duration} {duration === 1 ? "day" : "days"}
              </span>
              <button
                type="button"
                onClick={() => setDuration((v) => Math.min(14, v + 1))}
                className="h-9 w-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-600 disabled:opacity-40"
                disabled={duration >= 14}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Title (blank mode only) */}
          {mode === "blank" && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Plan title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`My ${duration}-day Djerba plan`}
                maxLength={100}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-colors"
              />
            </div>
          )}

          {/* Interests (AI mode only) */}
          {mode === "ai" && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Focus on <span className="text-gray-400 font-normal normal-case">(optional — shapes what the AI picks)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((i) => {
                  const active = selectedInterests.includes(i.id);
                  return (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => toggleInterest(i.id)}
                      className={[
                        "text-xs font-medium px-3 py-1.5 rounded-full border transition-all",
                        active
                          ? "bg-primary/10 text-primary border-primary/30"
                          : "bg-white text-gray-500 border-gray-200 hover:border-gray-300",
                      ].join(" ")}
                    >
                      {i.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isPending || !destinationId}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {mode === "ai" ? "Generating…" : "Creating…"}
              </>
            ) : (
              <>
                {mode === "ai" ? <Sparkles className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                {mode === "ai" ? "Generate plan" : "Create blank plan"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
