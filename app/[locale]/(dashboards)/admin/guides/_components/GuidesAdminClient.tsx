"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FiExternalLink } from "react-icons/fi";
import { FaCircleCheck } from "react-icons/fa6";
import { setGuideVerification, setGuideFeatured, setGuideActive } from "@/lib/actions/admin-guides";

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

type Props = { guides: Guide[]; locale: string };

export function GuidesAdminClient({ guides: initial, locale }: Props) {
  const [guides, setGuides] = useState(initial);
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
        setGuides((prev) =>
          prev.map((g) => (g.id === id ? { ...g, [field]: value } : g))
        );
        toast.success("Updated");
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  return (
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
                <td className="px-5 py-4 text-gray-500 hidden lg:table-cell">
                  {g.destination?.city ?? g.country}
                </td>
                <td className="px-4 py-4 text-center text-gray-700 font-medium">{g._count.plans}</td>

                {/* Verified */}
                <td className="px-4 py-4 text-center">
                  <button
                    onClick={() => toggle(g.id, "isVerified", !g.isVerified, setGuideVerification)}
                    disabled={isPending}
                    className={`h-7 w-12 rounded-full transition-colors ${g.isVerified ? "bg-blue-500" : "bg-gray-200"}`}
                  >
                    <span className={`block h-5 w-5 rounded-full bg-white shadow mx-auto transition-transform ${g.isVerified ? "translate-x-2.5" : "-translate-x-2.5"}`} />
                  </button>
                </td>

                {/* Featured */}
                <td className="px-4 py-4 text-center">
                  <button
                    onClick={() => toggle(g.id, "isFeatured", !g.isFeatured, setGuideFeatured)}
                    disabled={isPending}
                    className={`h-7 w-12 rounded-full transition-colors ${g.isFeatured ? "bg-primary" : "bg-gray-200"}`}
                  >
                    <span className={`block h-5 w-5 rounded-full bg-white shadow mx-auto transition-transform ${g.isFeatured ? "translate-x-2.5" : "-translate-x-2.5"}`} />
                  </button>
                </td>

                {/* Active */}
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
  );
}
