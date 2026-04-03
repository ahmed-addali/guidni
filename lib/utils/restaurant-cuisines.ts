// ─── Cuisine taxonomy ─────────────────────────────────────────────────────────
// Partners select from these lists when creating a restaurant.
// Filters on the listing page use these values.
//
// Three separated dimensions (don't mix):
//   RESTAURANT_CUISINES — origin-based (where the food is from)
//   FOOD_TYPES          — what kind of food/format (NOT where it's from)
//   DIET_TYPES          — dietary restrictions/preferences
//
// Schema fields:
//   category  String?    → stores a single CUISINE value (existing)
//   foodTypes String[]   → stores FOOD_TYPE values (Phase 13e.8 — migration pending)
//   dietTypes String[]   → stores DIET_TYPE values (Phase 13e.8 — migration pending)

// ─── Cuisines (origin-based) ──────────────────────────────────────────────────

export const RESTAURANT_CUISINES = [
  // North Africa
  { value: "tunisian",      label: "Tunisian" },
  { value: "moroccan",      label: "Moroccan" },
  { value: "north_african", label: "North African" },

  // Middle East
  { value: "middle_eastern", label: "Middle Eastern" },
  { value: "lebanese",       label: "Lebanese" },
  { value: "syrian",         label: "Syrian" },
  { value: "turkish",        label: "Turkish" },

  // Mediterranean
  { value: "mediterranean",  label: "Mediterranean" },
  { value: "greek",          label: "Greek" },

  // Europe
  { value: "italian",        label: "Italian" },
  { value: "french",         label: "French" },
  { value: "spanish",        label: "Spanish" },

  // Americas
  { value: "american",       label: "American" },
  { value: "mexican",        label: "Mexican" },

  // Asia
  { value: "asian",          label: "Asian" },
  { value: "japanese",       label: "Japanese" },
  { value: "chinese",        label: "Chinese" },
  { value: "indian",         label: "Indian" },
  { value: "thai",           label: "Thai" },

  // Catch-all
  { value: "international",  label: "International" },
] as const;

export type CuisineValue = typeof RESTAURANT_CUISINES[number]["value"];

// ─── Food types (what kind of food/format) ────────────────────────────────────
// Requires `foodTypes String[]` field on Restaurant model (Phase 13e.8).

export const FOOD_TYPES = [
  { value: "seafood",     label: "Seafood" },
  { value: "grill",       label: "Grill & BBQ" },
  { value: "pizza",       label: "Pizza" },
  { value: "burgers",     label: "Burgers" },
  { value: "street_food", label: "Street Food" },
  { value: "fast_food",   label: "Fast Food" },
  { value: "bakery",      label: "Bakery & Pastries" },
  { value: "cafe",        label: "Café & Coffee" },
] as const;

export type FoodTypeValue = typeof FOOD_TYPES[number]["value"];

// ─── Diet types (restrictions / preferences) ──────────────────────────────────
// Requires `dietTypes String[]` field on Restaurant model (Phase 13e.8).

export const DIET_TYPES = [
  { value: "halal",       label: "Halal" },
  { value: "vegetarian",  label: "Vegetarian" },
  { value: "vegan",       label: "Vegan" },
] as const;

export type DietTypeValue = typeof DIET_TYPES[number]["value"];

// ─── Attributes (ambiance, features, facilities) ──────────────────────────────
// Requires `attributes String[]` field on Restaurant model.

export const RESTAURANT_ATTRIBUTES = [
  // Ambiance
  { value: "romantic",       label: "Romantic atmosphere" },
  { value: "cosy",           label: "Cosy & intimate" },
  { value: "quiet",          label: "Quiet & peaceful" },
  { value: "live_music",     label: "Live music" },
  // View & Outdoor
  { value: "sea_view",       label: "Sea view" },
  { value: "panoramic_view", label: "Panoramic view" },
  { value: "rooftop",        label: "Rooftop terrace" },
  { value: "terrace",        label: "Outdoor terrace" },
  // Family & Kids
  { value: "family_friendly", label: "Family friendly" },
  { value: "children_menu",   label: "Children's menu" },
  { value: "baby_space",      label: "Baby/stroller friendly" },
  // Social & Fun
  { value: "board_games",    label: "Board games & card games" },
  { value: "sports_screen",  label: "Sports screening" },
  // Practical
  { value: "wifi",           label: "Free WiFi" },
  { value: "air_conditioned", label: "Air conditioned" },
  { value: "parking",        label: "Parking available" },
  { value: "pet_friendly",   label: "Pet friendly" },
  { value: "private_dining", label: "Private dining room" },
] as const;

export type AttributeValue = typeof RESTAURANT_ATTRIBUTES[number]["value"];

// ─── Attribute groups (for grouped display in partner forms) ──────────────────

export const ATTRIBUTE_GROUPS = [
  {
    label: "Ambiance",
    values: ["romantic", "cosy", "quiet", "live_music"],
  },
  {
    label: "View & Outdoor",
    values: ["sea_view", "panoramic_view", "rooftop", "terrace"],
  },
  {
    label: "Family & Kids",
    values: ["family_friendly", "children_menu", "baby_space"],
  },
  {
    label: "Social & Fun",
    values: ["board_games", "sports_screen"],
  },
  {
    label: "Practical",
    values: ["wifi", "air_conditioned", "parking", "pet_friendly", "private_dining"],
  },
] as const;

// ─── Intent → attributes mapping (OR logic — any match counts) ────────────────
// Used by RestaurantIntentTabs to pre-fill the ?attributes= param.

export const INTENT_ATTRIBUTES: Partial<Record<string, string[]>> = {
  work:    ["wifi"],
  date:    ["romantic"],
  cosy:    ["cosy"],
  scenic:  ["sea_view", "panoramic_view", "rooftop"],
  family:  ["family_friendly", "children_menu", "baby_space"],
  hangout: ["board_games"],
  night:   ["live_music"],
};

// ─── Cuisine hierarchy ────────────────────────────────────────────────────────
// Bidirectional: selecting "Syrian" also shows "Middle Eastern" restaurants,
// and selecting "Middle Eastern" also shows Syrian/Lebanese restaurants.
// Used in page.tsx to expand the cuisine filter set.

const CUISINE_PARENTS: Partial<Record<CuisineValue, CuisineValue[]>> = {
  tunisian:   ["north_african"],
  moroccan:   ["north_african"],
  lebanese:   ["middle_eastern"],
  syrian:     ["middle_eastern"],
  greek:      ["mediterranean"],
  japanese:   ["asian"],
  chinese:    ["asian"],
  indian:     ["asian"],
  thai:       ["asian"],
};

const CUISINE_CHILDREN: Partial<Record<CuisineValue, CuisineValue[]>> = {
  north_african:  ["tunisian",  "moroccan"],
  middle_eastern: ["lebanese",  "syrian"],
  mediterranean:  ["greek"],
  asian:          ["japanese",  "chinese", "indian", "thai"],
};

/**
 * Expand a list of selected cuisine values bidirectionally through the hierarchy.
 * e.g. ["syrian"] → Set { "syrian", "middle_eastern", "lebanese" }
 * e.g. ["middle_eastern"] → Set { "middle_eastern", "lebanese", "syrian" }
 */
export function expandCuisines(selected: string[]): Set<string> {
  const expanded = new Set<string>();
  for (const raw of selected) {
    const c = raw.toLowerCase() as CuisineValue;
    expanded.add(c);
    (CUISINE_PARENTS[c] ?? []).forEach((p) => expanded.add(p));
    (CUISINE_CHILDREN[c] ?? []).forEach((child) => expanded.add(child));
  }
  return expanded;
}
