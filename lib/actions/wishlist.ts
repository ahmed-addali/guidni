"use server";

import { cache } from "react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

type WishlistRelationType = "ACTIVITY" | "STAY" | "RESTAURANT" | "RENTAL" | "SHOP" | "PRODUCT" | "TRANSFER";

export const getWishlist = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { activities: [], stays: [], restaurants: [], shops: [], products: [], transfers: [], rentals: [] };

  const items = await prisma.wishlist.findMany({
    where: { userId: session.user.id },
  });

  const ids = (type: string) =>
    items.filter((i) => i.relationType === type).map((i) => i.relationId);

  const activityIds   = ids("ACTIVITY");
  const stayIds       = ids("STAY");
  const restaurantIds = ids("RESTAURANT");
  const shopIds       = ids("SHOP");
  const productIds    = ids("PRODUCT");
  const transferIds   = ids("TRANSFER");
  const rentalIds     = ids("RENTAL");

  const [activities, stays, restaurants, shops, products, transfers, rentals] = await Promise.all([
    activityIds.length > 0
      ? prisma.activity.findMany({
          where: { id: { in: activityIds } },
          include: {
            images: { select: { id: true, url: true }, take: 1 },
            destination: { select: { slug: true, city: true, country: true } },
          },
        })
      : [],
    stayIds.length > 0
      ? prisma.stay.findMany({
          where: { id: { in: stayIds } },
          include: {
            images: { select: { id: true, url: true }, take: 1 },
            destination: { select: { slug: true, city: true, country: true } },
          },
        })
      : [],
    restaurantIds.length > 0
      ? prisma.restaurant.findMany({
          where: { id: { in: restaurantIds } },
          select: {
            id: true,
            slug: true,
            name: true,
            arabicName: true,
            type: true,
            category: true,
            meals: true,
            foodTypes: true,
            dietTypes: true,
            attributes: true,
            city: true,
            country: true,
            note: true,
            nbReviews: true,
            coverPhoto: true,
            logo: true,
            reservationsEnabled: true,
            featuredInHome: true,
            destination: { select: { slug: true, city: true } },
            images: { select: { url: true }, take: 1 },
          },
        })
      : [],
    shopIds.length > 0
      ? prisma.shop.findMany({
          where: { id: { in: shopIds } },
          select: {
            id: true, slug: true, name: true, arabicName: true,
            category: true, city: true, country: true, note: true, nbReviews: true,
            coverPhoto: true, logo: true, deliveryMethods: true,
            destination: { select: { city: true } },
            images:   { select: { url: true }, take: 1 },
            products: {
              take: 3,
              select: { images: { select: { url: true }, take: 1 } },
              orderBy: { featured: "desc" },
            },
          },
        })
      : [],
    productIds.length > 0
      ? prisma.product.findMany({
          where: { id: { in: productIds } },
          select: {
            id: true, slug: true, name: true, price: true,
            comparePrice: true, isHandmade: true,
            images: { select: { url: true }, take: 1 },
            shop: { select: { name: true, slug: true } },
          },
        })
      : [],
    transferIds.length > 0
      ? prisma.transfer.findMany({
          where: { id: { in: transferIds } },
          select: {
            id: true, slug: true, title: true, type: true, capacity: true,
            city: true, country: true,
            pricePerTrip: true, pricePerHour: true, pricePerPerson: true,
            images: { select: { url: true }, take: 1 },
            destination: { select: { city: true } },
          },
        })
      : [],
    rentalIds.length > 0
      ? prisma.rental.findMany({
          where: { id: { in: rentalIds } },
          select: {
            id: true, slug: true, title: true, type: true, capacity: true,
            pricePerDay: true, brand: true, model: true,
            city: true, country: true,
            images: { select: { url: true }, take: 1 },
            destination: { select: { city: true } },
          },
        })
      : [],
  ]);

  return { activities, stays, restaurants, shops, products, transfers, rentals };
});

export async function toggleWishlist(
  listingId: string,
  relationType: WishlistRelationType
): Promise<{ isWishlisted: boolean } | { error: "unauthenticated" }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { error: "unauthenticated" };

  const existing = await prisma.wishlist.findFirst({
    where: {
      userId: session.user.id,
      relationId: listingId,
      relationType,
    },
  });

  if (existing) {
    await prisma.wishlist.delete({ where: { id: existing.id } });
    revalidatePath("/wishlist");
    return { isWishlisted: false };
  }

  await prisma.wishlist.create({
    data: {
      userId: session.user.id,
      relationId: listingId,
      relationType,
    },
  });
  revalidatePath("/wishlist");
  return { isWishlisted: true };
}

export const isInWishlist = cache(
  async (listingId: string, relationType: WishlistRelationType) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return false;

    const item = await prisma.wishlist.findFirst({
      where: {
        userId: session.user.id,
        relationId: listingId,
        relationType,
      },
    });

    return !!item;
  }
);
