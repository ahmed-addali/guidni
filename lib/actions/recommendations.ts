"use server";

import { prisma } from "@/lib/db";
import { getBadgesForListings } from "@/lib/actions/badges";

export async function getRecommendationDetails(items: { listing_id: string, listing_type: string, tags: string[], rank: number, is_new_listing: boolean }[]) {
  if (!items || items.length === 0) return [];

  // Group by type
  const typeGroups = {
    ACTIVITY: items.filter(i => i.listing_type === "ACTIVITY").map(i => i.listing_id),
    STAY: items.filter(i => i.listing_type === "STAY").map(i => i.listing_id),
    RESTAURANT: items.filter(i => i.listing_type === "RESTAURANT").map(i => i.listing_id),
    TRANSFER: items.filter(i => i.listing_type === "TRANSFER").map(i => i.listing_id),
  };

  const results: Record<string, any> = {};

  // Fetch Activities
  if (typeGroups.ACTIVITY.length > 0) {
    const activities = await prisma.activity.findMany({
      where: { id: { in: typeGroups.ACTIVITY } },
      select: { id: true, slug: true, title: true, arabicTitle: true, price: true, images: { take: 1, select: { url: true } }, destination: { select: { city: true } }, note: true, nbReviews: true }
    });
    const badges = await getBadgesForListings(typeGroups.ACTIVITY, "ACTIVITY");
    activities.forEach(a => results[`ACTIVITY-${a.id}`] = { ...a, badge: badges[a.id]?.[0] });
  }

  // Fetch Stays
  if (typeGroups.STAY.length > 0) {
    const stays = await prisma.stay.findMany({
      where: { id: { in: typeGroups.STAY } },
      select: { id: true, slug: true, title: true, price: true, images: { take: 1, select: { url: true } }, destination: { select: { city: true } }, averageRating: true, nbReviews: true }
    });
    const badges = await getBadgesForListings(typeGroups.STAY, "STAY");
    stays.forEach(a => {
      const { averageRating, ...rest } = a;
      results[`STAY-${a.id}`] = { ...rest, note: averageRating ? String(averageRating) : null, badge: badges[a.id]?.[0] };
    });
  }

  // Fetch Restaurants
  if (typeGroups.RESTAURANT.length > 0) {
    const restaurants = await prisma.restaurant.findMany({
      where: { id: { in: typeGroups.RESTAURANT } },
      select: { id: true, slug: true, name: true, images: { take: 1, select: { url: true } }, destination: { select: { city: true } }, note: true, nbReviews: true }
    });
    const badges = await getBadgesForListings(typeGroups.RESTAURANT, "RESTAURANT");
    restaurants.forEach(a => results[`RESTAURANT-${a.id}`] = { ...a, title: a.name, price: 0, badge: badges[a.id]?.[0] });
  }

  // Fetch Transfers
  if (typeGroups.TRANSFER.length > 0) {
    const transfers = await prisma.transfer.findMany({
      where: { id: { in: typeGroups.TRANSFER } },
      select: { id: true, slug: true, title: true, arabicTitle: true, pricePerTrip: true, pricePerHour: true, pricePerPerson: true, images: { take: 1, select: { url: true } }, destination: { select: { city: true } }, note: true, nbReviews: true }
    });
    const badges = await getBadgesForListings(typeGroups.TRANSFER, "TRANSFER");
    transfers.forEach(a => {
      const { pricePerTrip, pricePerHour, pricePerPerson, ...rest } = a;
      results[`TRANSFER-${a.id}`] = {
        ...rest,
        price: pricePerTrip ?? pricePerHour ?? pricePerPerson ?? 0,
        badge: badges[a.id]?.[0]
      };
    });
  }

  // Map back to original sorted order and format standard card data
  return items.map(item => {
    const data = results[`${item.listing_type}-${item.listing_id}`];
    return {
      ...item,
      details: data || null
    };
  }).filter(item => item.details !== null);
}
