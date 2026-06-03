import Link from "next/link";
import { notFound } from "next/navigation";
import { FiUsers, FiPlus } from "react-icons/fi";
import { getMyAgentProfile } from "@/lib/actions/agent";
import { getMyReferrals } from "@/lib/actions/agent-referrals";
import { ReferralLinkCard } from "./_components/ReferralLinkCard";

type Params = Promise<{ locale: string }>;

export async function generateMetadata() {
  return { title: "Referrals — Agent Dashboard" };
}

const milestones = [
  { label: "Partner signup",        pts: 5,  key: "signupAt" },
  { label: "Admin verified",        pts: 20, key: "verifiedAt" },
  { label: "First listing",         pts: 30, key: "firstListingAt" },
  { label: "First booking",         pts: 50, key: "firstBookingAt" },
] as const;

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING:      { label: "Pending review",  className: "bg-yellow-50 text-yellow-700 border-yellow-100" },
  UNDER_REVIEW: { label: "Under review",    className: "bg-blue-50 text-blue-700 border-blue-100" },
  VERIFIED:     { label: "Verified",        className: "bg-green-50 text-green-700 border-green-100" },
  REJECTED:     { label: "Rejected",        className: "bg-red-50 text-red-600 border-red-100" },
};

export default async function ReferralsPage({ params }: { params: Params }) {
  const { locale } = await params;

  const [profile, referrals] = await Promise.all([
    getMyAgentProfile(),
    getMyReferrals(),
  ]);
  if (!profile || referrals === null) notFound();

  const baseUrl      = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const referralLink = `${baseUrl}/${locale}/become-partner?ref=${profile.id}`;

  const totalPotential = milestones.reduce((s, m) => s + m.pts, 0);

  return (
    <div className="space-y-6 max-w-screen-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partner Referrals</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Earn up to {totalPotential} points per partner you refer.
          </p>
        </div>
        <Link
          href={`/${locale}/agent/referrals/new`}
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <FiPlus className="h-4 w-4" />
          Refer a partner
        </Link>
      </div>

      {/* Referral link card */}
      <div className="bg-gradient-to-br from-primary/8 to-primary/3 border border-primary/10 rounded-2xl p-5 space-y-3">
        <div>
          <h2 className="font-semibold text-gray-900">Your referral link</h2>
          <p className="text-xs text-gray-500 mt-0.5">Partners who sign up via this link are automatically linked to you.</p>
        </div>
        <ReferralLinkCard link={referralLink} />

        {/* Milestone table */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {milestones.map(({ label, pts }) => (
            <div key={label} className="bg-white rounded-xl border border-primary/10 px-3 py-2.5 text-center">
              <p className="text-base font-bold text-primary">+{pts}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Referrals list */}
      {referrals.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl py-20 text-center">
          <FiUsers className="h-10 w-10 text-gray-200 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-1">No referrals yet</h2>
          <p className="text-sm text-gray-400 max-w-xs mx-auto mb-5">
            Know a hotel owner, restaurant manager, or tour guide? Refer them to Guidni and earn points.
          </p>
          <Link
            href={`/${locale}/agent/referrals/new`}
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <FiPlus className="h-4 w-4" />
            Refer your first partner
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Your referrals</h2>
            <span className="text-sm text-gray-400">{referrals.length} total</span>
          </div>
          <div className="divide-y divide-gray-50">
            {referrals.map((r) => {
              const s = statusConfig[r.status] ?? statusConfig.PENDING;

              // Calculate potential remaining points
              const earned   = r.pointsAwarded;
              const remaining = totalPotential - earned;

              return (
                <div key={r.id} className="px-5 py-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {r.businessProfile?.name ?? r.partnerName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {r.partnerType?.toLowerCase().replace("_", " ") ?? ""}
                        {r.partnerCity ? ` · ${r.partnerCity}` : ""}
                        {" · "}{new Date(r.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${s.className}`}>
                      {s.label}
                    </span>
                  </div>

                  {/* 4-milestone progress */}
                  <div className="space-y-1.5">
                    <div className="flex gap-1.5">
                      {milestones.map(({ key, label, pts }) => {
                        const reached = Boolean((r as Record<string, unknown>)[key]);
                        return (
                          <div key={key} className="flex-1 space-y-1" title={`${label} · ${reached ? "✓" : "pending"}`}>
                            <div className={`h-1.5 rounded-full transition-colors ${reached ? "bg-primary" : "bg-gray-100"}`} />
                            <p className="text-[10px] text-gray-400 text-center hidden sm:block">
                              {reached ? `+${pts} ✓` : `+${pts}`}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      Earned: <span className="font-semibold text-gray-900">{earned} pts</span>
                    </span>
                    {remaining > 0 && r.status !== "REJECTED" && (
                      <span className="text-gray-400">
                        +{remaining} pts potential
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
