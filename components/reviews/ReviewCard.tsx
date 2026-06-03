import Image from "next/image";
import { FaStar } from "react-icons/fa";

type ReviewCardProps = {
  review: {
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
  partnerLabel?: string; // e.g. "Response from the host"
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <FaStar
          key={i}
          className={i < rating ? "text-yellow-400 h-3.5 w-3.5" : "text-gray-200 h-3.5 w-3.5"}
        />
      ))}
    </div>
  );
}

export function ReviewCard({ review, partnerLabel = "Response from the host" }: ReviewCardProps) {
  const displayName = review.user.name ?? review.userName;
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="space-y-3">
      {/* Reviewer */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full overflow-hidden bg-gray-100 shrink-0 relative">
          {review.user.image ? (
            <Image
              src={review.user.image}
              alt={displayName}
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-xs font-bold text-gray-500 bg-primary/10">
              {initials}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{displayName}</p>
          <p className="text-xs text-gray-400">
            {new Date(review.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Rating + content */}
      <Stars rating={review.rating} />
      {review.title && (
        <p className="text-sm font-semibold text-gray-800">{review.title}</p>
      )}
      {review.comment && (
        <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
      )}

      {/* Partner reply */}
      {review.response && (
        <div className="ml-4 pl-4 border-l-2 border-gray-100 space-y-1">
          <p className="text-xs font-semibold text-gray-500">{partnerLabel}</p>
          {review.responseDate && (
            <p className="text-xs text-gray-400">
              {new Date(review.responseDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          )}
          <p className="text-sm text-gray-600 leading-relaxed">{review.response}</p>
        </div>
      )}
    </div>
  );
}
