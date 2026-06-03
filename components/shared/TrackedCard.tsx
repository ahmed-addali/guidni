/**
 * TrackedCard — wraps a listing card to track impressions and clicks
 * for the MAB recommendation system.
 *
 * Uses IntersectionObserver (via recTracker) to detect when the card
 * is visible for ≥1s, and tracks clicks when the user navigates.
 */

"use client";

import { useRef, useEffect, type ReactNode } from "react";
import { recTracker } from "@/lib/recommendation/tracker";

interface TrackedCardProps {
  listingId: string;
  listingType: string;
  children: ReactNode;
  className?: string;
}

export function TrackedCard({ listingId, listingType, children, className }: TrackedCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    recTracker.observeCard(ref.current, listingId, listingType);
    return () => recTracker.unobserveCard(listingId, listingType);
  }, [listingId, listingType]);

  const handleClick = () => {
    recTracker.trackClick(listingId, listingType);
  };

  return (
    <div ref={ref} onClick={handleClick} className={className}>
      {children}
    </div>
  );
}
