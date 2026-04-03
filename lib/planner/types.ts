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
  | "STAY";

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

export type TimeSlot = "morning" | "lunch" | "afternoon" | "evening";

export type TimeRange = {
  start: string;  // "HH:MM"
  end: string;
};

// ─── Plan Day Structure ───────────────────────────────────────

export type PlanSlot = {
  id: string;                // unique slot id — used as drag-drop key
  slotType: TimeSlot;
  time: TimeRange;
  item: PlanItem;
  guideNote?: string;        // local expert annotation — visible on guide plans
};

export type LogisticsType =
  | "ARRIVAL_TRANSFER"
  | "DEPARTURE_TRANSFER"
  | "RENTAL_PICKUP"
  | "RENTAL_DROPOFF"
  | "CITY_TRANSFER";

export type PlanLogisticsBlock = {
  type: LogisticsType;
  item: PlanItem;
  note: string;
};

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

export type PlanDay = {
  dayNumber: number;
  date?: string;             // ISO date string
  theme: string;             // e.g. "Culture & History"
  notes: string;             // practical tips
  logistics?: PlanLogisticsBlock;
  slots: PlanSlot[];
  shopping?: PlanShoppingBlock;
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
