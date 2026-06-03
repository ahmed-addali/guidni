/**
 * RecTrackerProvider — initializes the recommendation tracker on app mount.
 * Reads destination from cookie + user session, starts the tracker.
 */

"use client";

import { useEffect } from "react";
import { useSession } from "@/lib/auth/client";
import { recTracker } from "@/lib/recommendation/tracker";

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function RecTrackerProvider() {
  const { data: session } = useSession();

  useEffect(() => {
    const destinationSlug = getCookie("guidni-destination") || "djerba";
    const userId = session?.user?.id || undefined;

    recTracker.setContext({
      destinationId: destinationSlug,
      userId,
    });
    recTracker.start();

    return () => recTracker.stop();
  }, [session?.user?.id]);

  return null;
}
