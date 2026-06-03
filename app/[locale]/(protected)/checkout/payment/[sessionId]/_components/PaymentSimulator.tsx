"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Lock, CreditCard, Check, X, Loader2, AlertCircle } from "lucide-react";
import { confirmPaymentAction, cancelPaymentAction } from "@/lib/actions/payments";

type Props = {
  sessionId: string;
  amount: number;
  currency: string;
  description: string;
};

function formatAmount(amount: number, currency: string): string {
  // amount is in smallest unit: millimes for TND, cents for USD/EUR
  const divisor = currency === "TND" ? 1000 : 100;
  const value = (amount / divisor).toFixed(3);
  const symbols: Record<string, string> = { TND: "TND", USD: "$", EUR: "€" };
  const symbol = symbols[currency] ?? currency;
  return currency === "TND" ? `${value} ${symbol}` : `${symbol}${value}`;
}

export function PaymentSimulator({ sessionId, amount, currency, description }: Props) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setState("processing");
    setError(null);

    // Simulate network delay / card processing
    await new Promise((r) => setTimeout(r, 1800));

    const result = await confirmPaymentAction(sessionId);
    if (result.success) {
      setState("done");
      await new Promise((r) => setTimeout(r, 800)); // show success briefly
      router.push(result.redirectUrl);
    } else {
      setState("error");
      setError(result.error);
    }
  }

  async function handleCancel() {
    const result = await cancelPaymentAction(sessionId);
    if (result.success) {
      router.push(result.redirectUrl);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Simulation badge */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-xs font-semibold px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
            ⚡ Payment Simulation — no real charge
          </span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Header */}
          <div className="bg-primary px-8 py-6 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="h-4 w-4 opacity-70" />
              <span className="text-xs font-medium opacity-70 uppercase tracking-wide">Secure payment</span>
            </div>
            <p className="text-sm text-white/80 mb-1">{description}</p>
            <p className="text-3xl font-bold tracking-tight">
              {formatAmount(amount, currency)}
            </p>
          </div>

          {/* Body */}
          <div className="px-8 py-7 space-y-6">

            {/* Fake card form */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Card number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value="4242 4242 4242 4242"
                    readOnly
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono bg-gray-50 text-gray-600 cursor-not-allowed pr-10"
                  />
                  <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Expiry
                  </label>
                  <input
                    type="text"
                    value="12 / 28"
                    readOnly
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    CVV
                  </label>
                  <input
                    type="text"
                    value="123"
                    readOnly
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Cardholder name
                </label>
                <input
                  type="text"
                  value="TEST USER"
                  readOnly
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Pay button */}
            <button
              type="button"
              onClick={handlePay}
              disabled={state !== "idle" && state !== "error"}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {state === "processing" && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing…
                </>
              )}
              {state === "done" && (
                <>
                  <Check className="h-4 w-4" />
                  Payment confirmed
                </>
              )}
              {(state === "idle" || state === "error") && (
                <>
                  <Lock className="h-4 w-4" />
                  Pay {formatAmount(amount, currency)}
                </>
              )}
            </button>

            {/* Cancel */}
            <button
              type="button"
              onClick={handleCancel}
              disabled={state === "processing" || state === "done"}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40"
            >
              <X className="h-3.5 w-3.5" />
              Cancel and go back
            </button>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-8 py-4 bg-gray-50 flex items-center justify-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs text-gray-400">
              256-bit SSL · PCI DSS compliant simulation
            </span>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          This is a simulated payment page. No real transaction occurs.
          <br />
          Will be replaced by Stripe / Konnect before launch.
        </p>
      </div>
    </div>
  );
}
