/**
 * Recommendation Tracker — tracks user interactions for the MAB Thompson Sampling system.
 *
 * Uses IntersectionObserver for impression tracking (card visible ≥1s).
 * Batches events and fires them to the brain service (fire-and-forget).
 *
 * Usage:
 *   import { recTracker } from "@/lib/recommendation/tracker";
 *
 *   // In a card component:
 *   recTracker.observeCard(ref.current, item.id, "ACTIVITY");
 *
 *   // On click:
 *   recTracker.trackClick(item.id, "ACTIVITY");
 */

const BRAIN_URL = process.env.NEXT_PUBLIC_BRAIN_URL ?? "http://localhost:8000";
const BATCH_SIZE = 5;
const FLUSH_INTERVAL_MS = 10_000; // flush every 10s even if batch not full

// ── Types ────────────────────────────────────────────────────

type EventType =
  | "impression"
  | "click"
  | "dwell_time"
  | "gallery_swipe"
  | "wishlist"
  | "reservation";

interface TrackEvent {
  event: EventType;
  listingId: string;
  listingType: string;
  meta?: Record<string, unknown>;
  ts: number;
}

interface TrackerContext {
  destinationId: string;
  budget?: number;
  groupType?: string;
  userId?: string;
}

// ── Session ID (persisted in sessionStorage) ─────────────────

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let sid = sessionStorage.getItem("rec_session_id");
  if (!sid) {
    sid = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem("rec_session_id", sid);
  }
  return sid;
}

// ── Tracker class ────────────────────────────────────────────

class RecommendationTracker {
  private queue: TrackEvent[] = [];
  private context: TrackerContext = { destinationId: "" };
  private observers = new Map<string, IntersectionObserver>();
  private impressionTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private trackedImpressions = new Set<string>();
  private trackedDwells = new Set<string>();
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * Set the current user context (destination, budget, group type).
   * Called once on page load or when destination changes.
   */
  setContext(ctx: TrackerContext) {
    this.context = ctx;
    console.log("[RecTracker] Context set:", ctx);
  }

