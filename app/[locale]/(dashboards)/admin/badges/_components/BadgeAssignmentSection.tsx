"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { ShieldCheck, UserCheck, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { assignBadge, removeBadge } from "@/lib/actions/admin-badges";
import type { RelationType } from "@prisma/client";

type Listing = {
  id: string;
  slug: string;
  title: string;
  images: { url: string }[];
  coverPhoto: string | null;
  badges: string[];
};

type Props = {
  activities:  Listing[];
  stays:       Listing[];
  restaurants: Listing[];
  shops:       Listing[];
  transfers:   Listing[];
};

const MANAGEABLE_BADGES = [
  {
    key: "VERIFIED" as const,
    label: "Verified",
    icon: ShieldCheck,
    active:   "text-blue-700 border-blue-200 bg-blue-50",
    inactive: "text-gray-400 border-gray-200 bg-white hover:border-gray-300",
    assignNote: "The listing will appear as Verified across the platform.",
    removeNote: "The Verified badge will be removed from this listing immediately.",
  },
  {
    key: "OWNER_OPERATED" as const,
    label: "Owner-Operated",
    icon: UserCheck,
    active:   "text-emerald-700 border-emerald-200 bg-emerald-50",
    inactive: "text-gray-400 border-gray-200 bg-white hover:border-gray-300",
    assignNote: "The listing will display the Owner-Operated badge on its detail page.",
    removeNote: "The Owner-Operated badge will be removed from this listing.",
  },
];

const SECTIONS: { label: string; relationType: RelationType; key: keyof Props }[] = [
  { label: "Activities",  relationType: "ACTIVITY",   key: "activities"  },
  { label: "Stays",       relationType: "STAY",        key: "stays"       },
  { label: "Restaurants", relationType: "RESTAURANT",  key: "restaurants" },
  { label: "Shops",       relationType: "SHOP",        key: "shops"       },
  { label: "Transfers",   relationType: "TRANSFER",    key: "transfers"   },
];

type PendingToggle = {
  relationType: RelationType;
  id: string;
  badgeKey: "VERIFIED" | "OWNER_OPERATED";
  action: "assign" | "remove";
  listingTitle: string;
};

export function BadgeAssignmentSection(props: Props) {
  const [, start] = useTransition();

  const [localBadges, setLocalBadges] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    for (const s of SECTIONS) {
      for (const item of props[s.key]) {
        map[`${s.relationType}:${item.id}`] = [...item.badges];
      }
    }
    return map;
  });

  const [activeSection, setActiveSection] = useState<string>("Activities");
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<PendingToggle | null>(null);

  const activeConfig = SECTIONS.find((s) => s.label === activeSection)!;
  const activeItems  = props[activeConfig.key].filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.slug.toLowerCase().includes(search.toLowerCase())
  );

  function hasBadge(relationType: string, id: string, badgeKey: string) {
    return (localBadges[`${relationType}:${id}`] ?? []).includes(badgeKey);
  }

  function handleToggleClick(
    relationType: RelationType,
    id: string,
    badgeKey: "VERIFIED" | "OWNER_OPERATED",
    listingTitle: string
  ) {
    const has = hasBadge(relationType, id, badgeKey);
    setPending({ relationType, id, badgeKey, action: has ? "remove" : "assign", listingTitle });
  }

  function handleConfirm() {
    if (!pending) return;
    const { relationType, id, badgeKey, action } = pending;
    const mapKey  = `${relationType}:${id}`;
    const current = localBadges[mapKey] ?? [];

    // Optimistic update
    setLocalBadges((prev) => ({
      ...prev,
      [mapKey]: action === "remove"
        ? current.filter((k) => k !== badgeKey)
        : [...current, badgeKey],
    }));
    setPending(null);

    start(async () => {
      const res = action === "remove"
        ? await removeBadge(id, relationType, badgeKey)
        : await assignBadge(id, relationType, badgeKey);

      if (res.success) {
        toast.success(action === "remove" ? `${badgeKey} removed` : `${badgeKey} assigned`);
      } else {
        // Revert optimistic update
        setLocalBadges((prev) => ({ ...prev, [mapKey]: current }));
        toast.error("error" in res ? res.error : "Failed");
      }
    });
  }

  const pendingBadgeConfig = pending
    ? MANAGEABLE_BADGES.find((b) => b.key === pending.badgeKey)
    : null;

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Assign Badges</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Toggle <strong>Verified</strong> and <strong>Owner-Operated</strong> badges on any listing.
            A confirmation will be required before any change is applied.
          </p>
        </div>

        {/* Section tabs */}
        <div className="flex overflow-x-auto border-b border-gray-100 scrollbar-hide">
          {SECTIONS.map((s) => (
            <button
              key={s.label}
              onClick={() => { setActiveSection(s.label); setSearch(""); }}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                activeSection === s.label
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {s.label}
              <span className="ml-1.5 text-xs text-gray-400">({props[s.key].length})</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-5 pt-4 pb-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${activeSection.toLowerCase()}…`}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        {/* Listing rows */}
        <div className="divide-y divide-gray-100 px-5 pb-3 max-h-[540px] overflow-y-auto">
          {activeItems.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">No results</p>
          ) : (
            activeItems.map((item) => {
              const imageUrl = item.images[0]?.url ?? item.coverPhoto ?? null;
              return (
                <div key={item.id} className="flex items-center gap-3 py-3">
                  {/* Thumbnail */}
                  <div className="relative h-10 w-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    {imageUrl ? (
                      <Image src={imageUrl} alt={item.title} fill className="object-cover" sizes="56px" />
                    ) : (
                      <div className="w-full h-full bg-gray-100" />
                    )}
                  </div>

                  {/* Name + slug */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                    <p className="text-xs text-gray-400 truncate">{item.slug}</p>
                  </div>

                  {/* Badge toggles */}
                  <div className="flex items-center gap-2 shrink-0">
                    {MANAGEABLE_BADGES.map(({ key, label, icon: Icon, active, inactive }) => {
                      const on = hasBadge(activeConfig.relationType, item.id, key);
                      return (
                        <button
                          key={key}
                          onClick={() =>
                            handleToggleClick(activeConfig.relationType, item.id, key, item.title)
                          }
                          title={on ? `Remove ${label}` : `Assign ${label}`}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium transition-all ${on ? active : inactive}`}
                        >
                          <Icon className="h-3 w-3" />
                          <span className="hidden sm:inline">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Confirmation modal */}
      {pending && pendingBadgeConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setPending(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {pending.action === "assign" ? "Assign" : "Remove"} {pendingBadgeConfig.label}?
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    This change will be applied immediately.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPending(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Details */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <pendingBadgeConfig.icon className="h-4 w-4 text-gray-500 shrink-0" />
                <span className="font-medium text-gray-800 truncate">{pending.listingTitle}</span>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">
                {pending.action === "assign"
                  ? pendingBadgeConfig.assignNote
                  : pendingBadgeConfig.removeNote}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setPending(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className={`px-5 py-2 text-sm font-medium rounded-xl text-white transition-colors ${
                  pending.action === "remove"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-primary hover:bg-primary/90"
                }`}
              >
                {pending.action === "assign" ? "Assign badge" : "Remove badge"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
