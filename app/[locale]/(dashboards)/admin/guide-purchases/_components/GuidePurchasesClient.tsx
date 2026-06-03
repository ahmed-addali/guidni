"use client";

import { useState, useMemo } from "react";
import { FiSearch, FiDollarSign } from "react-icons/fi";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

type Purchase = {
  id: string;
  purchaseRef: string;
  amount: number;
  platformFee: number;
  guideEarns: number;
  createdAt: Date;
  plan: {
    id: string;
    title: string | null;
    duration: number;
    guide: { id: string; slug: string; displayName: string } | null;
    destination: { city: string } | null;
  };
  user: { name: string | null; email: string | null };
};

interface Props {
  purchases: Purchase[];
}

function formatTND(v: number) {
  return `TND ${v}`;
}

export function GuidePurchasesClient({ purchases }: Props) {
  const [query, setQuery]       = useState("");
  const [guideFilter, setGuide] = useState<string | null>(null);

  // Build unique guide list
  const guides = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of purchases) {
      if (p.plan.guide) map.set(p.plan.guide.id, p.plan.guide.displayName);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [purchases]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return purchases.filter((p) => {
      const matchGuide = guideFilter ? p.plan.guide?.id === guideFilter : true;
      const matchQ = !q || [
        p.purchaseRef,
        p.plan.title ?? "",
        p.plan.guide?.displayName ?? "",
        p.user.name ?? "",
        p.user.email ?? "",
      ].some((s) => s.toLowerCase().includes(q));
      return matchGuide && matchQ;
    });
  }, [purchases, query, guideFilter]);

  const totalRevenue = filtered.reduce((s, p) => s + p.amount, 0);
  const totalFees    = filtered.reduce((s, p) => s + p.platformFee, 0);
  const totalEarned  = filtered.reduce((s, p) => s + p.guideEarns, 0);

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Gross revenue",    value: formatTND(totalRevenue), color: "text-gray-900" },
          { label: "Platform fees",    value: formatTND(totalFees),    color: "text-amber-700" },
          { label: "Guide earnings",   value: formatTND(totalEarned),  color: "text-green-700" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-2xl px-5 py-4">
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className={cn("text-xl font-bold", color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by ref, plan, guide or buyer…"
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 w-72"
          />
        </div>

        <select
          value={guideFilter ?? ""}
          onChange={(e) => setGuide(e.target.value || null)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
        >
          <option value="">All guides</option>
          {guides.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>

        <span className="text-xs text-gray-400 ml-auto">
          {filtered.length} {filtered.length === 1 ? "purchase" : "purchases"}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FiDollarSign className="h-8 w-8 text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium text-sm">No purchases found</p>
          </div>
        ) : (
          <>
            <div className="hidden lg:grid grid-cols-[1fr_160px_120px_100px_100px_100px] gap-4 px-6 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              <span>Plan / Guide</span>
              <span>Buyer</span>
              <span>Ref</span>
              <span className="text-right">Gross</span>
              <span className="text-right">Fee</span>
              <span className="text-right">Earned</span>
            </div>
            <div className="divide-y divide-gray-50">
              {filtered.map((p) => (
                <div
                  key={p.id}
                  className="grid grid-cols-1 lg:grid-cols-[1fr_160px_120px_100px_100px_100px] gap-2 lg:gap-4 px-6 py-4 items-center"
                >
                  {/* Plan + guide */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {p.plan.title ?? `${p.plan.duration}-Day Plan`}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {p.plan.guide?.displayName ?? "—"}
                        {p.plan.destination ? ` · ${p.plan.destination.city}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Buyer */}
                  <p className="text-sm text-gray-600 truncate lg:block">
                    {p.user.name ?? p.user.email ?? "—"}
                  </p>

                  {/* Ref + date */}
                  <div>
                    <p className="font-mono text-xs text-gray-500">{p.purchaseRef}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(p.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </p>
                  </div>

                  {/* Amounts */}
                  <p className="text-sm text-gray-700 lg:text-right">{formatTND(p.amount)}</p>
                  <p className="text-sm text-amber-600 lg:text-right">−{formatTND(p.platformFee)}</p>
                  <p className="text-sm font-semibold text-green-700 lg:text-right">
                    {formatTND(p.guideEarns)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
