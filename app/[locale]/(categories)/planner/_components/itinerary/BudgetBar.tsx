"use client";

import { useTranslations } from "next-intl";
import type { BudgetBreakdown } from "@/lib/planner/types";

type Props = {
  budget: BudgetBreakdown;
};

export function BudgetBar({ budget }: Props) {
  const t = useTranslations("PlanItinerary");
  const currency = "TND";

  const TYPE_COLORS: Record<string, { bar: string; label: string }> = {
    ACTIVITY:   { bar: "bg-primary",    label: t("typeActivity") },
    ATTRACTION: { bar: "bg-amber-500",  label: t("typeAttraction") },
    RESTAURANT: { bar: "bg-green-500",  label: t("typeRestaurant") },
    TRANSFER:   { bar: "bg-blue-500",   label: t("typeTransfer") },
    RENTAL:     { bar: "bg-purple-500", label: t("typeRental") },
    STAY:       { bar: "bg-orange-500", label: t("typeStay") },
  };

  const entries = Object.entries(budget.byType).filter(([, v]) => v > 0);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-sm font-semibold text-gray-900">{t("estimatedTotal")}</span>
          {budget.isOverBudget && (
            <span className="ml-2 text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              {t("overBudget")}
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">
            {currency} {budget.total.toLocaleString()}
          </p>
          {budget.perPerson !== budget.total && (
            <p className="text-xs text-gray-400">
              ~{currency} {budget.perPerson.toLocaleString()} {t("perPerson")}
            </p>
          )}
        </div>
      </div>

      {entries.length > 0 && (
        <div className="h-2.5 rounded-full overflow-hidden flex mb-3 bg-gray-100">
          {entries.map(([type, amount]) => {
            const pct = (amount / budget.total) * 100;
            const color = TYPE_COLORS[type]?.bar ?? "bg-gray-400";
            return <div key={type} className={`${color} h-full`} style={{ width: `${pct}%` }} />;
          })}
        </div>
      )}

      {entries.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {entries.map(([type, amount]) => {
            const info = TYPE_COLORS[type];
            if (!info) return null;
            return (
              <div key={type} className="flex items-center gap-1.5">
                <div className={`h-2 w-2 rounded-full ${info.bar} shrink-0`} />
                <span className="text-xs text-gray-500">
                  {info.label}{" "}
                  <span className="font-medium text-gray-700">{currency} {amount.toLocaleString()}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {entries.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-1">{t("budgetEmpty")}</p>
      )}
    </div>
  );
}
