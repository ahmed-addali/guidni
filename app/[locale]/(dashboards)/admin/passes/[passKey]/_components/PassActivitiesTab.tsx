"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updatePassFixedActivities, updatePassOptionalActivities } from "@/lib/actions/passes";
import { FiCheckCircle, FiCircle } from "react-icons/fi";

type Activity = {
  id:    string;
  slug:  string;
  title: string;
  city:  string | null;
  images: { url: string }[];
};

type Props = {
  passKey:       string;
  allActivities: Activity[];
  fixedIds:      string[];
  optionalIds:   string[];
};

export function PassActivitiesTab({ passKey, allActivities, fixedIds, optionalIds }: Props) {
  const [fixed, setFixed] = useState<string[]>(fixedIds);
  const [optional, setOptional] = useState<string[]>(optionalIds);
  const [pendingFixed, startFixed] = useTransition();
  const [pendingOptional, startOptional] = useTransition();

  const [search, setSearch] = useState("");

  const filtered = allActivities.filter(
    (a) =>
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.city?.toLowerCase() ?? "").includes(search.toLowerCase())
  );

  function toggleFixed(id: string) {
    setFixed((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    // Remove from optional if added to fixed
    if (!fixed.includes(id)) {
      setOptional((prev) => prev.filter((x) => x !== id));
    }
  }

  function toggleOptional(id: string) {
    setOptional((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    // Remove from fixed if added to optional
    if (!optional.includes(id)) {
      setFixed((prev) => prev.filter((x) => x !== id));
    }
  }

  function saveFixed() {
    startFixed(async () => {
      const res = await updatePassFixedActivities(passKey, fixed);
      if (res.success) toast.success("Fixed activities saved");
      else toast.error("Failed to save");
    });
  }

  function saveOptional() {
    startOptional(async () => {
      const res = await updatePassOptionalActivities(passKey, optional);
      if (res.success) toast.success("Optional activities saved");
      else toast.error("Failed to save");
    });
  }

  const btnCls = "px-4 py-2 text-sm font-medium rounded-xl transition-colors disabled:opacity-50";

  return (
    <div className="space-y-6">
      {/* Search */}
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search activities…"
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />

      {/* Activity list */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] text-xs font-medium text-gray-500 px-5 py-2.5 border-b border-gray-100 bg-gray-50/50">
          <span>Activity</span>
          <span className="w-20 text-center">Fixed</span>
          <span className="w-20 text-center">Optional</span>
        </div>
        <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
          {filtered.map((act) => {
            const isFixed    = fixed.includes(act.id);
            const isOptional = optional.includes(act.id);
            return (
              <div key={act.id} className="grid grid-cols-[1fr_auto_auto] items-center px-5 py-3 hover:bg-gray-50/50">
                <div className="flex items-center gap-3 min-w-0">
                  {act.images[0]?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={act.images[0].url} alt={act.title} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-gray-100 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{act.title}</p>
                    {act.city && <p className="text-xs text-gray-400">{act.city}</p>}
                  </div>
                </div>

                {/* Fixed toggle */}
                <div className="w-20 flex justify-center">
                  <button
                    type="button"
                    onClick={() => toggleFixed(act.id)}
                    className={`p-1 rounded-full transition-colors ${isFixed ? "text-primary" : "text-gray-300 hover:text-gray-400"}`}
                  >
                    {isFixed ? <FiCheckCircle className="h-5 w-5" /> : <FiCircle className="h-5 w-5" />}
                  </button>
                </div>

                {/* Optional toggle */}
                <div className="w-20 flex justify-center">
                  <button
                    type="button"
                    onClick={() => toggleOptional(act.id)}
                    className={`p-1 rounded-full transition-colors ${isOptional ? "text-blue-500" : "text-gray-300 hover:text-gray-400"}`}
                  >
                    {isOptional ? <FiCheckCircle className="h-5 w-5" /> : <FiCircle className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save buttons */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={saveFixed}
          disabled={pendingFixed}
          className={`${btnCls} bg-primary text-white hover:bg-primary/90`}
        >
          {pendingFixed ? "Saving…" : `Save Fixed (${fixed.length})`}
        </button>
        <button
          type="button"
          onClick={saveOptional}
          disabled={pendingOptional}
          className={`${btnCls} bg-white border border-gray-200 text-gray-700 hover:bg-gray-50`}
        >
          {pendingOptional ? "Saving…" : `Save Optional (${optional.length})`}
        </button>
      </div>
    </div>
  );
}
