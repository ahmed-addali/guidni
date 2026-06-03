import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { getMyPublishedReview } from "@/lib/actions/partner-badges";
import { GuidniReviewSection } from "@/components/badges/GuidniReviewSection";

type Params = Promise<{ locale: string; reviewId: string }>;

export async function generateMetadata() {
  return { title: "Your Guidni Review — Partner Dashboard" };
}

const REVIEW_LABELS = {
  title:        "Reviewed by Guidni",
  by:           "By",
  visited:      "Visited",
  score:        "Score breakdown",
  accuracy:     "Accuracy",
  quality:      "Quality",
  value:        "Value",
  presentation: "Presentation",
  host:         "Host attitude",
  fullReview:   "The Review",
  loved:        "What we loved",
  worth:        "Worth knowing",
  bestFor:      "Best for",
  partnerReply: "Your response",
  outOf:        "/ 10",
};

export default async function PartnerReviewViewPage({ params }: { params: Params }) {
  const { locale, reviewId } = await params;
  const review = await getMyPublishedReview(reviewId);

  if (!review) notFound();

  const hasSocialLinks = review.tiktokUrl || review.instagramUrl || review.facebookUrl;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back */}
      <Link
        href={`/${locale}/partner/badges`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Badges
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Your Guidni Review</h1>
        <p className="text-sm text-gray-400 mt-1">
          {review.relationType} ·{" "}
          {review.publishedAt
            ? `Published ${new Date(review.publishedAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`
            : "Published"}
        </p>
      </div>

      {/* Review content */}
      <GuidniReviewSection review={review} labels={REVIEW_LABELS} />

      {/* Social links */}
      {hasSocialLinks && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-3">
          <h2 className="font-semibold text-gray-800">Published on Social Media</h2>
          <p className="text-sm text-gray-500">
            Your review has been shared on Guidni&apos;s social channels. Click the links below to see the posts.
          </p>
          <div className="flex flex-wrap gap-3">
            {review.tiktokUrl && (
              <a
                href={review.tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:border-primary hover:text-primary transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                TikTok video
              </a>
            )}
            {review.instagramUrl && (
              <a
                href={review.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:border-primary hover:text-primary transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Instagram post
              </a>
            )}
            {review.facebookUrl && (
              <a
                href={review.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:border-primary hover:text-primary transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Facebook post
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
