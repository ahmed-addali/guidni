"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FiCheck, FiSlash, FiStar } from "react-icons/fi";

type ListingStatus = "DRAFT" | "ACTIVE" | "SUSPENDED";

const STATUS_STYLE: Record<ListingStatus, string> = {
  DRAFT:     "bg-gray-100 text-gray-500",
  ACTIVE:    "bg-green-50 text-green-700",
  SUSPENDED: "bg-orange-50 text-orange-700",
};

interface Labels {
  approveLabel:       string;
  suspendLabel:       string;
  featureLabel:       string;
  unfeatureLabel:     string;
  activeLabel:        string;
  suspendedLabel:     string;
  draftLabel:         string;
  toastApproved:      string;
  toastSuspended:     string;
  toastDraft:         string;
  toastStatusFailed:  string;
  toastFeatureFailed: string;
}

interface Props {
  id:           string;
  status:       ListingStatus;
  featured:     boolean;
  labels:       Labels;
  onStatus:     (id: string, status: ListingStatus) => Promise<{ success: boolean }>;
  onFeature:    (id: string, featured: boolean)      => Promise<{ success: boolean }>;
}

export function TransportStatusActions({
  id,
  status: initialStatus,
  featured: initialFeatured,
  labels,
  onStatus,
  onFeature,
}: Props) {
  const [status,   setStatus]   = useState<ListingStatus>(initialStatus);
  const [featured, setFeatured] = useState(initialFeatured);
  const [pending, start] = useTransition();

  const STATUS_LABEL: Record<ListingStatus, string> = {
    DRAFT:     labels.draftLabel,
    ACTIVE:    labels.activeLabel,
    SUSPENDED: labels.suspendedLabel,
  };

  const TOAST_LABEL: Record<ListingStatus, string> = {
    DRAFT:     labels.toastDraft,
    ACTIVE:    labels.toastApproved,
    SUSPENDED: labels.toastSuspended,
  };

  function handleStatus(next: ListingStatus) {
    if (next === status) return;
    const prev = status;
    setStatus(next);
    start(async () => {
      const res = await onStatus(id, next);
      if (!res.success) {
        setStatus(prev);
        toast.error(labels.toastStatusFailed);
      } else {
        toast.success(TOAST_LABEL[next]);
      }
    });
  }

  function handleFeature() {
    const next = !featured;
    setFeatured(next);
    start(async () => {
      const res = await onFeature(id, next);
      if (!res.success) {
        setFeatured(!next);
        toast.error(labels.toastFeatureFailed);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[status]}`}>
        {STATUS_LABEL[status]}
      </span>

      {status !== "ACTIVE" && (
        <button
          onClick={() => handleStatus("ACTIVE")}
          disabled={pending}
          title={labels.approveLabel}
          className="h-7 w-7 flex items-center justify-center rounded-lg text-green-600 hover:bg-green-50 transition-colors disabled:opacity-40"
        >
          <FiCheck className="h-3.5 w-3.5" />
        </button>
      )}

      {status !== "SUSPENDED" && (
        <button
          onClick={() => handleStatus("SUSPENDED")}
          disabled={pending}
          title={labels.suspendLabel}
          className="h-7 w-7 flex items-center justify-center rounded-lg text-orange-500 hover:bg-orange-50 transition-colors disabled:opacity-40"
        >
          <FiSlash className="h-3.5 w-3.5" />
        </button>
      )}

      <button
        onClick={handleFeature}
        disabled={pending}
        title={featured ? labels.unfeatureLabel : labels.featureLabel}
        className={`h-7 w-7 flex items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${
          featured
            ? "text-yellow-500 hover:bg-yellow-50"
            : "text-gray-300 hover:bg-gray-50 hover:text-yellow-400"
        }`}
      >
        <FiStar className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
