"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Plus, ExternalLink } from "lucide-react";
import {
  createOrUpdateGuidniReview,
  updateGuidniReviewStatus,
  addGuidniReviewImage,
  removeGuidniReviewImage,
} from "@/lib/actions/admin-badges";
import type { GuidniReviewStatus } from "@prisma/client";

type ReviewData = {
  id: string;
  relationType: string;
  relationId: string;
  status: GuidniReviewStatus;
  reviewerName: string | null;
  reviewerTitle: string | null;
  visitedAt: Date | null;
  season: string | null;
  summaryQuote: string | null;
  fullReview: string | null;
  whatWeLoved: string | null;
  worthKnowing: string | null;
  bestFor: string | null;
  scoreAccuracy: number | null;
  scoreQuality: number | null;
  scoreValue: number | null;
  scorePresent: number | null;
  scoreHost: number | null;
  scoreTotal: number | null;
  tiktokUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  images: { id: string; url: string; alt: string }[];
};

interface Props {
  review: ReviewData;
  locale: string;
}

function ScoreInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const num = parseFloat(value);
  const pct = isNaN(num) ? 0 : Math.min(100, Math.max(0, num * 10));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm font-bold text-gray-900 w-10 text-right">
          {value || "—"}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          type="number"
          min={0}
          max={10}
          step={0.5}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
    </div>
  );
}

