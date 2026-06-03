/**
 * React hooks for the recommendation tracker.
 */

"use client";

import { useEffect } from "react";
import { recTracker } from "./tracker";

/**
 * Track dwell time on a detail page.
 * Fires a "dwell_time" event after 15 seconds.
 */
export function useRecDwell(listingId: string, listingType: string) {
  useEffect(() => {
    return recTracker.trackDwell(listingId, listingType);
  }, [listingId, listingType]);
}
