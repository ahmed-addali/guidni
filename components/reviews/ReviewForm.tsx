"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StarRatingInput } from "@/components/reviews/StarRatingInput";
import { createReview } from "@/lib/actions/reviews";

interface ReviewFormProps {
  listingId: string;
  relationType: "ACTIVITY" | "STAY" | "RESTAURANT" | "RENTAL" | "SHOP" | "PRODUCT" | "TRANSFER" | "GUIDE" | "PLAN";
  listingTitle: string;
  labels: {
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
}

export function ReviewForm({
  listingId,
  relationType,
  listingTitle,
  labels,
}: ReviewFormProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [ratingError, setRatingError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const reset = () => {
    setRating(0);
    setTitle("");
    setComment("");
    setRatingError("");
  };

  const handleSubmit = () => {
    if (rating === 0) {
      setRatingError("Please select a rating.");
      return;
    }
    setRatingError("");

    startTransition(async () => {
      const result = await createReview(listingId, relationType, {
        rating,
        title: title.trim() || undefined,
        comment: comment.trim() || undefined,
      });

      if (result.success) {
        toast.success(labels.success);
        setOpen(false);
        reset();
        router.refresh();
      } else {
        toast.error(result.error ?? "Something went wrong.");
      }
    });
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        {labels.buttonLabel}
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{labels.dialogTitle}</DialogTitle>
            <p className="text-sm text-gray-500 line-clamp-1">{listingTitle}</p>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Star rating */}
            <div className="space-y-1">
              <Label>{labels.ratingLabel}</Label>
              <StarRatingInput value={rating} onChange={setRating} />
              {ratingError && (
                <p className="text-xs text-red-500">{ratingError}</p>
              )}
            </div>

            {/* Optional title */}
            <div className="space-y-1">
              <Label htmlFor="review-title">{labels.titleLabel}</Label>
              <Input
                id="review-title"
                placeholder={labels.titlePlaceholder}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
              />
            </div>

            {/* Optional comment */}
            <div className="space-y-1">
              <Label htmlFor="review-comment">{labels.commentLabel}</Label>
              <Textarea
                id="review-comment"
                placeholder={labels.commentPlaceholder}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={1000}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setOpen(false); reset(); }}
              disabled={isPending}
            >
              {labels.cancel}
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? labels.submitting : labels.submit}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
