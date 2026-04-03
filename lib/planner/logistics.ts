import { SHOP_CATEGORY_TO_INTERESTS } from "./category-map";
import { INTEREST_MAP } from "./interests";
import { scoreItem } from "./engine";
import type {
  PlanDay,
  PlanItem,
  PlannerData,
  PlanShopData,
  PlanShopSuggestion,
  UserPreferences,
} from "./types";

// ─────────────────────────────────────────────────────────────
// Transfer / Rental logistics injection
// ─────────────────────────────────────────────────────────────

const ARRIVAL_NOTES: Record<string, string> = {
  AIRPORT_TRANSFER:
    "Your driver will meet you at arrivals with a name sign. Book in advance to guarantee availability.",
  TAXI:
    "Taxis are available outside the terminal. Confirm the fare before you start.",
  CHAUFFEUR:
    "Your private chauffeur will be waiting at arrivals. Sit back and relax.",
  SHUTTLE:
    "The shuttle departs on a fixed schedule. Book your seat in advance.",
};

const DEPARTURE_NOTES: Record<string, string> = {
  AIRPORT_TRANSFER:
    "Allow at least 2 hours before your flight. Driver confirmed at your accommodation.",
  TAXI:
    "Ask your accommodation to book a taxi the evening before to avoid waiting.",
  CHAUFFEUR:
    "Your private chauffeur will pick you up at the agreed time. Confirm the evening before.",
  SHUTTLE:
    "Check the shuttle schedule — book your seat the day before departure.",
};

