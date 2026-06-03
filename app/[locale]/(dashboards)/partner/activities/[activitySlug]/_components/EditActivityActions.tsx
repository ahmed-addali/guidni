"use client";

import { BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { RequestReviewDialog } from "@/components/partner/RequestReviewDialog";

type Props = {
  activityId: string;
  hasGuidniReview: boolean;
};

export function EditActivityActions({ activityId, hasGuidniReview }: Props) {
  const t = useTranslations("Components.requestReviewDialog");
  if (hasGuidniReview) return null;

  return (
    <div className="flex items-center justify-between gap-4 bg-primary/5 border border-primary/15 rounded-2xl px-5 py-4">
      <div className="flex items-start gap-3">
        <BookOpen className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-gray-800">Get reviewed by Guidni</p>
          <p className="text-xs text-gray-500 mt-0.5">
            A Guidni review badge increases trust and visibility. Our team will visit and write an editorial review of your experience.
          </p>
        </div>
      </div>
      <RequestReviewDialog
        listingId={activityId}
        relationType="ACTIVITY"
        offerHint={t("activityOfferHint")}
      />
    </div>
  );
}
