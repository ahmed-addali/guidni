"use server";

import { cache } from "react";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { RelationType } from "@prisma/client";
import { ReviewSchema } from "@/lib/validations/review";

// ─── Read ─────────────────────────────────────────────────────────────────────

export const getReviews = cache(
  async (relationId: string, relationType: RelationType) => {
    return prisma.review.findMany({
      where: { relationId, relationType },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }
);

// ─── Guards ───────────────────────────────────────────────────────────────────

type ReviewableType = "ACTIVITY" | "STAY" | "RESTAURANT" | "RENTAL" | "SHOP" | "PRODUCT" | "TRANSFER" | "GUIDE" | "PLAN";

export const hasCompletedBooking = cache(
  async (listingId: string, relationType: ReviewableType) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return false;

    // These types don't require a completed booking — any authenticated user can review
    if (relationType === "RESTAURANT" || relationType === "SHOP" || relationType === "PRODUCT") {
      return true;
    }

    if (relationType === "ACTIVITY") {
      const booking = await prisma.activityReservation.findFirst({
        where: { userId: session.user.id, activityId: listingId, status: "COMPLETED" },
      });
      return !!booking;
    }

    if (relationType === "STAY") {
      const booking = await prisma.staysReservation.findFirst({
        where: { userId: session.user.id, stayId: listingId, status: "COMPLETED" },
      });
      return !!booking;
    }

    if (relationType === "TRANSFER") {
      const booking = await prisma.transferReservation.findFirst({
        where: { userId: session.user.id, transferId: listingId, status: "COMPLETED" },
      });
      return !!booking;
    }

    // RENTAL — any authenticated user can review for now
    return true;
  }
);

export const hasReviewed = cache(
  async (listingId: string, relationType: ReviewableType) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return false;

    const existing = await prisma.review.findFirst({
      where: { userId: session.user.id, relationId: listingId, relationType },
    });
    return !!existing;
  }
);

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createReview(
  listingId: string,
  relationType: ReviewableType,
  rawData: unknown
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const parsed = ReviewSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation error" };
  }

  const { rating, title, comment } = parsed.data;

  const canReview = await hasCompletedBooking(listingId, relationType);
  if (!canReview) {
    return { success: false, error: "You need a completed booking to leave a review." };
  }

  const alreadyReviewed = await hasReviewed(listingId, relationType);
  if (alreadyReviewed) {
    return { success: false, error: "You have already reviewed this listing." };
  }

  try {
    await prisma.review.create({
      data: {
        userId: session.user.id,
        userName: session.user.name ?? "Guest",
        relationId: listingId,
        relationType,
        rating,
        title,
        comment,
      },
    });

    await updateListingRating(listingId, relationType);

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("createReview error:", error);
    return { success: false, error: "Failed to submit review. Please try again." };
  }
}

// ─── Partner reply ────────────────────────────────────────────────────────────

export async function addPartnerReply(reviewId: string, response: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { relationId: true, relationType: true },
  });
  if (!review) return { success: false, error: "Review not found" };

  const profile = await prisma.businessProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return { success: false, error: "No business profile" };

  const isOwner =
    review.relationType === "ACTIVITY"
      ? await prisma.activity.findFirst({ where: { id: review.relationId, profileId: profile.id } })
      : review.relationType === "RESTAURANT"
      ? await prisma.restaurant.findFirst({ where: { id: review.relationId, profileId: profile.id } })
      : await prisma.stay.findFirst({ where: { id: review.relationId, profileId: profile.id } });

  if (!isOwner) return { success: false, error: "Unauthorized" };

  await prisma.review.update({
    where: { id: reviewId },
    data: { response, responseDate: new Date().toISOString() },
  });

  revalidatePath("/");
  return { success: true };
}

// ─── Helper ───────────────────────────────────────────────────────────────────

async function updateListingRating(listingId: string, relationType: ReviewableType) {
  const reviews = await prisma.review.findMany({
    where: { relationId: listingId, relationType },
    select: { rating: true },
  });

  const count = reviews.length;
  const avg = count > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  const rounded = Math.round(avg * 10) / 10;

  if (relationType === "ACTIVITY") {
    await prisma.activity.update({
      where: { id: listingId },
      data: { note: String(rounded), nbReviews: count },
    });
  } else if (relationType === "STAY") {
    await prisma.stay.update({
      where: { id: listingId },
      data: { averageRating: rounded, nbReviews: count },
    });
  } else if (relationType === "RESTAURANT") {
    await prisma.restaurant.update({
      where: { id: listingId },
      data: { note: String(rounded), nbReviews: count },
    });
  } else if (relationType === "SHOP") {
    await prisma.shop.update({
      where: { id: listingId },
      data: { note: String(rounded), nbReviews: count },
    });
  } else if (relationType === "TRANSFER") {
    await prisma.transfer.update({
      where: { id: listingId },
      data: { note: String(rounded), nbReviews: count },
    });
  }
  // PRODUCT, RENTAL — no stored aggregate fields yet
}
