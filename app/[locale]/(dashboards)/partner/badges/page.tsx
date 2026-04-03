import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, ShieldCheck, ExternalLink } from "lucide-react";
import { getPartnerBadgesAndReviews } from "@/lib/actions/partner-badges";
import { BadgeChip } from "@/components/badges/BadgeChip";
import type { BadgeKey } from "@prisma/client";

type Params = Promise<{ locale: string }>;

export async function generateMetadata() {
  return { title: "Badges & Reviews — Partner Dashboard" };
}

const STATUS_CONFIG = {
  PENDING:      { label: "Pending",      className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  SCHEDULED:    { label: "Scheduled",    className: "bg-blue-50 text-blue-700 border-blue-200" },
  UNDER_REVIEW: { label: "Under Review", className: "bg-purple-50 text-purple-700 border-purple-200" },
  PUBLISHED:    { label: "Published",    className: "bg-green-50 text-green-700 border-green-200" },
  WITHDRAWN:    { label: "Withdrawn",    className: "bg-red-50 text-red-700 border-red-200" },
} as const;

const STATUS_STEPS = ["PENDING", "SCHEDULED", "UNDER_REVIEW", "PUBLISHED"] as const;

const TYPE_LABELS: Record<string, string> = {
  ACTIVITY:   "Activity",
  STAY:       "Stay",
  RESTAURANT: "Restaurant",
  SHOP:       "Shop",
  TRANSFER:   "Transfer",
  RENTAL:     "Rental",
};

export default async function PartnerBadgesPage({ params }: { params: Params }) {
  const { locale } = await params;
  const data = await getPartnerBadgesAndReviews();

  if (!data) redirect(`/${locale}/partner`);

  const { listingsWithBadges, reviews } = data;

  const activeReviews   = reviews.filter((r) => r.status !== "WITHDRAWN");
  const withdrawnReviews = reviews.filter((r) => r.status === "WITHDRAWN");
  const publishedCount  = reviews.filter((r) => r.status === "PUBLISHED").length;
  const pendingCount    = reviews.filter((r) => r.status === "PENDING").length;
  const totalBadges     = listingsWithBadges.reduce((acc, l) => acc + l.badges.length, 0);

  return (
    <div className="space-y-8 max-w-screen-lg">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Badges &amp; Reviews</h1>
        <p className="text-sm text-gray-400 mt-1">
          Your trust signals and Guidni review request history.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Badges",      value: totalBadges },
          { label: "Review Requests",   value: reviews.length },
          { label: "Published Reviews", value: publishedCount },
          { label: "Pending Requests",  value: pendingCount },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Active Badges */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">
        <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">
          Your Active Badges
        </h2>

        {listingsWithBadges.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <ShieldCheck className="h-8 w-8 text-gray-200 mx-auto" />
            <p className="text-sm text-gray-400">No badges yet on your listings.</p>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Request a Guidni Review from any listing page, or ensure your profile is verified to start earning badges.
            </p>
            <Link
              href={`/${locale}/badges`}
              className="inline-block text-xs text-primary hover:underline underline-offset-4"
            >
              Learn how badges work →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {listingsWithBadges.map((listing) => (
              <div
                key={listing.id}
                className="flex items-center justify-between gap-4 py-3 border-b border-gray-50 last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{listing.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {TYPE_LABELS[listing.relationType] ?? listing.relationType}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {listing.badges.map((key) => (
                    <BadgeChip key={key} badgeKey={key as BadgeKey} size="sm" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Requests */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h2 className="font-semibold text-gray-800">Guidni Review Requests</h2>
          <Link
            href={`/${locale}/badges`}
            className="text-xs text-primary hover:underline underline-offset-4"
          >
            How reviews work
          </Link>
        </div>

        {activeReviews.length === 0 && withdrawnReviews.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <BookOpen className="h-8 w-8 text-gray-200 mx-auto" />
            <p className="text-sm text-gray-400">No review requests yet.</p>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Request a Guidni Review from any of your listing pages. Our team visits, experiences your offering, and publishes an editorial review on your listing and our social media.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {activeReviews.map((r) => {
              const cfg = STATUS_CONFIG[r.status];
              const stepIndex = STATUS_STEPS.indexOf(r.status as typeof STATUS_STEPS[number]);

              return (
                <div key={r.id} className="border border-gray-100 rounded-2xl p-5 space-y-4">
                  {/* Row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 truncate">{r.listingTitle}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {TYPE_LABELS[r.relationType] ?? r.relationType} ·{" "}
                        Requested {new Date(r.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-xs px-2.5 py-1 rounded-full border font-medium ${cfg.className}`}
                    >
                      {cfg.label}
                    </span>
                  </div>

                  {/* Progress bar */}
                  {r.status !== "WITHDRAWN" && (
                    <div className="flex items-center gap-1">
                      {STATUS_STEPS.map((step, i) => {
                        const done = i <= stepIndex;
                        return (
                          <div key={step} className="flex items-center flex-1 gap-1">
                            <div
                              className={`h-1.5 flex-1 rounded-full transition-colors ${
                                done ? "bg-primary" : "bg-gray-100"
                              }`}
                            />
                            {i < STATUS_STEPS.length - 1 && null}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Steps labels */}
                  {r.status !== "WITHDRAWN" && (
                    <div className="flex justify-between text-xs text-gray-400">
                      {STATUS_STEPS.map((step, i) => (
                        <span
                          key={step}
                          className={i <= stepIndex ? "text-primary font-medium" : ""}
                        >
                          {STATUS_CONFIG[step].label}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Published review details */}
                  {r.status === "PUBLISHED" && (
                    <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                            Guidni Review — {r.season ?? ""}
                            {r.reviewerName ? ` · by ${r.reviewerName}` : ""}
                            {r.scoreTotal ? ` · Score: ${(r.scoreTotal / 10).toFixed(1)}/10` : ""}
                          </p>
                          {r.summaryQuote && (
                            <p className="text-sm text-gray-700 italic">&ldquo;{r.summaryQuote}&rdquo;</p>
                          )}
                        </div>
                        <Link
                          href={`/${locale}/partner/badges/reviews/${r.id}`}
                          className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 border border-primary/20 rounded-lg text-primary hover:bg-primary/5 transition-colors whitespace-nowrap"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View review
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Offer submitted */}
                  {r.partnerOffer && r.status === "PENDING" && (
                    <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                      <span className="font-medium text-gray-700">Your offer: </span>
                      {r.partnerOffer.split("\n")[0]}
                      {r.partnerOffer.includes("\n") && "…"}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Withdrawn (collapsed) */}
            {withdrawnReviews.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Withdrawn ({withdrawnReviews.length})
                </p>
                {withdrawnReviews.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between text-sm py-2.5 px-4 border border-gray-100 rounded-xl"
                  >
                    <span className="text-gray-500 truncate">{r.listingTitle}</span>
                    <span className="text-xs text-red-500 font-medium shrink-0 ml-4">Withdrawn</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 text-sm text-gray-600 space-y-2">
        <p className="font-semibold text-gray-800 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          How to get the Reviewed by Guidni badge
        </p>
        <p>
          Go to any of your listing pages (Activities, Stays, Restaurants, etc.) and click{" "}
          <strong>Request Review</strong>. Fill in your offer for the Guidni reviewer and best times to visit.
          Our team selects requests weekly — if chosen, a reviewer visits unannounced.
          The review is published on your listing page and shared on our Instagram, Facebook, and TikTok.
        </p>
        <p className="text-xs text-gray-400">
          The badge is earned through quality — it cannot be purchased.{" "}
          <Link href={`/${locale}/badges`} className="text-primary hover:underline underline-offset-4">
            Learn more →
          </Link>
        </p>
      </div>
    </div>
  );
}
