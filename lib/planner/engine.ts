import { addDays, format, parseISO } from "date-fns";
import { INTEREST_MAP } from "./interests";
import {
  BUDGET_THRESHOLDS,
  RESTAURANT_ATTRIBUTE_TO_INTERESTS,
  TIME_SLOT_RANGES,
} from "./category-map";
import type {
  PlanDay,
  PlanItem,
  PlannerData,
  PlanSlot,
  TimeSlot,
  UserPreferences,
} from "./types";

// ─────────────────────────────────────────────────────────────
// Scoring
// ─────────────────────────────────────────────────────────────

/** Score any PlanItem against user preferences. Returns 0–∞. */
export function scoreItem(item: PlanItem, prefs: UserPreferences): number {
  let score = 0;

  // 1. Direct interest tag match
  for (const tag of item.tags) {
    if (prefs.interests.includes(tag as never)) score += 30;
  }

  // 2. Related tag match via interest metadata
  for (const interestId of prefs.interests) {
    const meta = INTEREST_MAP.get(interestId);
    if (!meta?.relatedTags) continue;
    for (const rt of meta.relatedTags) {
      if (item.tags.includes(rt)) score += 15;
    }
  }

  // 3. Budget alignment
  const threshold = BUDGET_THRESHOLDS[prefs.budget];
  if (item.price === 0) {
    score += 10; // free items always score positively
  } else if (item.price <= threshold) {
    score += 20;
  } else if (item.price <= threshold * 1.3) {
    score += 5;
  } else {
    score -= 20;
  }

  // 4. Intensity × travel style
  const intensityMap = { low: 1, medium: 2, high: 3 };
  const styleMap = { relaxed: 1, balanced: 2, active: 3 };
  const itemIntensity = intensityMap[item.intensity ?? "medium"];
  const targetIntensity = styleMap[prefs.travelStyle];
  const diff = Math.abs(itemIntensity - targetIntensity);
  score += (3 - diff) * 10; // max +30, min +10

  // 5. Group type compatibility
  if (prefs.groupType === "family" && item.familyFriendly) score += 25;
  if (prefs.groupType === "couple" && item.intensity === "low") score += 10;
  if (
    prefs.groupType === "couple" &&
    item.tags.some((t) => ["romantic", "sea_view", "rooftop"].includes(t))
  )
    score += 20;
  if (
    prefs.groupType === "friends" &&
    (item.intensity === "high" || item.intensity === "medium")
  )
    score += 8;

  // 6. Popularity proxy
  score += Math.min((item.nbReviews ?? 0) * 0.5, 15);
  if (item.rating) score += item.rating * 3; // 0–5 scale → max +15

  return Math.round(Math.max(0, score));
}

/** Extended scoring for restaurants — adds meal + attribute bonuses. */
export function scoreRestaurant(
  item: PlanItem,
  prefs: UserPreferences,
  slot: "lunch" | "evening"
): number {
  let score = scoreItem(item, prefs);

  // Meal compatibility
  const meals = item.meals ?? [];
  if (slot === "lunch" && meals.includes("Lunch")) score += 20;
  if (slot === "evening" && (meals.includes("Dinner") || meals.includes("All day")))
    score += 20;
  if (meals.includes("All day")) score += 5;

  // Attribute × interest match
  for (const attr of item.attributes ?? []) {
    const interestIds = RESTAURANT_ATTRIBUTE_TO_INTERESTS[attr] ?? [];
    const matches = interestIds.filter((id) =>
      prefs.interests.includes(id as never)
    ).length;
    score += matches * 15;
  }

  // Group-specific attribute bonus
  if (
    prefs.groupType === "couple" &&
    item.attributes?.includes("romantic")
  )
    score += 30;
  if (
    prefs.groupType === "family" &&
    item.attributes?.includes("family_friendly")
  )
    score += 25;
  if (
    prefs.groupType === "friends" &&
    item.attributes?.includes("live_music")
  )
    score += 20;

  return score;
}

// ─────────────────────────────────────────────────────────────
// Opening hours filter
// ─────────────────────────────────────────────────────────────

