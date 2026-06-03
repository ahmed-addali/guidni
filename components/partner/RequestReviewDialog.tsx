"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { BookOpen, X } from "lucide-react";
import { requestGuidniReview } from "@/lib/actions/partner-badges";

type RelationType = Parameters<typeof requestGuidniReview>[1];

interface Props {
  listingId:    string;
  relationType: RelationType;
  offerHint:    string; // placeholder text describing the expected offer for this listing type
}

export function RequestReviewDialog({ listingId, relationType, offerHint }: Props) {
  const [open, setOpen]         = useState(false);
  const [, start]               = useTransition();
  const [bestTimes, setBestTimes]     = useState("");
  const [highlight, setHighlight]     = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [offer, setOffer]             = useState("");
  const [submitting, setSubmitting]   = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!offer.trim()) {
      toast.error("Please describe your offer for the Guidni reviewer.");
      return;
    }
    setSubmitting(true);
    const fullOffer = [
      offer.trim(),
      bestTimes  ? `Best times: ${bestTimes.trim()}` : "",
      highlight  ? `Highlight: ${highlight.trim()}`  : "",
      contactName  ? `Contact: ${contactName.trim()}` : "",
      contactPhone ? `Phone: ${contactPhone.trim()}`  : "",
    ].filter(Boolean).join("\n");

    start(async () => {
      const res = await requestGuidniReview(listingId, relationType, fullOffer);
      if (res.success) {
        toast.success("Review requested! Our team will be in touch.");
        setOpen(false);
        setBestTimes(""); setHighlight(""); setContactName(""); setContactPhone(""); setOffer("");
      } else {
        toast.error("error" in res ? res.error : "Failed to request review");
      }
      setSubmitting(false);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Request Guidni Review"
        className="flex items-center gap-1 text-xs px-3 py-1.5 border border-primary/20 rounded-lg text-primary hover:bg-primary/5 transition-colors"
      >
        <BookOpen className="h-3.5 w-3.5" />
        <span className="hidden md:inline">Request Review</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Request a Guidni Review
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Our team will visit your listing and publish an editorial review. The review is always honest.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors shrink-0 ml-4"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Offer — required */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your offer for the reviewer <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={offer}
                  onChange={(e) => setOffer(e.target.value)}
                  placeholder={offerHint}
                  rows={3}
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  This is shared only with our ops team — never published or shown to users.
                </p>
              </div>

              {/* Best times */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Best times to visit
                </label>
                <input
                  type="text"
                  value={bestTimes}
                  onChange={(e) => setBestTimes(e.target.value)}
                  placeholder="e.g. weekday evenings, lunch service Fri–Sun"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

              {/* What to highlight */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What should we highlight?
                </label>
                <input
                  type="text"
                  value={highlight}
                  onChange={(e) => setHighlight(e.target.value)}
                  placeholder="e.g. our new summer menu, renovated sea-view rooms"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

              {/* Contact */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact name
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Ahmed"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Direct phone
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+216 XX XXX XXX"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>

              {/* Info box */}
              <div className="bg-primary/5 rounded-xl p-4 text-xs text-gray-600 space-y-1">
                <p className="font-medium text-gray-800">What happens next?</p>
                <p>Our team reviews all requests weekly and prioritises based on platform needs.</p>
                <p>If selected, a Guidni reviewer will visit unannounced within your declared availability window.</p>
                <p>The review will be published on your listing page <strong>and</strong> shared on our Instagram, Facebook, and TikTok.</p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {submitting ? "Submitting…" : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
