"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { adminUpdateActivityStatus, toggleActivityFeatured } from "@/lib/actions/admin";
import { FiCheck, FiSlash, FiStar } from "react-icons/fi";

type Status = "ACTIVE" | "SUSPENDED" | "DRAFT";

const STATUS_LABEL: Record<Status, string> = {
  ACTIVE:    "Active",
  SUSPENDED: "Suspended",
  DRAFT:     "Draft",
};

const STATUS_STYLE: Record<Status, string> = {
  ACTIVE:    "bg-green-50 text-green-700",
  SUSPENDED: "bg-orange-50 text-orange-700",
  DRAFT:     "bg-gray-100 text-gray-500",
};

interface Props {
  id: string;
  status: Status;
  featured: boolean;
}

export function ActivityStatusActions({ id, status: initialStatus, featured: initialFeatured }: Props) {
  const [status,   setStatus]   = useState<Status>(initialStatus);
  const [featured, setFeatured] = useState(initialFeatured);
  const [pending, start] = useTransition();

  async function handleStatus(next: Status) {
    if (next === status) return;
    const prev = status;
    setStatus(next);
    start(async () => {
      const res = await adminUpdateActivityStatus(id, next);
      if (!res.success) {
        setStatus(prev);
        toast.error("Failed to update status");
      } else {
        toast.success(`Activity ${STATUS_LABEL[next].toLowerCase()}`);
      }
    });
  }

  async function handleFeature() {
    const next = !featured;
    setFeatured(next);
    start(async () => {
      const res = await toggleActivityFeatured(id, next);
      if (!res.success) {
        setFeatured(!next);
        toast.error("Failed to update featured");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      {/* Status badge */}
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[status]}`}>
        {STATUS_LABEL[status]}
      </span>

      {/* Approve */}
      {status !== "ACTIVE" && (
        <button
          onClick={() => handleStatus("ACTIVE")}
          disabled={pending}
          title="Approve"
          className="h-7 w-7 flex items-center justify-center rounded-lg text-green-600 hover:bg-green-50 transition-colors disabled:opacity-40"
        >
          <FiCheck className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Suspend */}
      {status !== "SUSPENDED" && (
        <button
          onClick={() => handleStatus("SUSPENDED")}
          disabled={pending}
          title="Suspend"
          className="h-7 w-7 flex items-center justify-center rounded-lg text-orange-500 hover:bg-orange-50 transition-colors disabled:opacity-40"
        >
          <FiSlash className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Feature toggle */}
      <button
        onClick={handleFeature}
        disabled={pending}
        title={featured ? "Remove from home" : "Feature on home"}
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
