import { DAILY_BUDGET_CAPS, GROUP_SIZE } from "./category-map";
import type { BudgetBreakdown, PlanDay, PlanItemType, UserPreferences } from "./types";

export function computeBudget(
  days: PlanDay[],
  prefs: UserPreferences
): BudgetBreakdown {
  const groupSize = GROUP_SIZE[prefs.groupType] ?? 2;
  const byType: Partial<Record<PlanItemType, number>> = {};
  const byDay: number[] = [];
  let total = 0;

  for (const day of days) {
    let dayTotal = 0;

    // Logistics
    if (day.logistics) {
      const price = day.logistics.item.price;
      const type = day.logistics.item.type;
      byType[type] = (byType[type] ?? 0) + price;
      dayTotal += price;
    }

    // Slots
    for (const slot of day.slots) {
      const price = slot.item.price;
      const type = slot.item.type;

      // Restaurants have no fixed price — estimate from budget level
      const actualPrice =
        type === "RESTAURANT"
          ? estimateRestaurantPrice(prefs.budget)
          : price;

      byType[type] = (byType[type] ?? 0) + actualPrice;
      dayTotal += actualPrice;
    }

    byDay.push(dayTotal);
    total += dayTotal;
  }

  const dailyCap = DAILY_BUDGET_CAPS[prefs.budget];
  const isOverBudget = total > dailyCap * days.length;

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
