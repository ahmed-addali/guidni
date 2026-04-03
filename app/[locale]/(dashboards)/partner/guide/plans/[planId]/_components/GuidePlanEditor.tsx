"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  updateGuidePlanMeta,
  publishGuidePlan,
  unpublishGuidePlan,
} from "@/lib/actions/partner-guides";

const TAGS = ["culture", "food", "beach", "adventure", "family", "nature", "wellness", "city", "history", "shopping"];
const DIFFICULTY = ["easy", "moderate", "active"] as const;
const SUITABLE_FOR = ["solo", "couple", "family", "friends"] as const;
const SEASONS = ["Any", "Spring", "Summer", "Autumn", "Winter"] as const;

type Plan = {
  id: string;
  title: string | null;
  duration: number;
  planType: string;
  isPublic: boolean;
  price: number | null;
  summary: string | null;
  tags: string[];
  difficulty: string | null;
  suitableFor: string[];
  season: string | null;
  previewDays: number | null;
  itinerary: unknown;
  destination?: { city: string; slug: string } | null;
};

type Props = { plan: Plan; locale: string };

export function GuidePlanEditor({ plan, locale }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [meta, setMeta] = useState({
    title:       plan.title        ?? "",
    summary:     plan.summary      ?? "",
    tags:        plan.tags         ?? [] as string[],
    difficulty:  plan.difficulty   ?? "",
    suitableFor: plan.suitableFor  ?? [] as string[],
    season:      plan.season       ?? "",
    previewDays: plan.previewDays  ?? 1,
  });

  function toggleTag(t: string) {
    setMeta((prev) => ({
      ...prev,
      tags: prev.tags.includes(t) ? prev.tags.filter((x) => x !== t) : [...prev.tags, t],
    }));
  }

  function toggleSuitable(s: string) {
    setMeta((prev) => ({
      ...prev,
      suitableFor: prev.suitableFor.includes(s)
        ? prev.suitableFor.filter((x) => x !== s)
        : [...prev.suitableFor, s],
    }));
  }

  const saveMeta = () => {
    startTransition(async () => {
      const result = await updateGuidePlanMeta(plan.id, {
        title:       meta.title       || undefined,
        summary:     meta.summary     || undefined,
        tags:        meta.tags,
        difficulty:  meta.difficulty  || undefined,
        suitableFor: meta.suitableFor,
        season:      meta.season      || undefined,
        previewDays: meta.previewDays,
      });
      if (result.success) toast.success("Plan details saved");
      else toast.error("error" in result ? result.error : "Save failed");
    });
  };

  const handlePublish = () => {
    if (!meta.summary || meta.summary.length < 50) {
      toast.error("Summary must be at least 50 characters");
      return;
    }
    if (meta.tags.length === 0) {
      toast.error("Add at least one tag");
      return;
    }
    if (meta.suitableFor.length === 0) {
      toast.error("Select who this plan is for");
      return;
    }

    startTransition(async () => {
      const result = await publishGuidePlan(plan.id, {
        planType:    "GUIDE_FREE",
        summary:     meta.summary,
        tags:        meta.tags,
        difficulty:  meta.difficulty as "easy" | "moderate" | "active" | undefined,
        suitableFor: meta.suitableFor,
        season:      meta.season || undefined,
        previewDays: meta.previewDays,
        price:       0,
      });
      if (result.success) {
        toast.success("Plan published!");
        router.refresh();
      } else {
        toast.error("error" in result ? result.error : "Publish failed");
      }
    });
  };

  const handleUnpublish = () => {
    startTransition(async () => {
      const result = await unpublishGuidePlan(plan.id);
      if (result.success) {
        toast.success("Plan unpublished");
        router.refresh();
      } else {
        toast.error("error" in result ? result.error : "Unpublish failed");
      }
    });
  };

  const itinerary = plan.itinerary as Array<{
    dayNumber: number;
    theme?: string;
    notes?: string;
    slots?: Array<{
      id: string;
      slotType: string;
      item?: { name: string; type?: string };
    }>;
  }> | null;

  return (
    <Tabs defaultValue="details">
      <TabsList className="mb-6">
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
        <TabsTrigger value="publish">Publish</TabsTrigger>
      </TabsList>

      {/* ── Details tab ─────────────────────────────────────── */}
      <TabsContent value="details" className="space-y-5">
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">Plan details</h2>

          <div className="space-y-1.5">
            <Label htmlFor="title">Plan title</Label>
            <Input
              id="title"
              value={meta.title}
              onChange={(e) => setMeta((p) => ({ ...p, title: e.target.value }))}
              placeholder={`${plan.duration}-Day ${plan.destination?.city ?? ""} Trip`}
              maxLength={120}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="summary">
              Summary <span className="text-gray-400 font-normal text-xs">(min 50 chars — shown in marketplace)</span>
            </Label>
            <Textarea
              id="summary"
              value={meta.summary}
              onChange={(e) => setMeta((p) => ({ ...p, summary: e.target.value }))}
              placeholder="Describe what makes this plan special — what travelers will experience, why they should follow it..."
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-gray-400">{meta.summary.length}/1000</p>
          </div>

          <div>
            <Label className="mb-2 block">Tags</Label>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
                    meta.tags.includes(t)
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="mb-2 block">Difficulty</Label>
              <div className="flex gap-2">
                {DIFFICULTY.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setMeta((p) => ({ ...p, difficulty: p.difficulty === d ? "" : d }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
                      meta.difficulty === d
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Season</Label>
              <select
                value={meta.season}
                onChange={(e) => setMeta((p) => ({ ...p, season: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="">Any season</option>
                {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <Label htmlFor="previewDays" className="mb-2 block">Free preview days</Label>
              <select
                id="previewDays"
                value={meta.previewDays}
                onChange={(e) => setMeta((p) => ({ ...p, previewDays: parseInt(e.target.value) }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value={1}>Day 1 only</option>
                <option value={2}>Days 1–2</option>
                <option value={3}>Days 1–3</option>
              </select>
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Suitable for</Label>
            <div className="flex flex-wrap gap-2">
              {SUITABLE_FOR.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSuitable(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
                    meta.suitableFor.includes(s)
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={saveMeta} disabled={isPending}>
            {isPending ? "Saving…" : "Save details"}
          </Button>
        </div>
      </TabsContent>

      {/* ── Itinerary tab ────────────────────────────────────── */}
      <TabsContent value="itinerary" className="space-y-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-3 mb-4">Itinerary overview</h2>
          <p className="text-sm text-gray-400 mb-5">
            View the plan structure. To edit the itinerary content, open the full plan view.
          </p>

          {!itinerary || itinerary.length === 0 ? (
            <p className="text-sm text-gray-400">No itinerary data yet. Generate or build a plan first.</p>
          ) : (
            <div className="space-y-4">
              {itinerary.map((day) => (
                <div key={day.dayNumber} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      Day {day.dayNumber}
                    </span>
                    {day.theme && <span className="text-sm font-medium text-gray-700">{day.theme}</span>}
                  </div>
                  {day.notes && <p className="text-xs text-gray-400 mb-2 italic">{day.notes}</p>}
                  {day.slots && day.slots.length > 0 && (
                    <div className="space-y-1">
                      {day.slots.map((slot) => (
                        <div key={slot.id} className="flex items-center gap-2 text-xs text-gray-600">
                          <span className="w-20 text-gray-400 capitalize">{slot.slotType}</span>
                          <span>{slot.item?.name ?? "—"}</span>
                          {slot.item?.type && (
                            <span className="text-gray-400">({slot.item.type})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 pt-5 border-t border-gray-100">
            <a
              href={`/${locale}/planner/${plan.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              Open full plan view →
            </a>
          </div>
        </div>
      </TabsContent>

      {/* ── Publish tab ──────────────────────────────────────── */}
      <TabsContent value="publish" className="space-y-5">
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">Publish settings</h2>

          {/* Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-gray-800">Publication status</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {plan.isPublic ? "This plan is visible in the marketplace" : "This plan is not yet public"}
              </p>
            </div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
              plan.isPublic ? "bg-green-50 text-green-700" : "bg-gray-200 text-gray-600"
            }`}>
              {plan.isPublic ? "Published" : "Draft"}
            </span>
          </div>

          {/* Pre-publish checklist */}
          <div>
            <p className="text-sm font-medium text-gray-800 mb-3">Checklist before publishing</p>
            <ul className="space-y-2">
              {[
                { label: "Summary written (50+ chars)", done: (meta.summary?.length ?? 0) >= 50 },
                { label: "At least one tag added", done: meta.tags.length > 0 },
                { label: "Suitable for selected", done: meta.suitableFor.length > 0 },
                { label: "Itinerary has content", done: Array.isArray(itinerary) && itinerary.length > 0 },
              ].map((item) => (
                <li key={item.label} className="flex items-center gap-2 text-sm">
                  <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    item.done ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                  }`}>
                    {item.done ? "✓" : "—"}
                  </span>
                  <span className={item.done ? "text-gray-700" : "text-gray-400"}>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-3">
            {plan.isPublic ? (
              <Button
                variant="outline"
                onClick={handleUnpublish}
                disabled={isPending}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                {isPending ? "Working…" : "Unpublish plan"}
              </Button>
            ) : (
              <Button onClick={handlePublish} disabled={isPending}>
                {isPending ? "Publishing…" : "Publish as free plan"}
              </Button>
            )}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
