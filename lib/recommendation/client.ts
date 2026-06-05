/**
 * Server-side client for the Brain recommendation API.
 * Called from Server Components to get MAB-ranked listing IDs.
 */

const RECO_URL = process.env.NEXT_PUBLIC_RECO_URL ?? "http://localhost:8001";

interface FeedResponse {
  items: { listingId: string; listingType: string; theta: number }[];
  segment: string;
  section: string;
  personalized: boolean;
}

/**
 * Ask the Brain for Thompson Sampling-ranked listing IDs.
 * Returns an ordered array of listing IDs, or empty array on failure.
 */
export async function getRecommendedOrder(
  section: string,
  listingType: string,
  destinationSlug: string,
  userId?: string | null,
  limit: number = 8,
): Promise<string[]> {
  try {
    // LinUCB needs time context
    const now = new Date();
    const hour = now.getHours();
    const month = now.getMonth() + 1;
    
    // session_id is required. Since this is often called server-side,
    // we might need a stable one or generate a transient one.
    // For now, use a stable 'server-side' prefix.
    const sessionId = `ssr_${destinationSlug}`;

    const params = new URLSearchParams({
      location_zone: destinationSlug,
      session_id: sessionId,
      hour: hour.toString(),
      month: month.toString(),
      listing_types: listingType,
      top_k: limit.toString(),
    });

    if (userId) {
      params.append("user_id", userId);
    }

    const res = await fetch(`${RECO_URL}/api/recommendations?${params.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 0 }, // always fresh
    });

    if (!res.ok) {
      console.warn(`[Recommend] LinUCB returned ${res.status} for ${section}`);
      return [];
    }

    const data = await res.json();
    return data.items.map((i: any) => i.listing_id);
  } catch (err) {
    console.warn("[Recommend] LinUCB unreachable for recommendations", err);
    return [];
  }
}
