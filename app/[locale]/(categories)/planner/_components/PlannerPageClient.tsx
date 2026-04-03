"use client";

import { useState } from "react";
import { Suspense } from "react";
import { PlannerModeToggle } from "./PlannerModeToggle";
import { PlannerWizard } from "./PlannerWizard";
import { GeneratingSkeleton } from "./GeneratingSkeleton";
import { GuideCard } from "@/components/planner/GuideCard";
import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import type { PlannerData } from "@/lib/planner/types";

type DestinationOption = {
  id: string;
  slug: string;
  city: string;
  country: string;
};

type Guide = {
  id: string;
  slug: string;
  displayName: string;
  tagline?: string | null;
  avatarUrl?: string | null;
  specializations: string[];
  languages: string[];
  note?: string | null;
  nbReviews: number;
  planCount: number;
  isVerified: boolean;
  destination?: { city: string; slug: string } | null;
};

type Props = {
  destinations: DestinationOption[];
  plannerData: PlannerData;
  locale: string;
  defaultDestinationId?: string;
  defaultDestinationName?: string;
  defaultDestinationCity?: string;
  featuredGuides: Guide[];
  currentDestCity: string;
};

export function PlannerPageClient({
  destinations,
  plannerData,
  locale,
  defaultDestinationId,
  defaultDestinationName,
  defaultDestinationCity,
  featuredGuides,
  currentDestCity,
}: Props) {
  const [mode, setMode] = useState<"ai" | "guides">("ai");

  return (
    <div>
      <PlannerModeToggle mode={mode} onChange={setMode} />

      {mode === "ai" ? (
        <Suspense fallback={<GeneratingSkeleton />}>
          <PlannerWizard
            destinations={destinations}
            plannerData={plannerData}
            locale={locale}
            defaultDestinationId={defaultDestinationId}
            defaultDestinationName={defaultDestinationName}
            defaultDestinationCity={defaultDestinationCity}
          />
        </Suspense>
      ) : (
        <div className="space-y-8">
          {featuredGuides.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {featuredGuides.map((guide) => (
                  <GuideCard
                    key={guide.id}
                    slug={guide.slug}
                    displayName={guide.displayName}
                    tagline={guide.tagline}
                    avatarUrl={guide.avatarUrl}
                    specializations={guide.specializations}
                    languages={guide.languages}
                    note={guide.note}
                    nbReviews={guide.nbReviews}
                    planCount={guide.planCount}
                    isVerified={guide.isVerified}
                    destination={guide.destination}
                    locale={locale}
                  />
                ))}
              </div>
              <div className="text-center">
                <Link
                  href={`/${locale}/planner/guides`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-primary hover:text-primary transition-colors"
                >
                  See all guides in {currentDestCity} <FiArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-20 space-y-4">
              <p className="text-gray-500 font-medium">No local guides yet for {currentDestCity}</p>
              <p className="text-gray-400 text-sm">We're building our guide network. In the meantime, try the AI Planner.</p>
              <button
                onClick={() => setMode("ai")}
                className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Try AI Planner
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
