import { SHOP_CATEGORY_TO_INTERESTS } from "./category-map";
import { INTEREST_MAP } from "./interests";
import type {
  LogisticsType,
  PlanBlock,
  PlanItinerary,
  PlanMultiDayBlock,
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

let logisticsIdCounter = 0;
function nextLogisticsId(): string {
  return `logistics-${++logisticsIdCounter}`;
}

function makeLogisticsBlock(
  item: PlanBlock["item"],
  logisticsType: LogisticsType,
  note: string
): PlanBlock {
  return {
    id: nextLogisticsId(),
    item,
    logisticsType,
    guideNote: note,
  };
}

export function injectLogistics(
  itin: PlanItinerary,
  data: PlannerData,
  prefs: UserPreferences
): PlanItinerary {
  const days = itin.days.map((d) => ({ ...d, blocks: [...d.blocks] }));
  const rentals: PlanMultiDayBlock[] = [...itin.rentals];

  // Find best airport transfer
  const airportTransfer = data.transfers
    .filter((t) => t.transferType === "AIRPORT_TRANSFER")
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0];

  // Find best city taxi
  const cityTaxi = data.transfers
    .filter((t) => t.transferType === "TAXI")
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0];

  const transferItem = airportTransfer ?? cityTaxi ?? data.transfers[0];

  // Rule 1 — Airport pickup on arrival (Day 1, prepended)
  if (prefs.needsAirportPickup && transferItem && days.length > 0) {
    const note =
      ARRIVAL_NOTES[transferItem.transferType ?? "AIRPORT_TRANSFER"] ??
      ARRIVAL_NOTES["AIRPORT_TRANSFER"];
    days[0] = {
      ...days[0],
      blocks: [
        makeLogisticsBlock(transferItem, "ARRIVAL_TRANSFER", note),
        ...days[0].blocks,
      ],
    };
  }

  // Rule 2 — Return transfer on last day (appended)
  if (prefs.needsReturnTransfer && transferItem && days.length > 0) {
    const lastIdx = days.length - 1;
    const note =
      DEPARTURE_NOTES[transferItem.transferType ?? "AIRPORT_TRANSFER"] ??
      DEPARTURE_NOTES["AIRPORT_TRANSFER"];
    days[lastIdx] = {
      ...days[lastIdx],
      blocks: [
        ...days[lastIdx].blocks,
        makeLogisticsBlock(transferItem, "DEPARTURE_TRANSFER", note),
      ],
    };
  }

  // Rule 3 — Rental: trip-level block + pickup/dropoff day markers
  if (prefs.needsRental && data.rentals.length > 0 && days.length >= 2) {
    const rentalType = prefs.rentalType ?? "car";
    const rentalItem =
      data.rentals.find((r) => r.tags.includes(rentalType)) ?? data.rentals[0];

    if (rentalItem) {
      const pickupDayIdx = 1; // Day 2 (0-indexed)
      const dropoffDayIdx =
        days.length > 2 ? days.length - 2 : pickupDayIdx;

      // Pickup day block
      const pickupNote = `Pick up your ${rentalType} rental and explore the destination at your own pace.`;
      days[pickupDayIdx] = {
        ...days[pickupDayIdx],
        blocks: [
          makeLogisticsBlock(rentalItem, "RENTAL_PICKUP", pickupNote),
          ...days[pickupDayIdx].blocks,
        ],
      };

      // Dropoff day block (only if different day from pickup)
      if (dropoffDayIdx !== pickupDayIdx) {
        const dropoffNote = `Return your ${rentalType} rental by the agreed time. Check for any damage with the partner.`;
        days[dropoffDayIdx] = {
          ...days[dropoffDayIdx],
          blocks: [
            ...days[dropoffDayIdx].blocks,
            makeLogisticsBlock(rentalItem, "RENTAL_DROPOFF", dropoffNote),
          ],
        };
      }

      // Trip-level rental block — spans full trip so cost = price × duration
      const rentalBlock: PlanMultiDayBlock = {
        id: `rental-auto-${rentalItem.id}`,
        item: rentalItem,
        fromDay: 1,
        toDay: days.length,
        note: `${rentalType.charAt(0).toUpperCase() + rentalType.slice(1)} rental — included in your itinerary.`,
      };
      rentals.push(rentalBlock);
    }
  }

  // Rule 4 — Auto-select stay from DB based on accommodationType preference
  const stays: PlanMultiDayBlock[] = [...itin.stays];
  if (stays.length === 0 && data.stays.length > 0 && days.length > 0) {
    const ACCOMMODATION_TO_CATEGORIES: Record<string, string[]> = {
      hotel:     ["hotels", "luxury", "beach_resorts"],
      riad:      ["guest_houses", "bnb", "cottages"],
      apartment: ["apartments", "vacation_rentals"],
      hostel:    ["bnb", "guest_houses", "hotels"],
    };
    const preferredCategories =
      ACCOMMODATION_TO_CATEGORIES[prefs.accommodationType] ?? ["hotels"];

    // Find best-rated stay matching preferred categories; fall back to any stay
    const matchedStay =
      data.stays.find((s) =>
        s.tags.some((tag) => preferredCategories.includes(tag))
      ) ?? data.stays[0];

    if (matchedStay) {
      stays.push({
        id:      `stay-auto-${matchedStay.id}`,
        item:    matchedStay,
        fromDay: 1,
        toDay:   days.length,
        note:    `${prefs.accommodationType.charAt(0).toUpperCase() + prefs.accommodationType.slice(1)} recommended for your stay.`,
      });
    }
  }

  return { days, stays, rentals };
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
  itin: PlanItinerary,
  data: PlanShopData[],
  prefs: UserPreferences
): PlanItinerary {
  if (data.length === 0) return itin;

  const days = itin.days.map((d) => ({ ...d }));

  // Determine which days get shopping suggestions
  const hasShopping = prefs.interests.includes("shopping");
  const shoppingDayIndices = hasShopping
    ? days.map((_, i) => i).slice(1) // any day after arrival
    : days.map((_, i) => i).slice(-2); // last 2 days only

  if (shoppingDayIndices.length === 0) return { ...itin, days };

  // Score and pick top 3 shops
  const scoredShops = data
    .map((s) => ({ ...s, _score: scoreShop(s, prefs) }))
    .sort((a, b) => b._score - a._score)
    .slice(0, 3);

  // Distribute shops across shopping days (1-2 per day)
  scoredShops.forEach((shop, i) => {
    const targetDayIdx = shoppingDayIndices[i % shoppingDayIndices.length];
    const day = days[targetDayIdx];
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

    days[targetDayIdx] = {
      ...day,
      shopping: {
        shops: [...(day.shopping?.shops ?? []), suggestion],
      },
    };
  });

  return { ...itin, days };
}
