// ─────────────────────────────────────────────────────────────
// AI Planner — Core Type System
// ─────────────────────────────────────────────────────────────

// ─── Interest IDs ─────────────────────────────────────────────

export type InterestId =
  | "adventures"
  | "water_sports"
  | "culture"
  | "food_drink"
  | "nature_wildlife"
  | "attractions"
  | "sightseeing"
  | "workshops"
  | "wellness"
  | "shopping"
  | "family_friendly"
  | "events"
  | "trips";

// ─── User Preferences ─────────────────────────────────────────

export type TravelStyle = "relaxed" | "balanced" | "active";
export type BudgetLevel = 1 | 2 | 3;
export type GroupType = "solo" | "couple" | "family" | "friends";
export type AccommodationType = "hotel" | "riad" | "apartment" | "hostel";
export type RentalType = "car" | "bike" | "scooter";

export type UserPreferences = {
  destinationId: string;
  destinationName: string;   // e.g. "Djerba, Tunisia"
  destinationCity: string;

  startDate?: string;        // ISO date string — optional
  duration: number;          // 1–14 days

  travelStyle: TravelStyle;
  budget: BudgetLevel;       // 1=budget, 2=mid-range, 3=luxury
  groupType: GroupType;
  interests: InterestId[];
  accommodationType: AccommodationType;

  // Logistics
  needsAirportPickup: boolean;
  needsReturnTransfer: boolean;
  needsRental: boolean;
  rentalType?: RentalType;
};

// ─── Universal Plan Item ──────────────────────────────────────

export type PlanItemType =
  | "ACTIVITY"
  | "ATTRACTION"
  | "RESTAURANT"
  | "TRANSFER"
  | "RENTAL"
  | "STAY"
  | "NOTE";

export type PlanItem = {
  id: string;
  type: PlanItemType;
  slug: string;
  name: string;
  arabicName?: string;
  imageUrl?: string;
  location?: string;
  price: number;             // 0 if free
  priceLabel?: string;       // "per trip" | "per hour" | "per day" | "per person" | "free"
  durationMinutes?: number;
  intensity?: "low" | "medium" | "high";
  tags: string[];
  idealTime?: "morning" | "afternoon" | "evening" | "any" | "lunch";
  familyFriendly?: boolean;
  bookingUrl?: string;       // direct link to detail/booking page
  // Restaurant-specific
  meals?: string[];
  attributes?: string[];
  hours?: RestaurantHoursSlim[];
  // Transfer-specific
  transferType?: string;
  capacity?: number;
  isAC?: boolean;
  isMeetGreet?: boolean;
  isChildSeat?: boolean;
  // Popularity proxy
  nbReviews?: number;
  rating?: number;           // parsed from note field (0–5)
};

export type RestaurantHoursSlim = {
  day: string;
  opening: string | null;
  closing: string | null;
  isClosed: boolean;
  isFullDayOpening: boolean;
};

// ─── Time Slots ───────────────────────────────────────────────

export type TimeSlot = "morning" | "lunch" | "afternoon" | "evening" | "fullday" | "other";

export type TimeRange = {
  start: string;  // "HH:MM"
  end: string;
};

// ─── Logistics type ───────────────────────────────────────────

export type LogisticsType =
  | "ARRIVAL_TRANSFER"
  | "DEPARTURE_TRANSFER"
  | "RENTAL_PICKUP"
  | "RENTAL_DROPOFF"
  | "CITY_TRANSFER";

// ─── Plan Block ───────────────────────────────────────────────
//
// A block is any item a guide adds to a day — activity, restaurant,
// transfer, note, etc. Blocks are ordered by their position in the
// `blocks` array, NOT by time. Time is an optional display label.
//
// `PlanSlot` is kept as an alias for backwards compatibility with
// any code that hasn't been updated yet.

