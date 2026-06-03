"use client";

import { Map, LayoutList, Repeat2 } from "lucide-react";
import { useChatPlannerStore } from "@/stores/chatPlannerStore";
import { PlanView } from "./PlanView";
import { MapView } from "./MapView";
import { AlternativesList } from "./AlternativesList";

type Props = { userId: string };

const TABS = [
  { key: "plan" as const, label: "Plan", icon: LayoutList },
  { key: "map" as const, label: "Map", icon: Map },
  { key: "alternatives" as const, label: "Alternatives", icon: Repeat2 },
];

export function PlanPanel({ userId }: Props) {
  const { rightTab, setRightTab, alternatives } = useChatPlannerStore();

  return (
    <div className="flex flex-col h-full bg-gray-50/30">
      {/* Tab bar */}
      <div className="shrink-0 flex items-center gap-1 px-4 py-2 border-b border-gray-100 bg-white">
        {TABS.map((tab) => {
          const active = rightTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setRightTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.key === "alternatives" && alternatives.length > 0 && (
                <span className="h-4 min-w-4 px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                  {alternatives.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {rightTab === "plan" && <PlanView userId={userId} />}
        {rightTab === "map" && <MapView />}
        {rightTab === "alternatives" && <AlternativesList />}
      </div>
    </div>
  );
}
