import { DAILY_BUDGET_CAPS, GROUP_SIZE } from "./category-map";
import type { BudgetBreakdown, PlanItinerary, PlanDay, PlanItemType, UserPreferences } from "./types";

// Item types whose DB price is per-person (multiply by group size for total cost).
// TRANSFER is per-trip (covers whole group). STAY/RENTAL are per-room/per-vehicle.
const PER_PERSON_TYPES = new Set<PlanItemType>(["ACTIVITY", "ATTRACTION", "RESTAURANT"]);

export function computeBudget(
  itineraryOrDays: PlanItinerary | PlanDay[],
  prefs: UserPreferences
): BudgetBreakdown {
  // Handle both legacy PlanDay[] and new PlanItinerary
  const itin: PlanItinerary = Array.isArray(itineraryOrDays)
    ? { days: itineraryOrDays, stays: [], rentals: [] }
    : itineraryOrDays;

  const groupSize = GROUP_SIZE[prefs.groupType] ?? 2;
  const byType: Partial<Record<PlanItemType, number>> = {};
  const byDay: number[] = [];
  let total = 0;

  for (const day of itin.days) {
    let dayTotal = 0;

    for (const slot of day.blocks) {
      const type = slot.item.type;

      // Stays, rentals, and notes are handled at the trip level or have no cost
      if (type === "STAY" || type === "RENTAL" || type === "NOTE") continue;

      // Restaurants have no DB price — estimate per person from budget level
      const basePrice =
        type === "RESTAURANT"
          ? estimateRestaurantPrice(prefs.budget)
          : slot.item.price;

      // Per-person items scale with group size; per-trip items (transfers) do not
      const cost = PER_PERSON_TYPES.has(type) ? basePrice * groupSize : basePrice;

      byType[type] = (byType[type] ?? 0) + cost;
      dayTotal += cost;
    }

    byDay.push(dayTotal);
    total += dayTotal;
  }

  // Trip-level stays: price × nights (check-in day 1, check-out last day → duration-1 nights)
  for (const stay of itin.stays) {
    const nights = Math.max(0, stay.toDay - stay.fromDay);
    const cost = stay.item.price * nights;
    byType["STAY"] = (byType["STAY"] ?? 0) + cost;
    total += cost;
  }

  // Trip-level rentals: price × days (inclusive, fromDay to toDay)
  for (const rental of itin.rentals) {
    const rentalDays = Math.max(1, rental.toDay - rental.fromDay + 1);
    const cost = rental.item.price * rentalDays;
    byType["RENTAL"] = (byType["RENTAL"] ?? 0) + cost;
    total += cost;
  }

  const dailyCap = DAILY_BUDGET_CAPS[prefs.budget];
  const isOverBudget = total > dailyCap * itin.days.length;

  return {
    byType,
    byDay,
    total,
    perPerson: Math.round(total / groupSize),
    isOverBudget,
  };
}

/** Estimate restaurant spend per person based on budget level. */
function estimateRestaurantPrice(budget: 1 | 2 | 3): number {
  const estimates: Record<number, number> = { 1: 15, 2: 45, 3: 120 };
  return estimates[budget] ?? 45;
}

/** Format a budget value as a human-readable string. */
export function formatBudget(amount: number, currency = "TND"): string {
  return `${currency} ${amount.toLocaleString()}`;
}