  /**
   * Fetch recommendations from the brain service for the current user/context.
   */
  async getRecommendations(destinationId: string, limit: number = 8) {
    if (typeof window === "undefined") return null;
    try {
      const payload = {
        section: "homepage",
        destination_id: destinationId,
        limit,
        user_id: this.context.userId || null,
      };
      
      const res = await fetch(`${BRAIN_URL}/api/recommend/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.warn(`[RecTracker] Brain returned ${res.status} for feed`);
        return null;
      }

      return await res.json();
    } catch (err) {
      console.error("[RecTracker] Failed to fetch recommendations:", err);
      return null;
    }
  }

  /**
   * Start the periodic flush timer. Call on app mount.
   */
  start() {
    if (typeof window === "undefined") return;
    if (this.flushTimer) return;
    console.log("[RecTracker] ▶️ Started — flush interval:", FLUSH_INTERVAL_MS, "ms, BRAIN_URL:", BRAIN_URL);
    this.flushTimer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS);

    // Flush on page unload
    window.addEventListener("beforeunload", () => this.flush());
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") this.flush();
    });
  }

  /**
   * Stop the tracker.
   */
  stop() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
    this.observers.forEach((obs) => obs.disconnect());
    this.observers.clear();
    this.impressionTimers.forEach((t) => clearTimeout(t));
    this.impressionTimers.clear();
  }

  // ── IMPRESSION (IntersectionObserver + 1s timer) ──────────

  /**
   * Observe a listing card element for impression tracking.
   * Fires "impression" event when the card is ≥50% visible for ≥1 second.
   * Call this in a useEffect/useRef on the card component.
   */
  observeCard(element: HTMLElement | null, listingId: string, listingType: string) {
    if (!element || typeof window === "undefined") return;

    const key = `${listingId}_${listingType}`;
    if (this.trackedImpressions.has(key)) return; // already tracked

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            console.log(`[RecTracker] 👁️ Card visible: ${listingType}/${listingId.slice(0, 12)} (ratio: ${entry.intersectionRatio.toFixed(2)})`);
            // Start 500ms timer (short enough for carousel auto-scroll)
            const timer = setTimeout(() => {
              if (!this.trackedImpressions.has(key)) {
                this.trackedImpressions.add(key);
                this.enqueue("impression", listingId, listingType);
                observer.unobserve(element);
              }
            }, 500);
            this.impressionTimers.set(key, timer);
          } else {
            // Left viewport — cancel timer
            const timer = this.impressionTimers.get(key);
            if (timer) {
              clearTimeout(timer);
              this.impressionTimers.delete(key);
            }
          }
        });
      },
      { threshold: 0.3 }  // 30% visible is enough (carousel cards slide in/out)
    );

    observer.observe(element);
    this.observers.set(key, observer);
  }

  /**
   * Stop observing a card (call on unmount).
   */
  unobserveCard(listingId: string, listingType: string) {
    const key = `${listingId}_${listingType}`;
    const observer = this.observers.get(key);
    if (observer) {
      observer.disconnect();
      this.observers.delete(key);
    }
    const timer = this.impressionTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.impressionTimers.delete(key);
    }
  }

  // ── CLICK ──────────────────────────────────────────────────

  /**
   * Track a click on a listing card (user opens detail page).
   */
  trackClick(listingId: string, listingType: string) {
    this.enqueue("click", listingId, listingType);
  }

  // ── DWELL TIME ─────────────────────────────────────────────

  /**
   * Start tracking dwell time on a detail page.
   * Fires "dwell_time" event if the user stays ≥15 seconds.
   * Returns a cleanup function to call on unmount.
   */
  trackDwell(listingId: string, listingType: string): () => void {
    const key = `dwell_${listingId}_${listingType}`;
    if (this.trackedDwells.has(key)) return () => { };

    const startTime = Date.now();
    const timer = setTimeout(() => {
      this.trackedDwells.add(key);
      this.enqueue("dwell_time", listingId, listingType, {
        dwellMs: Date.now() - startTime,
      });
    }, 15_000); // 15 seconds

    return () => clearTimeout(timer);
  }

  // ── GALLERY SWIPE ──────────────────────────────────────────

  /**
   * Track gallery photo swipes. Fires event when count ≥ 3.
   */
  private swipeCounts = new Map<string, number>();
  private trackedSwipes = new Set<string>();

  trackGallerySwipe(listingId: string, listingType: string) {
    const key = `${listingId}_${listingType}`;
    if (this.trackedSwipes.has(key)) return;

    const current = (this.swipeCounts.get(key) ?? 0) + 1;
    this.swipeCounts.set(key, current);

    if (current >= 3) {
      this.trackedSwipes.add(key);
      this.enqueue("gallery_swipe", listingId, listingType, {
        swipeCount: current,
      });
    }
  }

  // ── WISHLIST ───────────────────────────────────────────────

  /**
   * Track a wishlist save action.
   */
  trackWishlist(listingId: string, listingType: string) {
    this.enqueue("wishlist", listingId, listingType);
  }

  // ── RESERVATION ────────────────────────────────────────────

  /**
   * Track a confirmed reservation. Price is used for revenue-weighted α bonus.
   */
  trackReservation(listingId: string, listingType: string, price: number) {
    this.enqueue("reservation", listingId, listingType, { price });
  }

  // ── Internal: queue + batch flush ──────────────────────────

  private enqueue(
    event: EventType,
    listingId: string,
    listingType: string,
    meta?: Record<string, unknown>
  ) {
    this.queue.push({ event, listingId, listingType, meta, ts: Date.now() });
    console.log(`[RecTracker] 📝 Enqueued: ${event} ${listingType}/${listingId.slice(0, 12)} (queue: ${this.queue.length}/${BATCH_SIZE})`);
    if (this.queue.length >= BATCH_SIZE) {
      this.flush();
    }
  }

  private async flush() {
    if (this.queue.length === 0 || !this.context.destinationId) {
      if (this.queue.length > 0 && !this.context.destinationId) {
        console.warn("[RecTracker] ⚠️ Flush skipped — no destinationId set!");
      }
      return;
    }

    const batch = [...this.queue];
    this.queue = [];

    const payload = {
      sessionId: getSessionId(),
      userId: this.context.userId || null,
      destinationId: this.context.destinationId,
      budget: this.context.budget || null,
      groupType: this.context.groupType || null,
      events: batch.map((e) => ({
        event: e.event,
        listingId: e.listingId,
        listingType: e.listingType,
        meta: e.meta || null,
      })),
    };

    console.log(`[RecTracker] 🚀 Flushing ${batch.length} events to ${BRAIN_URL}/api/recommend/event`);
    console.log("[RecTracker] Payload:", JSON.stringify(payload, null, 2));

    try {
      const res = await fetch(`${BRAIN_URL}/api/recommend/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      });
      const text = await res.text();
      console.log(`[RecTracker] ✅ Response: ${res.status} — ${text}`);
    } catch (err) {
      console.error("[RecTracker] ❌ Flush FAILED:", err);
    }
  }
}

// ── Singleton export ─────────────────────────────────────────

export const recTracker = new RecommendationTracker();
