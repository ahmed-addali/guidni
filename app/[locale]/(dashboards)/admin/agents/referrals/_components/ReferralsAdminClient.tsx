"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  markReferralUnderReview,
  approveReferral,
  rejectReferral,
} from "@/lib/actions/admin-agents";

type Referral = {
  id:               string;
  status:           string;
  partnerName:      string;
  partnerEmail:     string | null;
  partnerPhone:     string | null;
  partnerType:      string | null;
  partnerCity:      string | null;
  agentNote:        string | null;
  pointsAwarded:    number;
  createdAt:        Date;
  businessProfile:  { name: string } | null;
  agent: {
    id:          string;
    displayName: string;
    pseudonym:   string | null;
    user:        { email: string };
  };
};

interface Props {
  initialReferrals: Referral[];
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING:      { label: "Pending",      className: "bg-yellow-50 text-yellow-700 border-yellow-100" },
  UNDER_REVIEW: { label: "Under Review", className: "bg-blue-50 text-blue-700 border-blue-100" },
  VERIFIED:     { label: "Verified",     className: "bg-green-50 text-green-700 border-green-100" },
  REJECTED:     { label: "Rejected",     className: "bg-red-50 text-red-600 border-red-100" },
};

export function ReferralsAdminClient({ initialReferrals }: Props) {
  const [referrals, setReferrals] = useState(initialReferrals);
  const [filter, setFilter]       = useState<"ALL" | "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED">("PENDING");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const displayed = filter === "ALL" ? referrals : referrals.filter((r) => r.status === filter);

  function updateStatus(id: string, status: string) {
    setReferrals((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
  }

  async function handleUnderReview(id: string) {
    setPendingId(id);
    const res = await markReferralUnderReview(id);
    if (res.success) {
      updateStatus(id, "UNDER_REVIEW");
      toast.success("Marked as under review.");
    } else {
      toast.error(res.error);
    }
    setPendingId(null);
  }

  async function handleApprove(id: string) {
    setPendingId(id);
    const res = await approveReferral(id);
    if (res.success) {
      updateStatus(id, "VERIFIED");
      toast.success("Referral approved. Agent awarded +25 pts.");
    } else {
      toast.error(res.error);
    }
    setPendingId(null);
  }

  async function handleReject(id: string) {
    setPendingId(id);
    const res = await rejectReferral(id);
    if (res.success) {
      updateStatus(id, "REJECTED");
      toast.success("Referral rejected.");
    } else {
      toast.error(res.error);
    }
    setPendingId(null);
  }

  return (
    <div className="space-y-5">
      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
        {(["ALL", "PENDING", "UNDER_REVIEW", "VERIFIED", "REJECTED"] as const).map((f) => {
          const count = f === "ALL" ? referrals.length : referrals.filter((r) => r.status === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f.replace("_", " ")} ({count})
            </button>
          );
        })}
      </div>

      {displayed.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl py-16 text-center">
          <p className="text-gray-400 text-sm">No referrals in this status.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="divide-y divide-gray-50">
            {displayed.map((r) => {
              const sc = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.PENDING;
              const agentName = r.agent.pseudonym ? `@${r.agent.pseudonym}` : r.agent.displayName;

              return (
                <div key={r.id} className="px-5 py-5 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-gray-900">
                        {r.businessProfile?.name ?? r.partnerName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {r.partnerType?.replace("_", " ") ?? ""}
                        {r.partnerCity ? ` · ${r.partnerCity}` : ""}
                        {" · "}Referred by{" "}
                        <span className="font-medium text-gray-700">{agentName}</span>
                      </p>
                      <p className="text-xs text-gray-400">{r.agent.user.email}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${sc.className}`}>
                      {sc.label}
                    </span>
                  </div>

                  {/* Contact */}
                  <div className="flex gap-4 text-xs text-gray-500">
                    {r.partnerPhone && <span>📞 {r.partnerPhone}</span>}
                    {r.partnerEmail && <span>✉️ {r.partnerEmail}</span>}
                    <span className="text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Agent note */}
                  {r.agentNote && (
                    <div className="bg-gray-50 rounded-xl px-3.5 py-2.5">
                      <p className="text-xs text-gray-500 italic">"{r.agentNote}"</p>
                      <p className="text-xs text-gray-400 mt-0.5">— {agentName}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {(r.status === "PENDING" || r.status === "UNDER_REVIEW") && (
                    <div className="flex gap-2 flex-wrap">
                      {r.status === "PENDING" && (
                        <button
                          onClick={() => handleUnderReview(r.id)}
                          disabled={pendingId === r.id}
                          className="px-3 py-1.5 text-xs font-medium border border-blue-200 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                        >
                          Mark under review
                        </button>
                      )}
                      <button
                        onClick={() => handleApprove(r.id)}
                        disabled={pendingId === r.id}
                        className="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        Approve & invite
                      </button>
                      <button
                        onClick={() => handleReject(r.id)}
                        disabled={pendingId === r.id}
                        className="px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
