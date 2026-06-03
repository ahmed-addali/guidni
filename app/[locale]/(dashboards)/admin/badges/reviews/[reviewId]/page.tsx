import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getGuidniReviewById } from "@/lib/actions/admin-badges";
import { ReviewEditorForm } from "./_components/ReviewEditorForm";

type Params = Promise<{ locale: string; reviewId: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  return { title: "Edit Guidni Review — Admin" };
}

export default async function ReviewEditorPage({ params }: { params: Params }) {
  const { locale, reviewId } = await params;
  const review = await getGuidniReviewById(reviewId);

  if (!review) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back */}
      <Link
        href={`/${locale}/admin/badges`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Badges
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Guidni Review Editor</h1>
          <p className="text-sm text-gray-400 mt-1">
            {review.relationType} · ID {review.relationId.slice(0, 10)}…
            {review.status === "PUBLISHED" && (
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                Published
              </span>
            )}
          </p>
        </div>
      </div>

      <ReviewEditorForm review={review} locale={locale} />
    </div>
  );
}
