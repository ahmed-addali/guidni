"use client";

import { useRecDwell } from "@/lib/recommendation/hooks";

interface DetailPageTrackerProps {
  listingId: string;
  listingType: string;
}

/**
 * Tracks dwell time on detail pages (fires after 15 seconds).
 * Renders nothing — purely a tracking side-effect.
 */
export function DetailPageTracker({ listingId, listingType }: DetailPageTrackerProps) {
  useRecDwell(listingId, listingType);
  return null;
}
