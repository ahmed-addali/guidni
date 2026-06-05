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

const BRAIN_URL = process.env.NEXT_PUBLIC_RECO_URL ?? "http://localhost:8001";
const BATCH_SIZE = 20;
const FLUSH_INTERVAL_MS = 15_000; // flush every 15s even if batch not full

// ── Types ────────────────────────────────────────────────────

type EventType =
  | "impression"
  | "click"
  | "dwell_exit"
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

  private sessionState = {
    scrollDepth: 0.0,
    priceRangeViewed: { min: 0, max: 0 },
    clickSequence: [] as string[],
    deviceType: "desktop",
    lat: null as number | null,
    lon: null as number | null,
    sessionStartMs: Date.now(),
  };

  /**
   * Set the current user context (destination, budget, group type).
   * Called once on page load or when destination changes.
   */
  setContext(ctx: Partial<TrackerContext>) {
    this.context = { ...this.context, ...ctx };
    console.log("[RecTracker] Context updated:", this.context);
  }

  /**
   * Handle user login / identity change.
   */
  setUserId(userId: string | null) {
    this.context.userId = userId ?? undefined;
    if (userId) {
      this.mergeSession(userId);
    }
  }

  private async mergeSession(userId: string) {
    try {
      await fetch(`${BRAIN_URL}/api/recommendations/merge-session`, {
        method: "POST",
        body: JSON.stringify({
          session_id: getSessionId(),
          user_id: userId,
        }),
        headers: { "Content-Type": "application/json" },
      });
      console.log("[RecTracker] Session merged for user:", userId);
    } catch (e) {
      console.warn("[RecTracker] Session merge failed:", e);
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

    // Device detection
    const ua = navigator.userAgent;
    if (/tablet|ipad/i.test(ua)) this.sessionState.deviceType = "tablet";
    else if (/mobile|android|iphone/i.test(ua)) this.sessionState.deviceType = "mobile";
    else this.sessionState.deviceType = "desktop";

    // Geolocation detection
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.sessionState.lat = pos.coords.latitude;
          this.sessionState.lon = pos.coords.longitude;
        },
        () => { } // Silently ignore denied permissions
      );
    }

    // Scroll depth tracking
    window.addEventListener("scroll", () => {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      const depth = Math.min(scrolled / total, 1.0);
      if (depth > this.sessionState.scrollDepth) {
        this.sessionState.scrollDepth = depth;
      }
    }, { passive: true });

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
  trackClick(listingId: string, listingType: string, price?: number) {
    // Add to click sequence
    if (!this.sessionState.clickSequence.includes(listingId)) {
      this.sessionState.clickSequence.push(listingId);
      if (this.sessionState.clickSequence.length > 20) {
        this.sessionState.clickSequence.shift();
      }
    }

    // Update price range viewed
    if (price && price > 0) {
      if (this.sessionState.priceRangeViewed.min === 0 || price < this.sessionState.priceRangeViewed.min) {
        this.sessionState.priceRangeViewed.min = price;
      }
      if (price > this.sessionState.priceRangeViewed.max) {
        this.sessionState.priceRangeViewed.max = price;
      }
    }

    this.enqueue("click", listingId, listingType, price ? { price } : undefined);
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
      this.enqueue("dwell_exit", listingId, listingType, {
        dwell_seconds: Math.floor((Date.now() - startTime) / 1000),
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
    this.flush(); // Immediate flush
  }

  // ── RESERVATION ────────────────────────────────────────────

  /**
   * Track a confirmed reservation. Price is used for revenue-weighted α bonus.
   */
  trackReservation(listingId: string, listingType: string, price: number) {
    this.enqueue("reservation", listingId, listingType, { price });
    this.flush(); // Immediate flush
  }

  // ── RECOMMENDATIONS FETCHING ───────────────────────────────

  /**
   * Fetch personalized recommendations from the API
   */
  async getRecommendations(locationZone: string, topK: number = 10) {
    const now = new Date();
    const params = new URLSearchParams({
      location_zone: locationZone,
      session_id: getSessionId(),
      hour: now.getHours().toString(),
      month: (now.getMonth() + 1).toString(),
      listing_types: "STAY,ACTIVITY,RESTAURANT,TRANSFER",
      scroll_depth: this.sessionState.scrollDepth.toString(),
      dwell_seconds: Math.floor((Date.now() - this.sessionState.sessionStartMs) / 1000).toString(),
      top_k: topK.toString(),
    });
    console.log("Auth State:", this.context)

    if (this.context.userId) params.append("user_id", this.context.userId);
    if (this.sessionState.lat) params.append("lat", this.sessionState.lat.toString());
    if (this.sessionState.lon) params.append("lon", this.sessionState.lon.toString());
    if (this.context.budget) params.append("budget_estimate", this.context.budget.toString());

    try {
      const res = await fetch(`${BRAIN_URL}/api/recommendations?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch recommendations");
      return await res.json();
    } catch (e) {
      console.error("[RecTracker] Error getting recommendations:", e);
      return { items: [] };
    }
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
    if (this.queue.length === 0) {
      return;
    }

    const batch = [...this.queue];
    this.queue = [];

    const now = new Date();

    // Map to BatchRequest expected by FastAPI
    const payload = {
      session_id: getSessionId(),
      user_id: this.context.userId || null,
      location_zone: this.context.destinationId || "unknown",
      session_state: {
        scroll_depth: this.sessionState.scrollDepth,
        dwell_seconds: Math.floor((Date.now() - this.sessionState.sessionStartMs) / 1000),
        price_range_viewed: this.sessionState.priceRangeViewed,
        click_sequence: this.sessionState.clickSequence,
        lat: this.sessionState.lat,
        lon: this.sessionState.lon,
        device_type: this.sessionState.deviceType,
        hour: now.getHours(),
        month: now.getMonth() + 1,
        budget_segment: this.context.budget ? (this.context.budget > 200 ? "premium" : "budget") : "unknown",
      },
      session_rewards: {},
      events: batch.map((e) => ({
        event: e.event,
        listing_id: e.listingId,
        listing_type: e.listingType,
        meta: e.meta || {},
      })),
    };

    console.log(`[RecTracker] 🚀 Flushing ${batch.length} events to ${BRAIN_URL}/api/recommendations/events`);
    console.log("[RecTracker] Payload:", JSON.stringify(payload, null, 2));

    try {
      const res = await fetch(`${BRAIN_URL}/api/recommendations/events`, {
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
