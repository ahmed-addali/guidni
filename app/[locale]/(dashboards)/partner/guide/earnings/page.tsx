import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getGuideEarnings } from "@/lib/actions/plan-purchases";
import { FiTrendingUp, FiShoppingBag, FiDollarSign, FiPercent } from "react-icons/fi";
import { BookOpen } from "lucide-react";

type Params = Promise<{ locale: string }>;

export const metadata = { title: "Earnings — Guidni Partner" };

function formatTND(millimes: number) {
  return `TND ${millimes.toFixed(0)}`;
}

export default async function GuideEarningsPage({ params }: { params: Params }) {
  const { locale } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect(`/${locale}/login`);

  const data = await getGuideEarnings();
  if (!data) redirect(`/${locale}/partner/guide/profile`);

  const { purchases, totalEarned, totalRevenue, totalFees, byPlan } = data;

  return (
    <div className="space-y-8 max-w-screen-lg">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
        <p className="text-sm text-gray-400 mt-1">
          Your revenue from sold plans. Platform fee is 10%.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-xl bg-green-50 flex items-center justify-center">
              <FiTrendingUp className="h-4.5 w-4.5 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-500">Total earned</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatTND(totalEarned)}</p>
          <p className="text-xs text-gray-400 mt-1">after platform fee</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <FiShoppingBag className="h-4.5 w-4.5 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-500">Total sales</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{purchases.length}</p>
          <p className="text-xs text-gray-400 mt-1">
            {purchases.length === 1 ? "purchase" : "purchases"} total
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <FiPercent className="h-4.5 w-4.5 text-amber-600" />
            </div>
            <p className="text-sm font-medium text-gray-500">Platform fees</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatTND(totalFees)}</p>
          <p className="text-xs text-gray-400 mt-1">
            {formatTND(totalRevenue)} gross revenue
          </p>
        </div>
      </div>

      {/* Per-plan breakdown */}
      {byPlan.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Revenue by plan</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {byPlan.map((p) => (
              <div key={p.planId} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.planTitle}</p>
                    {p.city && <p className="text-xs text-gray-400">{p.city}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-8 shrink-0 text-right">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{p.count}</p>
                    <p className="text-xs text-gray-400">{p.count === 1 ? "sale" : "sales"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-green-700">{formatTND(p.earned)}</p>
                    <p className="text-xs text-gray-400">earned</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction history */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Transaction history</h2>
        </div>

        {purchases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FiDollarSign className="h-8 w-8 text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium text-sm">No purchases yet</p>
            <p className="text-gray-400 text-xs mt-1">
              Revenue will appear here when travelers buy your plans.
            </p>
          </div>
        ) : (
          <>
            {/* Header row */}
            <div className="hidden sm:grid grid-cols-[1fr_140px_100px_100px_100px] gap-4 px-6 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              <span>Plan</span>
              <span>Buyer</span>
              <span className="text-right">Gross</span>
              <span className="text-right">Fee</span>
              <span className="text-right">You earn</span>
            </div>
            <div className="divide-y divide-gray-50">
              {purchases.map((p) => (
                <div
                  key={p.id}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_140px_100px_100px_100px] gap-2 sm:gap-4 px-6 py-4 items-center"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {p.plan.title ?? `${p.plan.duration}-Day Plan`}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(p.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                      {" · "}
                      <span className="font-mono text-gray-300">{p.purchaseRef}</span>
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {p.user.name ?? p.user.email ?? "—"}
                  </p>
                  <p className="text-sm text-gray-700 sm:text-right">{formatTND(p.amount)}</p>
                  <p className="text-sm text-amber-600 sm:text-right">−{formatTND(p.platformFee)}</p>
                  <p className="text-sm font-semibold text-green-700 sm:text-right">
                    {formatTND(p.guideEarns)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Payout note */}
      <div className="rounded-2xl border border-amber-100 bg-amber-50 px-6 py-4 text-sm text-amber-800">
        <strong>Payouts:</strong> Earnings are processed manually at the end of each month. Contact{" "}
        <a href="mailto:guides@guidni.com" className="underline font-medium">
          guides@guidni.com
        </a>{" "}
        with your payout details.
      </div>
    </div>
  );
}
