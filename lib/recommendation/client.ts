/**
 * Server-side client for the Brain recommendation API.
 * Called from Server Components to get MAB-ranked listing IDs.
 */

const BRAIN_URL = process.env.BRAIN_URL ?? "http://localhost:8000";

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
    const res = await fetch(`${BRAIN_URL}/api/recommend/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section,
        destination_id: destinationSlug,
        listing_type: listingType,
        limit,
        user_id: userId || null,
      }),
      next: { revalidate: 0 }, // always fresh
    });

    if (!res.ok) {
      console.warn(`[Recommend] Brain returned ${res.status} for ${section}`);
      return [];
    }

    const data: FeedResponse = await res.json();
    return data.items.map((i) => i.listingId);
  } catch {
    console.warn("[Recommend] Brain unreachable for recommendations");
    return [];
  }
}
