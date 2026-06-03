import { ReviewCard } from "@/components/reviews/ReviewCard";
import { ReviewForm } from "@/components/reviews/ReviewForm";

type Review = {
  id: string;
  userName: string;
  title?: string | null;
  rating: number;
  comment?: string | null;
  response?: string | null;
  responseDate?: string | null;
  createdAt: Date;
  user: { id: string; name: string | null; image: string | null };
};

type ReviewFormLabels = {
  buttonLabel: string;
  dialogTitle: string;
  ratingLabel: string;
  titleLabel: string;
  titlePlaceholder: string;
  commentLabel: string;
  commentPlaceholder: string;
  submit: string;
  submitting: string;
  cancel: string;
  success: string;
};

type Props = {
  reviews: Review[];
  noReviewsLabel: string;
  /** When provided, shows the "Write a review" button */
  canReview?: boolean;
  listingId?: string;
  relationType?: "ACTIVITY" | "STAY" | "RESTAURANT" | "RENTAL" | "SHOP" | "PRODUCT" | "TRANSFER" | "GUIDE" | "PLAN";
  listingTitle?: string;
  reviewFormLabels?: ReviewFormLabels;
  partnerReplyLabel?: string;
};

export function ReviewsSection({
  reviews,
  noReviewsLabel,
  canReview,
  listingId,
  relationType,
  listingTitle,
  reviewFormLabels,
  partnerReplyLabel,
}: Props) {
  const showForm =
    canReview && listingId && relationType && listingTitle && reviewFormLabels;

  return (
    <div className="space-y-6">
      {/* Write a review button */}
      {showForm && (
        <ReviewForm
          listingId={listingId}
          relationType={relationType}
          listingTitle={listingTitle}
          labels={reviewFormLabels}
        />
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <p className="text-sm text-gray-500 py-4">{noReviewsLabel}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              partnerLabel={partnerReplyLabel}
            />
          ))}
        </div>
      )}
    </div>
  );
}