export type PlanBlock = {
  id:             string;          // stable id — array position = display order
  item:           PlanItem;        // NOTE type: item.name = note text, price = 0
  time?:          TimeRange;       // optional — display label only, NOT used for sort
  slotType?:      TimeSlot;        // derived from time.start if time is set
  logisticsType?: LogisticsType;   // set when item.type is TRANSFER or RENTAL
  guideNote?:     string;          // local expert annotation visible to buyer
  customTitle?:   string;          // guide override of platform name
  addedByGuide?:  boolean;
};

/** @deprecated use PlanBlock */
export type PlanSlot = PlanBlock;

// ─── Plan Day Structure ───────────────────────────────────────

export type PlanDay = {
  dayNumber: number;
  date?: string;             // ISO date string
  theme: string;             // e.g. "Culture & History"
  notes: string;             // practical tips shown above the block list
  blocks: PlanBlock[];       // all blocks in guide-defined order
  shopping?: PlanShoppingBlock;
};

// ─── Multi-Day Blocks (stays & rentals) ──────────────────────
//
// Stays and rentals span multiple days, so they live at the
// trip level rather than inside a single PlanDay.blocks array.

export type PlanMultiDayBlock = {
  id:      string;
  item:    PlanItem;          // type: STAY or RENTAL
  fromDay: number;            // 1-based day number
  toDay:   number;            // 1-based day number (inclusive end)
  note?:   string;            // guide annotation
};

// ─── Trip-Level Itinerary Wrapper ─────────────────────────────
//
// Replaces the bare PlanDay[] stored in Plan.itinerary (Json).
// parsePlanItinerary() handles the backward-compat migration.

export type PlanItinerary = {
  days:    PlanDay[];
  stays:   PlanMultiDayBlock[];
  rentals: PlanMultiDayBlock[];
};

/**
 * Parse Plan.itinerary (Json) into a PlanItinerary.
 * Handles legacy plans where itinerary was a bare PlanDay[].
 */
export function parsePlanItinerary(raw: unknown): PlanItinerary {
  if (Array.isArray(raw)) {
    return { days: raw as PlanDay[], stays: [], rentals: [] };
  }
  const obj = raw as Partial<PlanItinerary>;
  return {
    days:    obj.days    ?? [],
    stays:   obj.stays   ?? [],
    rentals: obj.rentals ?? [],
  };
}

// ─── Shopping ─────────────────────────────────────────────────

export type PlanProductSuggestion = {
  productId: string;
  productSlug: string;
  productName: string;
  price: number;
  imageUrl?: string;
};

export type PlanShopSuggestion = {
  shopId: string;
  shopSlug: string;
  shopName: string;
  category: string;
  imageUrl?: string;
  note: string;
  products: PlanProductSuggestion[];
};

export type PlanShoppingBlock = {
  shops: PlanShopSuggestion[];
};

// ─── Planner Data (from DB) ───────────────────────────────────

export type PlanShopData = {
  id: string;
  slug: string;
  name: string;
  category: string;
  imageUrl?: string;
  location?: string;
  products: {
    id: string;
    slug: string;
    name: string;
    price: number;
    imageUrl?: string;
    tags: string[];
    isHandmade: boolean;
  }[];
};

export type PlannerData = {
  activities: PlanItem[];
  attractions: PlanItem[];
  restaurants: PlanItem[];
  transfers: PlanItem[];
  rentals: PlanItem[];
  stays: PlanItem[];
  shops: PlanShopData[];
};

// ─── Budget ───────────────────────────────────────────────────

export type BudgetBreakdown = {
  byType: Partial<Record<PlanItemType, number>>;
  byDay: number[];
  total: number;
  perPerson: number;
  isOverBudget: boolean;
};

// ─── Interest Metadata ────────────────────────────────────────

export type InterestMeta = {
  id: InterestId;
  defaultIntensity: "low" | "medium" | "high";
  typicalBudget: BudgetLevel;
  relatedTags: string[];
  idealTime: "morning" | "afternoon" | "evening" | "any";
};
