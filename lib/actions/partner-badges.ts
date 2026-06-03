"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { RelationType } from "@prisma/client";

export async function getPartnerBadgesAndReviews() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const profile = await prisma.businessProfile.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return null;

  const [activities, stays, restaurants, shops, transfers] = await Promise.all([
    prisma.activity.findMany({ where: { profileId: profile.id }, select: { id: true, title: true, slug: true } }),
    prisma.stay.findMany({ where: { profileId: profile.id }, select: { id: true, title: true, slug: true } }),
    prisma.restaurant.findMany({ where: { profileId: profile.id }, select: { id: true, name: true, slug: true } }),
    prisma.shop.findMany({ where: { profileId: profile.id }, select: { id: true, name: true, slug: true } }),
    prisma.transfer.findMany({ where: { profileId: profile.id }, select: { id: true, title: true, slug: true } }),
  ]);

  type ListingItem = { id: string; title: string; slug: string; relationType: RelationType };
  const allListings: ListingItem[] = [
    ...activities.map((a) => ({ id: a.id, title: a.title, slug: a.slug, relationType: "ACTIVITY" as RelationType })),
    ...stays.map((s) => ({ id: s.id, title: s.title, slug: s.slug, relationType: "STAY" as RelationType })),
    ...restaurants.map((r) => ({ id: r.id, title: r.name, slug: r.slug, relationType: "RESTAURANT" as RelationType })),
    ...shops.map((s) => ({ id: s.id, title: s.name, slug: s.slug, relationType: "SHOP" as RelationType })),
    ...transfers.map((t) => ({ id: t.id, title: t.title, slug: t.slug, relationType: "TRANSFER" as RelationType })),
  ];

  const allIds = allListings.map((l) => l.id);
  if (allIds.length === 0) return { listingsWithBadges: [], reviews: [] };

  const [badges, reviews] = await Promise.all([
    prisma.listingBadge.findMany({
      where: { relationId: { in: allIds } },
      select: { badgeKey: true, relationType: true, relationId: true, assignedAt: true },
    }),
    prisma.guidniReview.findMany({
      where: { relationId: { in: allIds } },
      select: {
        id: true,
        relationType: true,
        relationId: true,
        status: true,
        createdAt: true,
        publishedAt: true,
        partnerOffer: true,
        summaryQuote: true,
        season: true,
        reviewerName: true,
        scoreTotal: true,
        partnerResponse: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const badgeMap: Record<string, string[]> = {};
  for (const b of badges) {
    (badgeMap[b.relationId] ??= []).push(b.badgeKey);
  }

  // Map reviews to listing titles
  const idToListing = Object.fromEntries(allListings.map((l) => [l.id, l]));
  const reviewsWithTitle = reviews.map((r) => ({
    ...r,
    listingTitle: idToListing[r.relationId]?.title ?? "Unknown listing",
    listingSlug: idToListing[r.relationId]?.slug ?? "",
  }));

  const listingsWithBadges = allListings
    .map((l) => ({ ...l, badges: badgeMap[l.id] ?? [] }))
    .filter((l) => l.badges.length > 0);

  return { listingsWithBadges, reviews: reviewsWithTitle };
}

export async function requestGuidniReview(
  relationId: string,
  relationType: RelationType,
  offer?: string
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false as const, error: "Not authenticated" };

  // Check if a review already exists
  const existing = await prisma.guidniReview.findFirst({
    where: { relationId, relationType },
  });
  if (existing) {
    return {
      success: false as const,
      error:
        existing.status === "PUBLISHED"
          ? "This listing already has a Guidni review."
          : "A review request is already in progress.",
    };
  }

  const review = await prisma.guidniReview.create({
    data: {
      relationType,
      relationId,
      requestedBy: session.user.id,
      status: "PENDING",
      ...(offer ? { partnerOffer: offer } : {}),
    },
  });
  return { success: true as const, data: review };
}

export async function getMyPublishedReview(reviewId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const profile = await prisma.businessProfile.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return null;

  // Fetch the review and verify it belongs to a listing owned by this partner
  const review = await prisma.guidniReview.findUnique({
    where: { id: reviewId },
    include: { images: { select: { id: true, url: true, alt: true } } },
  });
  if (!review || review.status !== "PUBLISHED") return null;

  // Verify ownership by checking if the listing belongs to this partner's profile
  const owned = await checkListingOwnership(review.relationType as RelationType, review.relationId, profile.id);
  if (!owned) return null;

  return review;
}

async function checkListingOwnership(
  relationType: RelationType,
  relationId: string,
  profileId: string
): Promise<boolean> {
  switch (relationType) {
    case "ACTIVITY":
      return !!(await prisma.activity.findFirst({ where: { id: relationId, profileId } }));
    case "STAY":
      return !!(await prisma.stay.findFirst({ where: { id: relationId, profileId } }));
    case "RESTAURANT":
      return !!(await prisma.restaurant.findFirst({ where: { id: relationId, profileId } }));
    case "SHOP":
      return !!(await prisma.shop.findFirst({ where: { id: relationId, profileId } }));
    case "TRANSFER":
      return !!(await prisma.transfer.findFirst({ where: { id: relationId, profileId } }));
    default:
      return false;
  }
}

export async function submitPartnerResponse(reviewId: string, response: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false as const, error: "Not authenticated" };

  const review = await prisma.guidniReview.findUnique({ where: { id: reviewId } });
  if (!review || review.status !== "PUBLISHED")
    return { success: false as const, error: "Review not found" };
  if (review.partnerResponse)
    return { success: false as const, error: "You have already responded to this review." };

  await prisma.guidniReview.update({
    where: { id: reviewId },
    data: { partnerResponse: response, partnerResponseDate: new Date() },
  });
  return { success: true as const };
}
