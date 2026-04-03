"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { X, AlertTriangle, Pencil } from "lucide-react";
import { updateGuidniReviewStatus } from "@/lib/actions/admin-badges";
import type { GuidniReviewStatus } from "@prisma/client";

type Review = {
  id: string;
  relationType: string;
  relationId: string;
  status: GuidniReviewStatus;
  requestedBy: string | null;
  partnerOffer: string | null;
  createdAt: Date;
};

const STATUS_COLORS: Record<GuidniReviewStatus, string> = {
  PENDING:      "bg-yellow-50 text-yellow-700 border-yellow-200",
  SCHEDULED:    "bg-blue-50 text-blue-700 border-blue-200",
  UNDER_REVIEW: "bg-purple-50 text-purple-700 border-purple-200",
  PUBLISHED:    "bg-green-50 text-green-700 border-green-200",
  WITHDRAWN:    "bg-red-50 text-red-700 border-red-200",
};

const STATUS_ORDER: GuidniReviewStatus[] = [
  "PENDING",
  "SCHEDULED",
  "UNDER_REVIEW",
  "PUBLISHED",
  "WITHDRAWN",
];

// Describe what each transition does so the admin is aware of consequences
const STATUS_CONSEQUENCES: Record<GuidniReviewStatus, string> = {
  PENDING:      "Status will be reset to Pending.",
  SCHEDULED:    "Partner will know a reviewer has been assigned. No exact date or time is disclosed.",
  UNDER_REVIEW: "Marks the review as being drafted internally.",
  PUBLISHED:    "The review goes live on the listing page. The REVIEWED_BY_GUIDNI badge will be automatically awarded.",
  WITHDRAWN:    "The review will be hidden and the REVIEWED_BY_GUIDNI badge will be removed from the listing.",
};

interface Props {
  reviews: Review[];
}

type PendingChange = { reviewId: string; currentStatus: GuidniReviewStatus; newStatus: GuidniReviewStatus };

export function GuidniReviewsTable({ reviews }: Props) {
  const params = useParams();
  const locale = params.locale as string;
  const [, start] = useTransition();
  const [updating, setUpdating] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingChange | null>(null);

  function handleSelectChange(reviewId: string, currentStatus: GuidniReviewStatus, newStatus: GuidniReviewStatus) {
    if (newStatus === currentStatus) return;
    setPending({ reviewId, currentStatus, newStatus });
  }

  function handleConfirm() {
    if (!pending) return;
    const { reviewId, newStatus } = pending;
    setPending(null);
    setUpdating(reviewId);
    start(async () => {
      const res = await updateGuidniReviewStatus(reviewId, newStatus);
      if (res.success) {
        toast.success("Status updated");
      } else {
        toast.error("error" in res ? res.error : "Failed to update");
      }
      setUpdating(null);
    });
  }

  function handleCancel() {
    setPending(null);
  }

  if (reviews.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-gray-400">
        No Guidni review requests yet.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
              <th className="text-left px-6 py-3 font-medium">Type</th>
              <th className="text-left px-6 py-3 font-medium">Listing ID</th>
              <th className="text-left px-6 py-3 font-medium">Partner Offer</th>
              <th className="text-left px-6 py-3 font-medium">Status</th>
              <th className="text-left px-6 py-3 font-medium">Requested By</th>
              <th className="text-left px-6 py-3 font-medium">Created</th>
              <th className="text-left px-6 py-3 font-medium">Change Status</th>
              <th className="text-left px-6 py-3 font-medium">Review</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reviews.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3.5">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                    {r.relationType}
                  </span>
                </td>
                <td className="px-6 py-3.5 font-mono text-xs text-gray-500">
                  {r.relationId.slice(0, 8)}…
                </td>
                <td className="px-6 py-3.5 max-w-xs">
                  {r.partnerOffer ? (
                    <p className="text-xs text-gray-600 line-clamp-2 whitespace-pre-line" title={r.partnerOffer}>
                      {r.partnerOffer}
                    </p>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>
                <td className="px-6 py-3.5">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[r.status]}`}
                  >
                    {r.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-6 py-3.5 font-mono text-xs text-gray-400">
                  {r.requestedBy ? r.requestedBy.slice(0, 8) + "…" : "—"}
                </td>
                <td className="px-6 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                  {new Date(r.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-3.5">
                  <select
                    disabled={updating === r.id}
                    value={pending?.reviewId === r.id ? pending.newStatus : r.status}
                    onChange={(e) =>
                      handleSelectChange(r.id, r.status, e.target.value as GuidniReviewStatus)
                    }
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    {STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-3.5">
                  <Link
                    href={`/${locale}/admin/badges/reviews/${r.id}`}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition-colors font-medium whitespace-nowrap"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {r.status === "PUBLISHED" ? "Edit review" : "Write review"}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirmation modal */}
      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleCancel}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Confirm status change</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    This action will be applied immediately.
                  </p>
                </div>
              </div>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Change summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_COLORS[pending.currentStatus]}`}>
                  {pending.currentStatus.replace(/_/g, " ")}
                </span>
                <span className="text-gray-400 text-xs">→</span>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_COLORS[pending.newStatus]}`}>
                  {pending.newStatus.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">
                {STATUS_CONSEQUENCES[pending.newStatus]}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className={`px-5 py-2 text-sm font-medium rounded-xl text-white transition-colors ${
                  pending.newStatus === "WITHDRAWN"
                    ? "bg-red-600 hover:bg-red-700"
                    : pending.newStatus === "PUBLISHED"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-primary hover:bg-primary/90"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
