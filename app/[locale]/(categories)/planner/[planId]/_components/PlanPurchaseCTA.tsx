"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, Loader2, ShoppingBag } from "lucide-react";
import { FaCircleCheck } from "react-icons/fa6";
import { purchasePlan } from "@/lib/actions/plan-purchases";

type GuideInfo = {
  slug: string;
  displayName: string;
  avatarUrl?: string | null;
  isVerified: boolean;
};

type Props = {
  planId: string;
  locale: string;
  price: number;
  duration: number;
  previewDays: number;
  guide: GuideInfo | null;
  isLoggedIn: boolean;
};

export function PlanPurchaseCTA({
  planId,
  locale,
  price,
  duration,
  previewDays,
  guide,
  isLoggedIn,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handlePurchase() {
    if (!isLoggedIn) {
      router.push(`/${locale}/login?redirect=/${locale}/planner/${planId}`);
      return;
    }
    setLoading(true);
    const result = await purchasePlan(planId, locale);
    setLoading(false);
    if (result.success) {
      router.push(result.paymentUrl);
    } else {
      toast.error(result.error);
    }
  }

  const lockedDays = duration - previewDays;

  return (
    <div className="bg-white border-2 border-primary/20 rounded-3xl p-8 shadow-sm space-y-5">
      {/* Lock header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
          <Lock className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-bold text-gray-900">
            {lockedDays} more day{lockedDays !== 1 ? "s" : ""} locked
          </p>
          <p className="text-sm text-gray-500">
            Unlock the full {duration}-day itinerary
          </p>
        </div>
      </div>

      {/* What you get */}
      <ul className="space-y-2">
        {[
          `Full ${duration}-day itinerary with guide notes`,
          "Insider tips & local recommendations on every slot",
          "Save to your account — access anytime",
          guide ? `Direct support from ${guide.displayName}` : "Guide support included",
        ].map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
            <FaCircleCheck className="h-4 w-4 text-green-500 shrink-0" />
            {item}
          </li>
        ))}
      </ul>

      {/* Price + CTA */}
      <div className="pt-2 space-y-3">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">TND {price}</span>
          <span className="text-sm text-gray-400">one-time purchase</span>
        </div>
        <button
          type="button"
          onClick={handlePurchase}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-70"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Redirecting to payment…
            </>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" />
              {isLoggedIn ? `Purchase for TND ${price}` : "Sign in to purchase"}
            </>
          )}
        </button>
        <p className="text-center text-xs text-gray-400">
          Secure checkout · Instant access after payment
        </p>
      </div>
    </div>
  );
}
