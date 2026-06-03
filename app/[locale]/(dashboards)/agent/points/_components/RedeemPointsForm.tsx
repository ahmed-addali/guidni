"use client";

import { useState } from "react";
import { toast } from "sonner";
import { requestPointsRedemption } from "@/lib/actions/agent";

interface Props {
  balance: number;
}

const MIN_REDEMPTION = 50;
const POINT_VALUE    = 0.5; // TND per point

export function RedeemPointsForm({ balance }: Props) {
  const [points, setPoints]       = useState<string>("");
  const [pending, setPending]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const parsed   = parseInt(points, 10);
  const isValid  = !isNaN(parsed) && parsed >= MIN_REDEMPTION && parsed <= balance;
  const valueInTND = isValid ? (parsed * POINT_VALUE).toFixed(2) : "—";

  async function handleConfirm() {
    if (!isValid) return;
    setPending(true);
    try {
      const res = await requestPointsRedemption(parsed);
      if (res.success) {
        toast.success(`Redemption of ${parsed} pts submitted! We'll transfer ${valueInTND} TND within 5 business days.`);
        setPoints("");
        setShowConfirm(false);
      } else {
        toast.error(res.error ?? "Failed to submit redemption.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-1.5">
          <label htmlFor="redeem-pts" className="text-sm font-medium text-gray-700">
            Points to redeem
          </label>
          <input
            id="redeem-pts"
            type="number"
            min={MIN_REDEMPTION}
            max={balance}
            step={1}
            value={points}
            onChange={(e) => { setPoints(e.target.value); setShowConfirm(false); }}
            placeholder={`Min ${MIN_REDEMPTION} pts`}
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          />
        </div>

        <div className="text-right min-w-[80px] pb-2">
          <p className="text-xs text-gray-400">You get</p>
          <p className={`text-lg font-bold ${isValid ? "text-gray-900" : "text-gray-300"}`}>
            {valueInTND} <span className="text-sm font-medium">TND</span>
          </p>
        </div>
      </div>

      {points && !isValid && (
        <p className="text-xs text-red-500">
          {isNaN(parsed) || parsed < MIN_REDEMPTION
            ? `Minimum redemption is ${MIN_REDEMPTION} points.`
            : `You only have ${balance} points available.`}
        </p>
      )}

      {showConfirm ? (
        <div className="flex items-center gap-2 pt-1">
          <p className="text-sm text-gray-600 flex-1">
            Redeem <span className="font-semibold text-gray-900">{parsed} pts</span> for{" "}
            <span className="font-semibold text-gray-900">{valueInTND} TND</span>?
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
      ) : (
        <button
          disabled={!isValid}
          onClick={() => setShowConfirm(true)}
          className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Redeem for {isValid ? `${valueInTND} TND` : "TND"}
        </button>
      )}
    </div>
  );
}
