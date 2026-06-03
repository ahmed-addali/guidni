"use client";

import { useState, useTransition, useMemo } from "react";
import { toast } from "sonner";
import { updatePlanDetails } from "@/lib/actions/guide-plan-editor";

interface InitialData {
  title:       string | null;
  summary:     string | null;
  tags:        string[];
  difficulty:  string | null;
  suitableFor: string[];
  season:      string[];
}

interface Props {
  planId:      string;
  initialData: InitialData;
}

const DIFFICULTIES = ["Easy", "Moderate", "Challenging"];
const SUITABLE_FOR = ["Solo", "Couples", "Families", "Groups", "Senior-friendly"];
const SEASONS      = ["Spring", "Summer", "Autumn", "Winter", "Year-round"];

function TagsInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState("");

  function add() {
    const t = input.trim().toLowerCase();
    if (t && !value.includes(t) && value.length < 10) {
      onChange([...value, t]);
    }
    setInput("");
  }

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 bg-primary/8 text-primary rounded-full"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(value.filter((t) => t !== tag))}
                className="ml-0.5 hover:text-primary/60 transition-colors"
                aria-label={`Remove ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="e.g. beach, culture, family…"
          maxLength={30}
          className="flex-1 px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-colors"
        />
        <button
          type="button"
          onClick={add}
          disabled={!input.trim() || value.length >= 10}
          className="px-4 py-2.5 text-sm font-medium bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-40"
        >
          Add
        </button>
      </div>
      <p className="text-xs text-gray-400">{value.length}/10 tags</p>
    </div>
  );
}

function ChipGroup({
  options,
  value,
  multi,
  onChange,
}: {
  options:  string[];
  value:    string | string[];
  multi:    boolean;
  onChange: (v: string | string[]) => void;
}) {
  function toggle(opt: string) {
    if (multi) {
      const arr = value as string[];
      onChange(arr.includes(opt) ? arr.filter((x) => x !== opt) : [...arr, opt]);
    } else {
      onChange((value as string) === opt ? "" : opt);
    }
  }

  const isActive = (opt: string) =>
    multi ? (value as string[]).includes(opt) : value === opt;

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={[
            "text-sm font-medium px-4 py-2 rounded-full border transition-all",
            isActive(opt)
              ? "bg-primary/8 text-primary border-primary/30"
              : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700",
          ].join(" ")}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
      <div>
        <h2 className="font-semibold text-gray-900">{title}</h2>
        {description && (
          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

export function GuidePlanDetailsTab({ planId, initialData }: Props) {
  const [form, setForm]   = useState<InitialData>({ ...initialData });
  const [initial]         = useState<InitialData>({ ...initialData });
  const [isPending, startTransition] = useTransition();

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initial),
    [form, initial]
  );

  function handleSave() {
    startTransition(async () => {
      const res = await updatePlanDetails(planId, {
        summary:     form.summary ?? undefined,
        tags:        form.tags,
        difficulty:  form.difficulty ?? undefined,
        suitableFor: form.suitableFor,
        season:      form.season,
      });
      if (!res.success) { toast.error(res.error); return; }
      toast.success("Details saved");
    });
  }

  return (
    <div className="max-w-2xl space-y-4">

      {/* Unsaved changes banner */}
      {isDirty && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl">
          <p className="text-sm text-amber-800">You have unsaved changes</p>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="px-4 py-1.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      )}

      {/* Summary */}
      <SectionCard
        title="Summary"
        description="A short description shown on the plan's public page. Tell travelers what makes this plan special."
      >
        <textarea
          value={form.summary ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
          rows={4}
          maxLength={1000}
          placeholder="A well-paced 3-day introduction to the medina, local markets, and coastal views…"
          className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-colors resize-none"
        />
        <p className="text-xs text-gray-400 text-right">{(form.summary ?? "").length}/1000</p>
      </SectionCard>

      {/* Tags */}
      <SectionCard
        title="Tags"
        description="Help travelers discover your plan through search and filters. Add up to 10 keywords."
      >
        <TagsInput
          value={form.tags}
          onChange={(tags) => setForm((f) => ({ ...f, tags }))}
        />
      </SectionCard>

      {/* Difficulty */}
      <SectionCard
        title="Difficulty"
        description="How physically demanding is this itinerary? Easy = mostly leisure, Challenging = hiking, long walks, etc."
      >
        <ChipGroup
          options={DIFFICULTIES}
          value={form.difficulty ?? ""}
          multi={false}
          onChange={(v) => setForm((f) => ({ ...f, difficulty: (v as string) || null }))}
        />
      </SectionCard>

      {/* Suitable for */}
      <SectionCard
        title="Suitable for"
        description="Who is this plan best for? Select all that apply."
      >
        <ChipGroup
          options={SUITABLE_FOR}
          value={form.suitableFor}
          multi
          onChange={(v) => setForm((f) => ({ ...f, suitableFor: v as string[] }))}
        />
      </SectionCard>

      {/* Season */}
      <SectionCard
        title="Best season"
        description="When is this plan most enjoyable? Select all that apply."
      >
        <ChipGroup
          options={SEASONS}
          value={form.season}
          multi
          onChange={(v) => setForm((f) => ({ ...f, season: v as string[] }))}
        />
      </SectionCard>

      {/* Save footer */}
      {isDirty && (
        <button
          onClick={handleSave}
          disabled={isPending}
          className="w-full py-3 bg-primary text-white font-semibold text-sm rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
      )}
    </div>
  );
}