/** Filter restaurants by whether they're open at the given slot time. */
export function filterByOpeningHours(
  restaurants: PlanItem[],
  dayNumber: number,
  slot: "lunch" | "evening",
  startDate?: string
): PlanItem[] {
  if (!startDate) return restaurants; // can't filter without dates

  const date = addDays(parseISO(startDate), dayNumber - 1);
  const dayName = format(date, "EEEE"); // "Monday", "Tuesday", …
  const slotTime = slot === "lunch" ? "12:30" : "19:00";

  return restaurants.filter((r) => {
    const dayHours = r.hours?.find((h) => h.day === dayName);
    if (!dayHours) return true; // no data = assume open
    if (dayHours.isClosed) return false;
    if (dayHours.isFullDayOpening) return true;
    if (!dayHours.opening || !dayHours.closing) return true;
    return dayHours.opening <= slotTime && dayHours.closing >= slotTime;
  });
}

// ─────────────────────────────────────────────────────────────
// Day theme + notes
// ─────────────────────────────────────────────────────────────

const DAY_THEMES: Record<number, string[]> = {
  1: ["Arrival & First Impressions", "Settle In & Explore", "Arrival Day"],
  2: ["Culture & Heritage", "History & Discovery", "Art & Culture"],
  3: ["Adventure & Nature", "Beach & Active Day", "Outdoor Exploration"],
  4: ["Food & Local Life", "Culinary Journey", "Local Flavors"],
  5: ["Hidden Gems", "Off the Beaten Path", "Local Secrets"],
  6: ["Relaxed Day", "Slow Travel Day", "Unwind & Recharge"],
  7: ["Farewell & Memories", "Last Day Adventures", "Final Impressions"],
};

export function getDayTheme(
  dayNumber: number,
  totalDays: number,
  slots: PlanSlot[]
): string {
  // Last day
  if (dayNumber === totalDays && totalDays > 2) {
    return DAY_THEMES[7][0];
  }
  const themes = DAY_THEMES[Math.min(dayNumber, 6)] ?? DAY_THEMES[5];
  // Vary by slot types
  const hasBeach = slots.some((s) =>
    s.item.tags.some((t) => ["beach", "water_sports", "sea"].includes(t))
  );
  if (hasBeach && dayNumber > 1) return "Beach & Adventure";
  const hasCulture = slots.some((s) =>
    s.item.tags.some((t) =>
      ["culture", "history", "traditional", "museum", "religious"].includes(t)
    )
  );
  if (hasCulture) return themes[1] ?? themes[0];
  return themes[0];
}

export function getDayNotes(
  dayNumber: number,
  totalDays: number,
  prefs: UserPreferences
): string {
  const notes: string[] = [];

  if (dayNumber === 1) {
    notes.push("Check in to your accommodation and get settled before exploring.");
    if (prefs.travelStyle === "relaxed") {
      notes.push("Take it easy today — a gentle start makes for a better trip.");
    }
  }

  if (dayNumber === totalDays) {
    notes.push("Check-out time applies — confirm with your accommodation.");
    notes.push("Allow extra time for airport transfers on departure day.");
  }

  if (prefs.groupType === "family") {
    notes.push("Schedule breaks for children — aim for an early dinner.");
  }

  if (prefs.budget === 1) {
    notes.push("Look for local street food stalls for affordable lunch options.");
  } else if (prefs.budget === 3) {
    notes.push("Reserve top restaurants in advance — popular spots fill quickly.");
  }

  if (prefs.travelStyle === "relaxed" && dayNumber > 1) {
    notes.push("Leave some free time in the afternoon to wander without a plan.");
  }

  return notes.join(" ");
}

// ─────────────────────────────────────────────────────────────
// Slot builder
// ─────────────────────────────────────────────────────────────

let slotIdCounter = 0;
function nextSlotId(): string {
  return `slot-${++slotIdCounter}`;
}

interface SlotResult {
  slot: PlanSlot;
  usedId: string;
}

function buildSlot(
  item: PlanItem,
  slotType: TimeSlot,
  customTime?: { start: string; end: string }
): SlotResult {
  return {
    slot: {
      id: nextSlotId(),
      slotType,
      time: customTime ?? TIME_SLOT_RANGES[slotType],
      item,
    },
    usedId: item.id,
  };
}

// ─────────────────────────────────────────────────────────────
// Day builder
// ─────────────────────────────────────────────────────────────

