"use client";

import { useState } from "react";
import { toast } from "sonner";
import { requestEarningsPayout } from "@/lib/actions/agent";

interface Props {
  confirmedAmount: number;
  locale: string;
}

const MIN_PAYOUT = 25;

export function RequestPayoutButton({ confirmedAmount, locale }: Props) {
  const [pending, setPending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const eligible = confirmedAmount >= MIN_PAYOUT;

  async function handleConfirm() {
    setPending(true);
    try {
      const res = await requestEarningsPayout();
      if (res.success) {
        toast.success("Payout request submitted! We'll process it within 3–5 business days.");
        setShowConfirm(false);
      } else {
        toast.error(res.error ?? "Failed to submit payout request.");
      }
    } finally {
      setPending(false);
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-sm text-gray-600">
          Request payout of <span className="font-semibold text-gray-900">{confirmedAmount.toFixed(2)} TND</span>?
        </p>
        <button
          onClick={() => setShowConfirm(false)}
          className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={pending}
          className="px-4 py-1.5 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {pending ? "Submitting…" : "Confirm"}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      disabled={!eligible}
      title={eligible ? undefined : `Minimum payout is ${MIN_PAYOUT} TND confirmed`}
      className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      Request Payout
    </button>
  );
}
