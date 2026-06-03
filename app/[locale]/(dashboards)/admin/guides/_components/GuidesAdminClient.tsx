"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FiExternalLink, FiCheck, FiX } from "react-icons/fi";
import { FaCircleCheck } from "react-icons/fa6";
import {
  setGuideVerification,
  setGuideFeatured,
  setGuideActive,
  reviewGuideVerification,
} from "@/lib/actions/admin-guides";

type Guide = {
  id: string;
  slug: string;
  displayName: string;
  tagline?: string | null;
  country: string;
  isVerified: boolean;
  isFeatured: boolean;
  isActive: boolean;
  nbReviews: number;
  planCount: number;
  createdAt: Date;
  user: { email: string };
  destination?: { city: string } | null;
  _count: { plans: number };
};

type QueueGuide = {
  id: string;
  slug: string;
  displayName: string;
  tagline?: string | null;
  bio: string;
  country: string;
  specializations: string[];
  languages: string[];
  experienceYears?: number | null;
  createdAt: Date;
  user: { email: string };
  destination?: { city: string } | null;
  _count: { plans: number };
};

type Props = { guides: Guide[]; verificationQueue: QueueGuide[]; locale: string };

export function GuidesAdminClient({ guides: initial, verificationQueue: initialQueue, locale }: Props) {
  const [tab, setTab] = useState<"all" | "queue">(initialQueue.length > 0 ? "queue" : "all");
  const [guides, setGuides] = useState(initial);
  const [queue, setQueue] = useState(initialQueue);
  const [isPending, startTransition] = useTransition();

  function toggle<K extends "isVerified" | "isFeatured" | "isActive">(
    id: string,
    field: K,
    value: boolean,
    action: (id: string, val: boolean) => Promise<{ success: boolean; error?: string }>
  ) {
    startTransition(async () => {
      const result = await action(id, value);
      if (result.success) {
        setGuides((prev) => prev.map((g) => (g.id === id ? { ...g, [field]: value } : g)));
        toast.success("Updated");
      } else {
        toast.error((result as { error?: string }).error ?? "Failed");
      }
    });
  }

  function handleVerificationDecision(guideId: string, decision: "APPROVED" | "REJECTED") {
    startTransition(async () => {
      const result = await reviewGuideVerification(guideId, decision);
      if (result.success) {
        setQueue((prev) => prev.filter((g) => g.id !== guideId));
        if (decision === "APPROVED") {
          setGuides((prev) =>
            prev.map((g) => (g.id === guideId ? { ...g, isVerified: true } : g))
          );
        }
        toast.success(decision === "APPROVED" ? "Guide approved & verified" : "Guide rejected");
      } else {
        toast.error("error" in result ? result.error : "Failed");
      }
    });
  }

  const tabs = [
    { id: "all" as const,   label: "All Guides",         count: guides.length },
    { id: "queue" as const, label: "Verification Queue",  count: queue.length  },
  ];

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                tab === t.id ? "bg-primary/10 text-primary" : "bg-gray-200 text-gray-500"
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* All Guides tab */}
      {tab === "all" && (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Guide</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Destination</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Plans</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Verified</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Featured</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Active</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {guides.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{g.displayName}</p>
                        {g.isVerified && <FaCircleCheck className="h-3.5 w-3.5 text-blue-600" />}
                      </div>
                      {g.tagline && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[180px]">{g.tagline}</p>}
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs hidden md:table-cell">{g.user.email}</td>
                    <td className="px-5 py-4 text-gray-500 hidden lg:table-cell">{g.destination?.city ?? g.country}</td>
                    <td className="px-4 py-4 text-center text-gray-700 font-medium">{g._count.plans}</td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => toggle(g.id, "isVerified", !g.isVerified, setGuideVerification)}
                        disabled={isPending}
                        className={`h-7 w-12 rounded-full transition-colors ${g.isVerified ? "bg-blue-500" : "bg-gray-200"}`}
                      >
                        <span className={`block h-5 w-5 rounded-full bg-white shadow mx-auto transition-transform ${g.isVerified ? "translate-x-2.5" : "-translate-x-2.5"}`} />
                      </button>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => toggle(g.id, "isFeatured", !g.isFeatured, setGuideFeatured)}
                        disabled={isPending}
                        className={`h-7 w-12 rounded-full transition-colors ${g.isFeatured ? "bg-primary" : "bg-gray-200"}`}
                      >
                        <span className={`block h-5 w-5 rounded-full bg-white shadow mx-auto transition-transform ${g.isFeatured ? "translate-x-2.5" : "-translate-x-2.5"}`} />
                      </button>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => toggle(g.id, "isActive", !g.isActive, setGuideActive)}
                        disabled={isPending}
                        className={`h-7 w-12 rounded-full transition-colors ${g.isActive ? "bg-green-500" : "bg-gray-200"}`}
                      >
                        <span className={`block h-5 w-5 rounded-full bg-white shadow mx-auto transition-transform ${g.isActive ? "translate-x-2.5" : "-translate-x-2.5"}`} />
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/${locale}/planner/guides/${g.slug}`}
                        target="_blank"
                        className="text-gray-400 hover:text-primary transition-colors"
                        title="View public profile"
                      >
                        <FiExternalLink className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {guides.length === 0 && (
              <div className="py-16 text-center text-sm text-gray-400">No guide profiles yet.</div>
            )}
          </div>
        </div>
      )}

      {/* Verification Queue tab */}
      {tab === "queue" && (
        <div className="space-y-4">
          {queue.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl py-16 text-center">
              <p className="text-sm text-gray-400">No pending verification requests.</p>
            </div>
          ) : (
            queue.map((g) => (
              <div key={g.id} className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{g.displayName}</h3>
                      <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                        Pending Review
                      </span>
                    </div>
                    {g.tagline && <p className="text-sm text-gray-500 mb-1">{g.tagline}</p>}
                    <p className="text-xs text-gray-400">{g.user.email} · {g.destination?.city ?? g.country}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleVerificationDecision(g.id, "REJECTED")}
                      disabled={isPending}
                      className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <FiX className="h-3.5 w-3.5" /> Reject
                    </button>
                    <button
                      onClick={() => handleVerificationDecision(g.id, "APPROVED")}
                      disabled={isPending}
                      className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      <FiCheck className="h-3.5 w-3.5" /> Approve
                    </button>
                  </div>
                </div>

                {/* Bio preview */}
                <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 line-clamp-3">
                  {g.bio}
                </p>

                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                  <span>{g._count.plans} plans</span>
                  {g.experienceYears && <span>{g.experienceYears} years experience</span>}
                  {g.languages.length > 0 && <span>Languages: {g.languages.join(", ")}</span>}
                  {g.specializations.length > 0 && <span>Specializes in: {g.specializations.slice(0, 3).join(", ")}</span>}
                  <span>Joined {new Date(g.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <Link
                    href={`/${locale}/planner/guides/${g.slug}`}
                    target="_blank"
                    className="text-xs text-primary hover:underline flex items-center gap-1 w-fit"
                  >
                    <FiExternalLink className="h-3 w-3" /> View public profile
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