function buildDay(
  dayNumber: number,
  totalDays: number,
  data: PlannerData,
  prefs: UserPreferences,
  used: Set<string>
): PlanDay {
  const slots: PlanSlot[] = [];

  const pick = (
    pool: PlanItem[],
    idealSlot?: TimeSlot
  ): PlanItem | null => {
    const candidates = pool.filter((i) => !used.has(i.id));
    if (candidates.length === 0) return null;

    if (idealSlot) {
      const slotMatch = candidates.find(
        (i) => i.idealTime === idealSlot || i.idealTime === "any"
      );
      if (slotMatch) {
        used.add(slotMatch.id);
        return slotMatch;
      }
    }
    used.add(candidates[0].id);
    return candidates[0];
  };

  // Pre-score and sort once
  const scoredActivities = data.activities
    .map((a) => ({ ...a, _score: scoreItem(a, prefs) }))
    .sort((a, b) => b._score - a._score);

  const scoredAttractions = data.attractions
    .map((a) => ({ ...a, _score: scoreItem(a, prefs) }))
    .sort((a, b) => b._score - a._score);

  const availableRestaurantsForLunch = filterByOpeningHours(
    data.restaurants,
    dayNumber,
    "lunch",
    prefs.startDate
  )
    .map((r) => ({ ...r, _score: scoreRestaurant(r, prefs, "lunch") }))
    .sort((a, b) => b._score - a._score);

  const availableRestaurantsForEvening = filterByOpeningHours(
    data.restaurants,
    dayNumber,
    "evening",
    prefs.startDate
  )
    .map((r) => ({ ...r, _score: scoreRestaurant(r, prefs, "evening") }))
    .sort((a, b) => b._score - a._score);

  // Max items per day based on travel style
  const maxItems =
    prefs.travelStyle === "relaxed" ? 3 : prefs.travelStyle === "active" ? 5 : 4;

  // ── MORNING: attraction or activity ──────────────────────────
  const morningPool = [
    ...scoredAttractions.filter((a) => !used.has(a.id)),
    ...scoredActivities.filter(
      (a) => !used.has(a.id) && a.idealTime !== "afternoon" && a.idealTime !== "evening"
    ),
  ];
  const morningItem = morningPool[0] ?? null;
  if (morningItem) {
    used.add(morningItem.id);
    slots.push(buildSlot(morningItem, "morning").slot);
  }

  // ── LUNCH: restaurant ─────────────────────────────────────────
  if (slots.length < maxItems) {
    const lunch = availableRestaurantsForLunch.find((r) => !used.has(r.id));
    if (lunch) {
      used.add(lunch.id);
      slots.push(buildSlot(lunch, "lunch").slot);
    }
  }

  // ── AFTERNOON: activity ───────────────────────────────────────
  if (slots.length < maxItems) {
    const afternoonPool = scoredActivities.filter((a) => {
      if (used.has(a.id)) return false;
      if (prefs.travelStyle === "relaxed" && a.intensity === "high") return false;
      return true;
    });
    const afternoon = afternoonPool[0] ?? null;
    if (afternoon) {
      used.add(afternoon.id);
      slots.push(buildSlot(afternoon, "afternoon").slot);
    }
  }

  // ── EVENING: restaurant ───────────────────────────────────────
  if (slots.length < maxItems) {
    const dinner = availableRestaurantsForEvening.find((r) => !used.has(r.id));
    if (dinner) {
      used.add(dinner.id);
      slots.push(buildSlot(dinner, "evening").slot);
    }
  }

  // ── EXTRA: active travelers get a 5th slot ────────────────────
  if (prefs.travelStyle === "active" && slots.length < 5) {
    const extra = scoredActivities.find(
      (a) => !used.has(a.id) && a.intensity !== "low"
    );
    if (extra) {
      used.add(extra.id);
      slots.push(
        buildSlot(extra, "afternoon", { start: "17:30", end: "19:00" }).slot
      );
    }
  }

  const theme = getDayTheme(dayNumber, totalDays, slots);
  const notes = getDayNotes(dayNumber, totalDays, prefs);

  return {
    dayNumber,
    date: prefs.startDate
      ? format(addDays(parseISO(prefs.startDate), dayNumber - 1), "yyyy-MM-dd")
      : undefined,
    theme,
    notes,
    slots,
  };
}

// ─────────────────────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────────────────────

/**
 * Build a full itinerary from live PlannerData + UserPreferences.
 * Returns PlanDay[] WITHOUT logistics or shopping blocks —
 * those are injected by logistics.ts after this call.
 */
export function buildItinerary(
  data: PlannerData,
  prefs: UserPreferences
): PlanDay[] {
  slotIdCounter = 0; // reset per generation
  const used = new Set<string>();
  const days: PlanDay[] = [];

  for (let day = 1; day <= prefs.duration; day++) {
    days.push(buildDay(day, prefs.duration, data, prefs, used));
  }

  return days;
}
