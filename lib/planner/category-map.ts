import type { InterestId, BudgetLevel } from "./types";

// ─── Budget thresholds (max activity price per level) ─────────
export const BUDGET_THRESHOLDS: Record<BudgetLevel, number> = {
  1: 50,   // budget
  2: 150,  // mid-range
  3: 500,  // luxury
};

// ─── Daily budget caps (total spend per day) ─────────────────
export const DAILY_BUDGET_CAPS: Record<BudgetLevel, number> = {
  1: 150,
  2: 400,
  3: 1000,
};

// ─── Time slots ───────────────────────────────────────────────
export const TIME_SLOT_RANGES = {
  morning:   { start: "09:00", end: "12:00" },
  lunch:     { start: "12:30", end: "14:00" },
  afternoon: { start: "14:30", end: "17:30" },
  evening:   { start: "19:00", end: "22:00" },
} as const;

// ─── Activity category → interest IDs ────────────────────────
export const ACTIVITY_CATEGORY_TO_INTERESTS: Record<string, InterestId[]> = {
  water_sports:   ["water_sports", "adventures"],
  beach:          ["water_sports", "nature_wildlife"],
  diving:         ["water_sports", "nature_wildlife"],
  adventure:      ["adventures"],
  extreme:        ["adventures"],
  culture:        ["culture", "attractions"],
  historical:     ["culture", "sightseeing"],
  museum:         ["culture", "workshops"],
  traditional:    ["culture", "workshops"],
  food:           ["food_drink", "workshops"],
  cooking:        ["food_drink", "workshops"],
  food_tour:      ["food_drink", "sightseeing"],
  nature:         ["nature_wildlife"],
  eco:            ["nature_wildlife"],
  wildlife:       ["nature_wildlife"],
  tours:          ["sightseeing", "trips"],
  guided:         ["sightseeing", "trips"],
  excursion:      ["trips"],
  boat:           ["trips", "water_sports"],
  wellness:       ["wellness"],
  spa:            ["wellness"],
  yoga:           ["wellness"],
  crafts:         ["workshops", "shopping"],
  pottery:        ["workshops", "culture"],
  workshop:       ["workshops"],
  market:         ["shopping", "food_drink", "culture"],
  shopping:       ["shopping"],
  family:         ["family_friendly"],
  kids:           ["family_friendly"],
  festival:       ["events"],
  entertainment:  ["events"],
  nightlife:      ["events"],
};

// ─── Restaurant attribute → interest IDs ─────────────────────
export const RESTAURANT_ATTRIBUTE_TO_INTERESTS: Record<string, InterestId[]> = {
  romantic:        ["food_drink", "wellness"],
  cosy:            ["food_drink", "wellness"],
  quiet:           ["wellness"],
  live_music:      ["events", "food_drink"],
  sea_view:        ["nature_wildlife", "food_drink"],
  panoramic_view:  ["sightseeing", "food_drink"],
  rooftop:         ["sightseeing", "food_drink"],
  terrace:         ["nature_wildlife", "food_drink"],
  family_friendly: ["family_friendly", "food_drink"],
  children_menu:   ["family_friendly"],
  baby_space:      ["family_friendly"],
  board_games:     ["events", "family_friendly"],
  sports_screen:   ["events"],
  wifi:            [],
  air_conditioned: [],
  parking:         [],
  pet_friendly:    ["nature_wildlife"],
  private_dining:  ["wellness", "food_drink"],
};

// ─── Attraction category → interest IDs ──────────────────────
export const ATTRACTION_CATEGORY_TO_INTERESTS: Record<string, InterestId[]> = {
  historical:  ["culture", "attractions", "sightseeing"],
  religious:   ["culture", "attractions"],
  museum:      ["culture", "workshops"],
  nature:      ["nature_wildlife", "attractions"],
  viewpoint:   ["sightseeing", "nature_wildlife"],
  beach:       ["water_sports", "nature_wildlife"],
  market:      ["shopping", "food_drink", "culture"],
  souk:        ["shopping", "culture"],
  park:        ["family_friendly", "nature_wildlife"],
  landmark:    ["attractions", "sightseeing"],
  island:      ["trips", "nature_wildlife"],
};

// ─── Shop category → interest IDs ────────────────────────────
export const SHOP_CATEGORY_TO_INTERESTS: Record<string, InterestId[]> = {
  crafts:      ["shopping", "culture", "workshops"],
  textiles:    ["shopping", "culture"],
  jewelry:     ["shopping", "culture"],
  ceramics:    ["shopping", "culture", "workshops"],
  food_local:  ["shopping", "food_drink"],
  spices:      ["shopping", "food_drink"],
  leather:     ["shopping"],
  clothing:    ["shopping", "culture"],
  wellness:    ["shopping", "wellness"],
  souvenirs:   ["shopping", "attractions"],
};

// ─── Transfer type → tags (for scoring/injection) ────────────
export const TRANSFER_TYPE_TAGS: Record<string, string[]> = {
  AIRPORT_TRANSFER: ["airport", "transfer", "arrival", "departure"],
  TAXI:             ["taxi", "city", "transport"],
  CHAUFFEUR:        ["chauffeur", "luxury", "private", "transport"],
  SHUTTLE:          ["shuttle", "group", "transport"],
};

// ─── Rental category → tags ───────────────────────────────────
export const RENTAL_CATEGORY_TAGS: Record<string, string[]> = {
  car:      ["car", "rental", "independent", "road-trip"],
  bike:     ["bike", "rental", "beach", "active"],
  scooter:  ["scooter", "rental", "city", "active"],
  boat:     ["boat", "rental", "water", "sea"],
  jet_ski:  ["jet_ski", "rental", "water", "adventure"],
};

// ─── Group size map ───────────────────────────────────────────
export const GROUP_SIZE: Record<string, number> = {
  solo:    1,
  couple:  2,
  family:  4,
  friends: 3,
};
