import { notFound } from "next/navigation";
import { FiGift } from "react-icons/fi";
import { getMyPoints, getMyAgentProfile } from "@/lib/actions/agent";
import { RedeemPointsForm } from "./_components/RedeemPointsForm";

type Params = Promise<{ locale: string }>;

export async function generateMetadata() {
  return { title: "Points & Wallet — Agent Dashboard" };
}

export default async function PointsPage({ params }: { params: Params }) {
  const { locale } = await params;

  const [profile, pointsData] = await Promise.all([
    getMyAgentProfile(),
    getMyPoints(),
  ]);
  if (!profile || !pointsData) notFound();

  const typeLabels: Record<string, string> = {
    BOOKING_COMMISSION:    "Booking commission",
    REFERRAL_SIGNUP:       "Partner signup",
    REFERRAL_VERIFIED:     "Partner verified",
    REFERRAL_FIRST_LISTING:"Partner first listing",
    REFERRAL_FIRST_BOOKING:"Partner first booking",
    TIER_BONUS:            "Tier bonus",
    REDEMPTION:            "Redemption",
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Points & Wallet</h1>
        <p className="text-gray-500 text-sm mt-0.5">1 point = TND 0.50 · Minimum redemption: 50 points</p>
      </div>

      {/* Balance card */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-white rounded-2xl p-6 space-y-1">
        <p className="text-sm font-medium opacity-75">Current balance</p>
        <p className="text-4xl font-bold">{pointsData.balance} pts</p>
        <p className="text-sm opacity-75">≈ {pointsData.valueInTND} TND</p>
      </div>

      {/* How to earn */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">How to earn points</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "Booking commission (5% rate)",   pts: "10 pts" },
            { label: "Partner signup via your link",   pts: "5 pts" },
            { label: "Partner verified by admin",      pts: "20 pts" },
            { label: "Partner first listing published", pts: "30 pts" },
            { label: "Partner first booking received",  pts: "50 pts" },
          ].map(({ label, pts }) => (
            <div key={label} className="flex items-center justify-between bg-gray-50 rounded-xl px-3.5 py-2.5">
              <p className="text-sm text-gray-700">{label}</p>
              <span className="text-sm font-bold text-primary ml-3 shrink-0">+{pts}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900">Recent activity</h2>
        </div>

        {pointsData.recentActivity.length === 0 ? (
          <div className="py-12 text-center">
            <FiGift className="h-8 w-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No points earned yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {pointsData.recentActivity.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-gray-900">{typeLabels[p.type] ?? p.type}</p>
                  <p className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-sm font-bold ${p.amount >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {p.amount >= 0 ? "+" : ""}{p.amount} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Redeem points */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">Redeem points</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Minimum 50 pts · 1 pt = TND 0.50 · Processed within 5 business days
          </p>
        </div>
        <RedeemPointsForm balance={pointsData.balance} />
      </div>
    </div>
  );
}
