"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import type { BudgetBreakdown } from "@/lib/planner/types";

type Props = {
  budget:      BudgetBreakdown;
  duration?:   number;
  budgetLevel?: 1 | 2 | 3;
  groupType?:  string;
};

const BUDGET_LEVEL_LABELS: Record<number, string> = { 1: "Budget", 2: "Mid-range", 3: "Luxury" };
const BUDGET_LEVEL_CLASSES: Record<number, string> = {
  1: "bg-green-50 text-green-700 border-green-200",
  2: "bg-blue-50 text-blue-700 border-blue-200",
  3: "bg-amber-50 text-amber-700 border-amber-200",
};
const GROUP_SIZE: Record<string, number> = {
  solo: 1, couple: 2, family: 4, friends: 4,
};

export function BudgetBar({ budget, duration, budgetLevel, groupType }: Props) {
  const t = useTranslations("PlanItinerary");
  const currency = "TND";
  const [expanded, setExpanded] = useState(false);

  const perDay = duration && duration > 0 ? Math.round(budget.total / duration) : null;
  const groupSize = groupType ? GROUP_SIZE[groupType] ?? null : null;
  const groupLabel = groupType ? groupType.charAt(0).toUpperCase() + groupType.slice(1) : null;

  const TYPE_COLORS: Record<string, { bar: string; dot: string; label: string }> = {
    ACTIVITY:      { bar: "bg-primary",    dot: "bg-primary",    label: t("typeActivity")      },
    ATTRACTION:    { bar: "bg-amber-500",  dot: "bg-amber-500",  label: t("typeAttraction")    },
    RESTAURANT:    { bar: "bg-green-500",  dot: "bg-green-500",  label: t("typeRestaurant")    },
    TRANSPORT:     { bar: "bg-blue-500",   dot: "bg-blue-500",   label: t("typeTransport")     },
    ACCOMMODATION: { bar: "bg-orange-500", dot: "bg-orange-500", label: t("typeAccommodation") },
  };

  // Merge TRANSFER + RENTAL → TRANSPORT, STAY → ACCOMMODATION for display
  const mergedByType: Record<string, number> = {};
  for (const [type, amount] of Object.entries(budget.byType)) {
    if (amount <= 0) continue;
    if (type === "TRANSFER" || type === "RENTAL") {
      mergedByType["TRANSPORT"] = (mergedByType["TRANSPORT"] ?? 0) + amount;
    } else if (type === "STAY") {
      mergedByType["ACCOMMODATION"] = (mergedByType["ACCOMMODATION"] ?? 0) + amount;
    } else {
      mergedByType[type] = (mergedByType[type] ?? 0) + amount;
    }
  }

  const entries = Object.entries(mergedByType).filter(([, v]) => v > 0);
  const hasData = entries.length > 0;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 mb-4">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-900">{t("estimatedTotal")}</span>
          {budgetLevel && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${BUDGET_LEVEL_CLASSES[budgetLevel] ?? ""}`}>
              {BUDGET_LEVEL_LABELS[budgetLevel]}
            </span>
          )}
          {budget.isOverBudget && (
            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              {t("overBudget")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900">
              {currency} {budget.total.toLocaleString()}
            </p>
            <div className="flex items-center justify-end gap-2 flex-wrap">
              {perDay !== null && (
                <p className="text-xs text-gray-400">
                  ~{currency} {perDay.toLocaleString()}{t("perDay")}
                </p>
              )}
              {budget.perPerson !== budget.total && groupLabel && (
                <p className="text-xs text-gray-400">
                  {t("groupSize", { label: groupLabel })}
                </p>
              )}
            </div>
          </div>
          {hasData && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              aria-label={expanded ? "Hide breakdown" : "Show breakdown"}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Stacked bar */}
      {hasData && (
        <div className="h-2.5 rounded-full overflow-hidden flex mb-3 bg-gray-100">
          {entries.map(([type, amount]) => {
            const pct = (amount / budget.total) * 100;
            const color = TYPE_COLORS[type]?.bar ?? "bg-gray-400";
            return <div key={type} className={`${color} h-full`} style={{ width: `${pct}%` }} />;
          })}
        </div>
      )}

      {/* Legend */}
      {hasData && (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {entries.map(([type, amount]) => {
            const info = TYPE_COLORS[type];
            if (!info) return null;
            return (
              <div key={type} className="flex items-center gap-1.5">
                <div className={`h-2 w-2 rounded-full ${info.dot} shrink-0`} />
                <span className="text-xs text-gray-500">
                  {info.label}{" "}
                  <span className="font-medium text-gray-700">
                    {currency} {amount.toLocaleString()}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {!hasData && (
        <p className="text-xs text-gray-400 text-center py-1">{t("budgetEmpty")}</p>
      )}

      {/* Expanded: per-day breakdown */}
      {expanded && hasData && budget.byDay.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {t("budgetByDay")}
          </p>
          {budget.byDay.map((dayTotal, i) => {
            const pct = budget.total > 0 ? (dayTotal / budget.total) * 100 : 0;
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-12 shrink-0">
                  {t("dayLabel", { n: i + 1 })}
                </span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary/50 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-700 w-24 text-right shrink-0">
                  {currency} {dayTotal.toLocaleString()}
                </span>
              </div>
            );
          })}

          {/* Per-person total reminder */}
          {budget.perPerson !== budget.total && (
            <p className="text-xs text-gray-400 pt-2 border-t border-gray-50">
              {t("perPersonNote", { amount: `${currency} ${budget.perPerson.toLocaleString()}` })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
