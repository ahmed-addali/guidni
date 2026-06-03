"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FiCheck, FiX, FiPause, FiPlay } from "react-icons/fi";
import { setAgentVerification, setAgentActive } from "@/lib/actions/admin-agents";

type Agent = {
  id:          string;
  displayName: string;
  pseudonym:   string | null;
  phone:       string;
  country:     string;
  city:        string;
  tier:        string;
  points:      number;
  totalEarned: unknown;
  isVerified:  boolean;
  isActive:    boolean;
  createdAt:   Date;
  user:        { email: string };
  destination: { city: string } | null;
  _count:      { invitations: number; earnings: number; referrals: number };
};

interface Props {
  agents: Agent[];
  locale: string;
}

export function AgentsAdminClient({ agents: initial }: Props) {
  const [agents, setAgents]          = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch]          = useState("");

  const filtered = agents.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.displayName.toLowerCase().includes(q) ||
      (a.pseudonym?.toLowerCase().includes(q) ?? false) ||
      a.user.email.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q)
    );
  });

  function toggleVerified(id: string, current: boolean) {
    startTransition(async () => {
      const result = await setAgentVerification(id, !current);
      if (result.success) {
        setAgents((prev) =>
          prev.map((a) => a.id === id ? { ...a, isVerified: !current } : a)
        );
        toast.success(!current ? "Agent verified" : "Verification removed");
      } else {
        toast.error("Failed to update");
      }
    });
  }

  function toggleActive(id: string, current: boolean) {
    startTransition(async () => {
      const result = await setAgentActive(id, !current);
      if (result.success) {
        setAgents((prev) =>
          prev.map((a) => a.id === id ? { ...a, isActive: !current } : a)
        );
        toast.success(!current ? "Agent reactivated" : "Agent deactivated");
      } else {
        toast.error("Failed to update");
      }
    });
  }

  const tierColors: Record<string, string> = {
    STARTER: "bg-gray-100 text-gray-700",
    PRO:     "bg-blue-100 text-blue-700",
    ELITE:   "bg-amber-100 text-amber-700",
  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search by name, email, or city…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
      />

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">No agents found.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((agent) => (
              <div key={agent.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">

                {/* Identity */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900">{agent.displayName}</p>
                    {agent.pseudonym && (
                      <span className="text-xs text-gray-400">@{agent.pseudonym}</span>
                    )}
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tierColors[agent.tier]}`}>
                      {agent.tier}
                    </span>
                    {!agent.isActive && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
                        Deactivated
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{agent.user.email} · {agent.city}, {agent.country}</p>
                  <p className="text-xs text-gray-400">
                    {agent._count.invitations} invitations ·{" "}
                    {agent._count.referrals} referrals ·{" "}
                    {agent.points} pts ·{" "}
                    Joined {new Date(agent.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Verification status */}
                <div className="shrink-0">
                  {agent.isVerified ? (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100">
                      Verified
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-100">
                      Pending
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleVerified(agent.id, agent.isVerified)}
                    disabled={isPending}
                    title={agent.isVerified ? "Remove verification" : "Verify agent"}
                    className={`p-2 rounded-lg transition-colors ${
                      agent.isVerified
                        ? "hover:bg-yellow-50 text-green-600 hover:text-yellow-700"
                        : "hover:bg-green-50 text-gray-400 hover:text-green-600"
                    }`}
                  >
                    {agent.isVerified ? <FiX className="h-4 w-4" /> : <FiCheck className="h-4 w-4" />}
                  </button>

                  <button
                    onClick={() => toggleActive(agent.id, agent.isActive)}
                    disabled={isPending}
                    title={agent.isActive ? "Deactivate agent" : "Reactivate agent"}
                    className={`p-2 rounded-lg transition-colors ${
                      agent.isActive
                        ? "hover:bg-red-50 text-gray-400 hover:text-red-600"
                        : "hover:bg-green-50 text-gray-400 hover:text-green-600"
                    }`}
                  >
                    {agent.isActive ? <FiPause className="h-4 w-4" /> : <FiPlay className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
