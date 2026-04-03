"use client";

import { useState } from "react";
import { toast } from "sonner";
import { markRedemptionPaid, rejectRedemption } from "@/lib/actions/admin-agents";

type AgentStub = {
  id:          string;
  displayName: string;
  pseudonym:   string | null;
  user:        { email: string };
};

type EarningPayout = {
  id:               string;
  bookingRef:       string;
  listingType:      string;
  commissionAmount: unknown;
  paidAt:           Date | null;
  agent:            AgentStub;
};

type Redemption = {
  id:          string;
  points:      number;
  amountTND:   unknown;
  status:      string;
  method:      string;
  accountInfo: string | null;
  note:        string | null;
  createdAt:   Date;
  agent:       AgentStub;
};

interface Props {
  earningPayouts: EarningPayout[];
  redemptions:    Redemption[];
}

export function PayoutsAdminClient({ earningPayouts, redemptions: initialRedemptions }: Props) {
  const [tab, setTab]                 = useState<"earnings" | "points">("points");
  const [redemptions, setRedemptions] = useState(initialRedemptions);
  const [pendingId, setPendingId]     = useState<string | null>(null);

  async function handleMarkPaid(id: string) {
    setPendingId(id);
    const res = await markRedemptionPaid(id);
    if (res.success) {
      toast.success("Marked as paid.");
      setRedemptions((prev) => prev.filter((r) => r.id !== id));
    } else {
      toast.error(res.error);
    }
    setPendingId(null);
  }

  async function handleReject(id: string) {
    setPendingId(id);
    const res = await rejectRedemption(id);
    if (res.success) {
      toast.success("Redemption rejected. Points refunded to agent.");
      setRedemptions((prev) => prev.filter((r) => r.id !== id));
    } else {
      toast.error(res.error);
    }
    setPendingId(null);
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(["points", "earnings"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "points" ? `Points Redemptions (${redemptions.length})` : `Earnings Payouts (${earningPayouts.length})`}
          </button>
        ))}
      </div>

      {/* Points redemptions tab */}
      {tab === "points" && (
        redemptions.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl py-16 text-center">
            <p className="text-gray-400 text-sm">No pending redemption requests.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <span>Agent</span>
              <span className="text-right">Points</span>
              <span className="text-right">Amount</span>
              <span>Requested</span>
              <span>Actions</span>
            </div>
            <div className="divide-y divide-gray-50">
              {redemptions.map((r) => (
                <div key={r.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {r.agent.pseudonym ? `@${r.agent.pseudonym}` : r.agent.displayName}
                    </p>
                    <p className="text-xs text-gray-400">{r.agent.user.email}</p>
                    {r.accountInfo && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        <span className="font-medium">Account:</span> {r.accountInfo}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 text-right">{r.points} pts</p>
                  <p className="text-sm font-bold text-gray-900 text-right">{Number(r.amountTND).toFixed(2)} TND</p>
                  <p className="text-xs text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMarkPaid(r.id)}
                      disabled={pendingId === r.id}
                      className="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      Mark paid
                    </button>
                    <button
                      onClick={() => handleReject(r.id)}
                      disabled={pendingId === r.id}
                      className="px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* Earnings payouts tab */}
      {tab === "earnings" && (
        earningPayouts.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl py-16 text-center">
            <p className="text-gray-400 text-sm">No earnings payouts recorded.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <span>Agent</span>
              <span>Booking</span>
              <span className="text-right">Commission</span>
              <span>Paid at</span>
            </div>
            <div className="divide-y divide-gray-50">
              {earningPayouts.map((e) => (
                <div key={e.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {e.agent.pseudonym ? `@${e.agent.pseudonym}` : e.agent.displayName}
                    </p>
                    <p className="text-xs text-gray-400">{e.agent.user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{e.bookingRef}</p>
                    <p className="text-xs text-gray-400">{e.listingType}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 text-right">
                    {Number(e.commissionAmount).toFixed(2)} TND
                  </p>
                  <p className="text-xs text-gray-400">
                    {e.paidAt ? new Date(e.paidAt).toLocaleDateString() : "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}