export function ReviewEditorForm({ review, locale }: Props) {
  const router = useRouter();
  const [, start] = useTransition();
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [addingImage, setAddingImage] = useState(false);
  const [removingImage, setRemovingImage] = useState<string | null>(null);
  const [images, setImages] = useState(review.images);

  // Form state
  const [reviewerName, setReviewerName]   = useState(review.reviewerName ?? "");
  const [reviewerTitle, setReviewerTitle] = useState(review.reviewerTitle ?? "");
  const [visitedAt, setVisitedAt]         = useState(
    review.visitedAt ? new Date(review.visitedAt).toISOString().split("T")[0] : ""
  );
  const [season, setSeason]               = useState(review.season ?? "");
  const [summaryQuote, setSummaryQuote]   = useState(review.summaryQuote ?? "");
  const [fullReview, setFullReview]       = useState(review.fullReview ?? "");
  const [whatWeLoved, setWhatWeLoved]     = useState(review.whatWeLoved ?? "");
  const [worthKnowing, setWorthKnowing]   = useState(review.worthKnowing ?? "");
  const [bestFor, setBestFor]             = useState(review.bestFor ?? "");
  const [scoreAccuracy, setScoreAccuracy] = useState(review.scoreAccuracy != null ? String(review.scoreAccuracy / 10) : "");
  const [scoreQuality, setScoreQuality]   = useState(review.scoreQuality != null ? String(review.scoreQuality / 10) : "");
  const [scoreValue, setScoreValue]       = useState(review.scoreValue != null ? String(review.scoreValue / 10) : "");
  const [scorePresent, setScorePresent]   = useState(review.scorePresent != null ? String(review.scorePresent / 10) : "");
  const [scoreHost, setScoreHost]         = useState(review.scoreHost != null ? String(review.scoreHost / 10) : "");
  const [tiktokUrl, setTiktokUrl]         = useState(review.tiktokUrl ?? "");
  const [instagramUrl, setInstagramUrl]   = useState(review.instagramUrl ?? "");
  const [facebookUrl, setFacebookUrl]     = useState(review.facebookUrl ?? "");

  function buildPayload() {
    const toInt = (v: string) => {
      const n = parseFloat(v);
      return isNaN(n) ? undefined : Math.round(n * 10);
    };
    return {
      reviewerName:  reviewerName  || undefined,
      reviewerTitle: reviewerTitle || undefined,
      visitedAt:     visitedAt ? new Date(visitedAt) : undefined,
      season:        season        || undefined,
      summaryQuote:  summaryQuote  || undefined,
      fullReview:    fullReview    || undefined,
      whatWeLoved:   whatWeLoved   || undefined,
      worthKnowing:  worthKnowing  || undefined,
      bestFor:       bestFor       || undefined,
      scoreAccuracy: toInt(scoreAccuracy),
      scoreQuality:  toInt(scoreQuality),
      scoreValue:    toInt(scoreValue),
      scorePresent:  toInt(scorePresent),
      scoreHost:     toInt(scoreHost),
      tiktokUrl:     tiktokUrl    || undefined,
      instagramUrl:  instagramUrl || undefined,
      facebookUrl:   facebookUrl  || undefined,
    };
  }

  function handleSave() {
    setSaving(true);
    start(async () => {
      const res = await createOrUpdateGuidniReview(
        review.relationId,
        review.relationType as never,
        buildPayload()
      );
      if (res.success) {
        toast.success("Review saved");
      } else {
        toast.error("error" in res ? res.error : "Failed to save");
      }
      setSaving(false);
    });
  }

  function handlePublish() {
    setPublishing(true);
    start(async () => {
      // Save content first, then publish
      const saveRes = await createOrUpdateGuidniReview(
        review.relationId,
        review.relationType as never,
        buildPayload()
      );
      if (!saveRes.success) {
        toast.error("error" in saveRes ? saveRes.error : "Failed to save before publishing");
        setPublishing(false);
        return;
      }
      const pubRes = await updateGuidniReviewStatus(review.id, "PUBLISHED");
      if (pubRes.success) {
        toast.success("Review published! Badge awarded to the listing.");
        router.push(`/${locale}/admin/badges`);
      } else {
        toast.error("error" in pubRes ? pubRes.error : "Failed to publish");
      }
      setPublishing(false);
    });
  }

  function handleAddImage() {
    if (!newImageUrl.trim()) return;
    setAddingImage(true);
    start(async () => {
      const res = await addGuidniReviewImage(review.id, newImageUrl.trim());
      if (res.success) {
        setImages((prev) => [...prev, { id: Date.now().toString(), url: newImageUrl.trim(), alt: "" }]);
        setNewImageUrl("");
        toast.success("Image added");
      } else {
        toast.error("Failed to add image");
      }
      setAddingImage(false);
    });
  }

  function handleRemoveImage(imageId: string) {
    setRemovingImage(imageId);
    start(async () => {
      const res = await removeGuidniReviewImage(imageId);
      if (res.success) {
        setImages((prev) => prev.filter((img) => img.id !== imageId));
        toast.success("Image removed");
      } else {
        toast.error("Failed to remove image");
      }
      setRemovingImage(null);
    });
  }

  const isPublished = review.status === "PUBLISHED";

  return (
    <div className="space-y-6">
      {/* ── Reviewer Info ─────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">Reviewer Info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer name</label>
            <input
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              placeholder="Sofia"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer title</label>
            <input
              value={reviewerTitle}
              onChange={(e) => setReviewerTitle(e.target.value)}
              placeholder="Guidni Travel Editor"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visit date</label>
            <input
              type="date"
              value={visitedAt}
              onChange={(e) => setVisitedAt(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Season label</label>
            <input
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              placeholder="Spring 2026"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>

      {/* ── Editorial Content ──────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">Editorial Content</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Summary quote <span className="text-gray-400 font-normal">(pull-quote shown prominently)</span>
          </label>
          <textarea
            value={summaryQuote}
            onChange={(e) => setSummaryQuote(e.target.value)}
            rows={2}
            placeholder="A rare authentic experience that lives up to every promise…"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full review <span className="text-gray-400 font-normal">(3–5 paragraphs)</span>
          </label>
          <textarea
            value={fullReview}
            onChange={(e) => setFullReview(e.target.value)}
            rows={8}
            placeholder="Write the editorial review here…"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What we loved <span className="text-gray-400 font-normal">(one item per line)</span>
            </label>
            <textarea
              value={whatWeLoved}
              onChange={(e) => setWhatWeLoved(e.target.value)}
              rows={4}
              placeholder={"Exceptional hospitality\nFresh seasonal ingredients\nBreathtaking sea view"}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Worth knowing <span className="text-gray-400 font-normal">(honest notes, one per line)</span>
            </label>
            <textarea
              value={worthKnowing}
              onChange={(e) => setWorthKnowing(e.target.value)}
              rows={4}
              placeholder={"Cash only — no card payments\nBook at least 2 days in advance"}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Best for <span className="text-gray-400 font-normal">(comma-separated)</span>
          </label>
          <input
            value={bestFor}
            onChange={(e) => setBestFor(e.target.value)}
            placeholder="Couples, culture lovers, foodies"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* ── Scores ────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">
          Scores
          <span className="ml-2 text-xs text-gray-400 font-normal">0 – 10</span>
        </h2>
        <div className="space-y-4">
          <ScoreInput label="Accuracy to description" value={scoreAccuracy} onChange={setScoreAccuracy} />
          <ScoreInput label="Quality of experience"   value={scoreQuality}  onChange={setScoreQuality} />
          <ScoreInput label="Value for money"         value={scoreValue}    onChange={setScoreValue} />
          <ScoreInput label="Cleanliness / Presentation" value={scorePresent} onChange={setScorePresent} />
          <ScoreInput label="Host / Guide attitude"   value={scoreHost}     onChange={setScoreHost} />
        </div>
      </div>

      {/* ── Images ────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">Review Photos</h2>

        {/* Existing images */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((img) => (
              <div key={img.id} className="relative group rounded-xl overflow-hidden h-32 bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.alt || ""} className="w-full h-full object-cover" />
                <button
                  disabled={removingImage === img.id}
                  onClick={() => handleRemoveImage(img.id)}
                  className="absolute top-1.5 right-1.5 h-7 w-7 bg-red-600 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add image */}
        <div className="flex gap-2">
          <input
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            placeholder="Paste image URL…"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddImage(); } }}
          />
          <button
            disabled={addingImage || !newImageUrl.trim()}
            onClick={handleAddImage}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
        <p className="text-xs text-gray-400">
          These photos are owned by Guidni and will be displayed in the review section on the listing page.
        </p>
      </div>

      {/* ── Social Links ──────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">Social Media Links</h2>
        <p className="text-xs text-gray-400">
          Paste links to the published TikTok video, Instagram post, and Facebook post for this review.
          These will be shown to the partner on their Badges page.
        </p>
        <div className="space-y-3">
          {[
            { label: "TikTok video URL",    value: tiktokUrl,    setter: setTiktokUrl,    placeholder: "https://www.tiktok.com/@guidni/video/…" },
            { label: "Instagram post URL",  value: instagramUrl, setter: setInstagramUrl, placeholder: "https://www.instagram.com/p/…" },
            { label: "Facebook post URL",   value: facebookUrl,  setter: setFacebookUrl,  placeholder: "https://www.facebook.com/guidni/posts/…" },
          ].map(({ label, value, setter, placeholder }) => (
            <div key={label}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                {value && (
                  <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center h-10 w-10 border border-gray-200 rounded-xl text-gray-400 hover:text-primary hover:border-primary/30 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Actions ───────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 bg-white border border-gray-100 rounded-2xl px-6 py-4">
        <p className="text-xs text-gray-400">
          {isPublished
            ? "This review is live. Saving will update the published content."
            : "Save your progress anytime. Publish when the review is ready to go live."}
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <button
            disabled={saving}
            onClick={handleSave}
            className="px-5 py-2.5 text-sm font-medium border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save draft"}
          </button>
          {!isPublished && (
            <button
              disabled={publishing}
              onClick={handlePublish}
              className="px-5 py-2.5 text-sm font-medium bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {publishing ? "Publishing…" : "Publish review"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
