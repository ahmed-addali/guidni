"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RequestCard } from "./RequestCard";
import { InboxIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanRequestStatus } from "@prisma/client";

type Request = {
  id:              string;
  requestRef:      string;
  message:         string;
  duration:        number;
  budget:          number;
  groupSize:       number;
  interests:       string[];
  startDate:       string | null;
  status:          PlanRequestStatus;
  quotePrice:      number | null;
  quoteNote:       string | null;
  estimatedBudget: number | null;
  changesNote:     string | null;
  declineNote:     string | null;
  createdAt:       Date;
  user:            { id: string; name: string | null; email: string | null; image: string | null };
  resultPlan:      { id: string; title: string | null } | null;
};

const TABS = [
  { id: "active",    label: "Active",   statuses: ["PENDING", "QUOTE_SENT", "CONFIRMED", "IN_PROGRESS", "DELIVERED", "CHANGES_REQUESTED"] as PlanRequestStatus[] },
  { id: "completed", label: "Completed", statuses: ["COMPLETED"] as PlanRequestStatus[] },
  { id: "closed",    label: "Closed",    statuses: ["DECLINED", "CANCELLED"] as PlanRequestStatus[] },
];

type GuidePlan = { id: string; title: string | null; duration: number; city: string | null };
type Destination = { id: string; city: string; country: string };

interface Props {
  requests:             Request[];
  locale:               string;
  plans:                GuidePlan[];
  destinations:         Destination[];
  defaultDestinationId?: string;
}

export function RequestsClient({ requests, locale, plans, destinations, defaultDestinationId }: Props) {
  const router                    = useRouter();
  const [tab, setTab]             = useState("active");
  const [version, setVersion]     = useState(0);
  const [, startRefresh]          = useTransition();

  const activeTab = TABS.find((t) => t.id === tab)!;
  const filtered  = requests.filter((r) => activeTab.statuses.includes(r.status));

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-100">
        {TABS.map((t) => {
          const count = requests.filter((r) => t.statuses.includes(r.status)).length;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                tab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              {t.label}
              {count > 0 && (
                <span className={cn(
                  "ml-1.5 text-xs rounded-full px-1.5 py-0.5",
                  tab === t.id ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Pending nudge */}
      {tab === "active" && pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          You have <strong>{pendingCount}</strong> new request{pendingCount !== 1 ? "s" : ""} awaiting your response.
        </div>
      )}

      {/* Request list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <InboxIcon className="h-8 w-8 text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium text-sm">No requests here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((req) => (
            <RequestCard
              key={`${req.id}-${version}`}
              request={req}
              locale={locale}
              plans={plans}
              destinations={destinations}
              defaultDestinationId={defaultDestinationId}
              onUpdate={() => {
                setVersion((v) => v + 1);
                startRefresh(() => router.refresh());
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
