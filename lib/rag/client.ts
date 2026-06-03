/**
 * Brain HTTP client — communicates with the Python FastAPI brain service.
 * All calls go through this module for centralized error handling and typing.
 */

import type { PlanItem, UserPreferences } from "@/lib/planner/types";

const BRAIN_URL = process.env.BRAIN_URL ?? "http://localhost:8000";

// ── Types from the brain ─────────────────────────────────────

export type ScoredPlanItem = PlanItem & {
  score: number;
  ragScore: number;
  domainScore: number;
};

export type BrainPlannerData = {
  activities: ScoredPlanItem[];
  attractions: ScoredPlanItem[];
  restaurants: ScoredPlanItem[];
  transfers: ScoredPlanItem[];
  rentals: ScoredPlanItem[];
  matchedStay: ScoredPlanItem | null;
};

type SearchRequest = {
  preferences: UserPreferences;
  slot?: "lunch" | "evening";
  query?: string;
  limit?: number;
  exclude_ids?: string[];
};

type SwapRequest = {
  preferences: UserPreferences;
  item_type: string;
  slot_type: string;
  current_item_id: string;
  existing_item_ids: string[];
  limit?: number;
};

type SingleIngestRequest = {
  item_type: "activity" | "stay" | "restaurant" | "transfer" | "rental" | "attraction";
  item_id: string;
  action: "upsert" | "delete";
};

// ── Internal fetch helper ────────────────────────────────────

async function brainFetch<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BRAIN_URL}${path}`, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    // No caching for brain calls — always fresh
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`Brain ${path} failed (${res.status}): ${text}`);
  }

  return res.json();
}

// ── Health check ─────────────────────────────────────────────

export async function checkBrainHealth(): Promise<boolean> {
  try {
    const data = await brainFetch<{ status: string }>("/api/health");
    return data.status === "healthy";
  } catch {
    return false;
  }
}

// ── Plan generation (main endpoint) ──────────────────────────

export async function generatePlanData(
  prefs: UserPreferences
): Promise<BrainPlannerData> {
  return brainFetch<BrainPlannerData>("/api/plan/generate", prefs);
}

// ── Per-collection search ────────────────────────────────────

export async function searchActivities(req: SearchRequest): Promise<ScoredPlanItem[]> {
  return brainFetch<ScoredPlanItem[]>("/api/search/activities", req);
}

export async function searchRestaurants(req: SearchRequest): Promise<ScoredPlanItem[]> {
  return brainFetch<ScoredPlanItem[]>("/api/search/restaurants", req);
}

export async function searchStays(req: SearchRequest): Promise<ScoredPlanItem[]> {
  return brainFetch<ScoredPlanItem[]>("/api/search/stays", req);
}

export async function searchTransfers(req: SearchRequest): Promise<ScoredPlanItem[]> {
  return brainFetch<ScoredPlanItem[]>("/api/search/transfers", req);
}

export async function searchRentals(req: SearchRequest): Promise<ScoredPlanItem[]> {
  return brainFetch<ScoredPlanItem[]>("/api/search/rentals", req);
}

export async function searchAttractions(req: SearchRequest): Promise<ScoredPlanItem[]> {
  return brainFetch<ScoredPlanItem[]>("/api/search/attractions", req);
}

// ── Swap alternatives ────────────────────────────────────────

export async function getSwapAlternativesRAG(
  req: SwapRequest
): Promise<ScoredPlanItem[]> {
  return brainFetch<ScoredPlanItem[]>("/api/plan/swap-alternatives", req);
}

// ── Auto-trigger ingestion (called from partner server actions) ──

export async function triggerSingleIngest(
  req: SingleIngestRequest
): Promise<{ status: string }> {
  try {
    return await brainFetch<{ status: string }>("/api/ingest/single", req);
  } catch {
    // Silently fail — brain might be down, ingestion is not critical path
    console.warn("[Brain] Auto-ingest failed for", req.item_type, req.item_id);
    return { status: "skipped" };
  }
}

// ── Full ingestion trigger ───────────────────────────────────

export async function triggerFullIngestion(): Promise<{ status: string }> {
  return brainFetch<{ status: string }>("/api/ingest/full", {});
}