export function injectLogistics(
  days: PlanDay[],
  data: PlannerData,
  prefs: UserPreferences
): PlanDay[] {
  const result = days.map((d) => ({ ...d })); // shallow clone

  // Find best airport transfer
  const airportTransfer = data.transfers
    .filter((t) => t.transferType === "AIRPORT_TRANSFER")
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0];

  // Find best city taxi
  const cityTaxi = data.transfers
    .filter((t) => t.transferType === "TAXI")
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0];

  const transferForLogistics = airportTransfer ?? cityTaxi ?? data.transfers[0];

  // Rule 1 — Airport pickup on arrival (Day 1)
  if (prefs.needsAirportPickup && transferForLogistics) {
    result[0] = {
      ...result[0],
      logistics: {
        type: "ARRIVAL_TRANSFER",
        item: transferForLogistics,
        note:
          ARRIVAL_NOTES[transferForLogistics.transferType ?? "AIRPORT_TRANSFER"] ??
          ARRIVAL_NOTES["AIRPORT_TRANSFER"],
      },
    };
  }

  // Rule 2 — Return transfer on last day
  if (prefs.needsReturnTransfer && transferForLogistics && result.length > 0) {
    const lastIdx = result.length - 1;
    result[lastIdx] = {
      ...result[lastIdx],
      logistics: {
        type: "DEPARTURE_TRANSFER",
        item: transferForLogistics,
        note:
          DEPARTURE_NOTES[transferForLogistics.transferType ?? "AIRPORT_TRANSFER"] ??
          DEPARTURE_NOTES["AIRPORT_TRANSFER"],
      },
    };
  }

  // Rule 3 — Rental pickup (Day 2) and dropoff (Day N-1)
  if (prefs.needsRental && data.rentals.length > 0) {
    const rentalType = prefs.rentalType ?? "car";
    const rental =
      data.rentals.find((r) => r.tags.includes(rentalType)) ??
      data.rentals[0];

    if (rental && result.length >= 2) {
      // Pickup Day 2
      result[1] = {
        ...result[1],
        logistics: {
          type: "RENTAL_PICKUP",
          item: rental,
          note: `Pick up your ${rentalType} rental and explore the destination at your own pace.`,
        },
      };

      // Dropoff second-to-last day (if > 2 days)
      if (result.length > 2) {
        const dropoffIdx = result.length - 2;
        result[dropoffIdx] = {
          ...result[dropoffIdx],
          logistics: {
            type: "RENTAL_DROPOFF",
            item: rental,
            note: `Return your ${rentalType} rental by the agreed time. Check for any damage with the partner.`,
          },
        };
      }
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────
// Shopping block injection
// ─────────────────────────────────────────────────────────────

const SHOP_NOTES: Record<string, string> = {
  crafts:     "Pick up handmade pieces to remember your trip",
  textiles:   "Traditional woven textiles — buy directly from local artisans",
  spices:     "Authentic spice blends you won't find back home",
  jewelry:    "Handcrafted jewelry unique to this destination",
  leather:    "Hand-stitched leather goods at artisan prices",
  ceramics:   "Hand-painted pottery — each piece is one of a kind",
  souvenirs:  "Last-minute gifts and mementos for friends and family",
  wellness:   "Local essential oils and wellness products",
  food_local: "Local food products — perfect gifts for foodies",
  clothing:   "Traditional wear to bring a piece of culture home",
};

export function scoreShop(shop: PlanShopData, prefs: UserPreferences): number {
  const categoryInterests =
    (SHOP_CATEGORY_TO_INTERESTS[shop.category] as string[]) ?? [];
  const interestMatch = categoryInterests.filter((id) =>
    prefs.interests.includes(id as never)
  ).length;

  let score = interestMatch * 30;

  // Product interest match bonus
  const productTags = shop.products.flatMap((p) => p.tags);
  for (const interestId of prefs.interests) {
    const meta = INTEREST_MAP.get(interestId);
    if (!meta?.relatedTags) continue;
    const relatedMatch = meta.relatedTags.filter((rt) =>
      productTags.includes(rt)
    ).length;
    score += relatedMatch * 5;
  }

  // Handmade bonus (quality signal)
  const handmadeCount = shop.products.filter((p) => p.isHandmade).length;
  score += handmadeCount * 3;

  return score;
}

export function interestMatchesProduct(
  product: PlanShopData["products"][number],
  interests: UserPreferences["interests"]
): boolean {
  for (const interestId of interests) {
    const meta = INTEREST_MAP.get(interestId);
    if (!meta) continue;
    if (
      product.tags.some(
        (t) =>
          t === interestId || (meta.relatedTags ?? []).includes(t)
      )
    ) {
      return true;
    }
  }
  return false;
}

export function injectShoppingBlocks(
  days: PlanDay[],
  data: PlanShopData[],
  prefs: UserPreferences
): PlanDay[] {
  if (data.length === 0) return days;

  const result = days.map((d) => ({ ...d }));

  // Determine which days get shopping suggestions
  const hasShopping = prefs.interests.includes("shopping");
  const shoppingDayIndices = hasShopping
    ? result.map((_, i) => i).slice(1) // any day after arrival
    : result.map((_, i) => i).slice(-2); // last 2 days only

  if (shoppingDayIndices.length === 0) return result;

  // Score and pick top 3 shops
  const scoredShops = data
    .map((s) => ({ ...s, _score: scoreShop(s, prefs) }))
    .sort((a, b) => b._score - a._score)
    .slice(0, 3);

  // Distribute shops across shopping days (1-2 per day)
  scoredShops.forEach((shop, i) => {
    const targetDayIdx = shoppingDayIndices[i % shoppingDayIndices.length];
    const day = result[targetDayIdx];
    if (!day) return;

    const topProducts = shop.products
      .filter((p) => interestMatchesProduct(p, prefs.interests))
      .slice(0, 3)
      .map((p) => ({
        productId: p.id,
        productSlug: p.slug,
        productName: p.name,
        price: p.price,
        imageUrl: p.imageUrl,
      }));

    const suggestion: PlanShopSuggestion = {
      shopId: shop.id,
      shopSlug: shop.slug,
      shopName: shop.name,
      category: shop.category,
      imageUrl: shop.imageUrl,
      note: SHOP_NOTES[shop.category] ?? "Discover local artisan products",
      products: topProducts,
    };

    if (!day.shopping) {
      result[targetDayIdx] = {
        ...day,
        shopping: { shops: [suggestion] },
      };
    } else {
      result[targetDayIdx] = {
        ...day,
        shopping: {
          shops: [...(day.shopping?.shops ?? []), suggestion],
        },
      };
    }
  });

  return result;
}
