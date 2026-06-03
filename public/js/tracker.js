/**
 * RecommendationTracker — vanilla JS session tracker for LinUCB.
 *
 * Zero dependencies. Works in all modern browsers.
 * Compatible with ESM and CommonJS.
 *
 * Tracks:  impressions, clicks, page exits (dwell/quick_exit),
 *          gallery swipes, scroll-to-reviews, wishlists, reservations
 *
 * Features:
 *   - Auto-flush every 15s or when queue reaches 10 events
 *   - sendBeacon on page close (fire-and-forget, max 20 events)
 *   - session_rewards synced from server on each flush
 *   - Scroll depth, geolocation, budget segment auto-tracked
 *   - Login transition via onLogin() with session merge
 *
 * Usage:
 *   const tracker = new RecommendationTracker({
 *     baseUrl: "http://localhost:8001",
 *     sessionId: crypto.randomUUID(),
 *     userId: null, // set after login
 *   });
 *   tracker.setLocationZone("Djerba");
 *   tracker.trackImpression("abc123", "STAY", 150, 1);
 */

class RecommendationTracker {
  /**
   * @param {Object} opts
   * @param {string} opts.baseUrl - API base URL (no trailing slash)
   * @param {string} opts.sessionId - Unique session identifier
   * @param {string|null} [opts.userId=null] - User ID (null = anonymous)
   */
  constructor({ baseUrl, sessionId, userId = null }) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.sessionId = sessionId;
    this._userId = userId;
    this._queue = [];
    this._sessionRewards = {};
    this._enterTimes = {};
    this._isFlushing = false;
    this._locationZone = "unknown";

    this._sessionState = {
      scrollDepth: 0,
      dwellSeconds: 0,
      priceRangeViewed: { min: 0, max: 0 },
      clickSequence: [],
      lat: null,
      lon: null,
      deviceType: this._detectDevice(),
      hour: new Date().getHours(),
      month: new Date().getMonth() + 1,
      budgetSegment: "unknown",
    };

    this._setupScrollTracking();
    this._setupGeolocation();
    this._setupPageCloseHandlers();

    // Auto-flush every 15 seconds
    this._flushTimer = setInterval(() => this._flush(), 15000);
  }

  // ─────────────────────────────────────────
  // PUBLIC TRACKING METHODS
  // ─────────────────────────────────────────

  /**
   * Track a listing impression.
   * @param {string} listingId
   * @param {string} listingType - "STAY"|"ACTIVITY"|"RESTAURANT"|"TRANSFER"
   * @param {number} price - Listing price
   * @param {number} rank - 1-based position shown
   */
  trackImpression(listingId, listingType, price, rank) {
    this._updatePriceRange(price);
    this._sessionState.budgetSegment = this._getBudgetSegment();
    this._queueEvent("impression", listingId, listingType, { price, rank });
  }

  /**
   * Track a listing click (user opens detail page).
   * @param {string} listingId
   * @param {string} listingType
   * @param {number} price
   */
  trackClick(listingId, listingType, price) {
    this._enterTimes[listingId] = Date.now();
    const seq = this._sessionState.clickSequence;
    if (!seq.includes(listingId)) {
      seq.push(listingId);
      if (seq.length > 20) seq.shift();
    }
    this._queueEvent("click", listingId, listingType, { price });
  }

  /**
   * Track when user leaves a listing detail page.
   * Emits "quick_exit" (<5s) or "dwell_exit" (≥5s).
   * @param {string} listingId
   */
  trackPageExit(listingId) {
    const enter = this._enterTimes[listingId];
    if (!enter) return;
    const elapsed = Date.now() - enter;
    delete this._enterTimes[listingId];

    if (elapsed < 5000) {
      this._queueEvent("quick_exit", listingId, null, {});
    } else {
      this._queueEvent("dwell_exit", listingId, null, {
        dwell_seconds: Math.round(elapsed / 1000),
      });
    }
  }

  /**
   * Track gallery swipe (only fires if ≥3 swipes).
   * @param {string} listingId
   * @param {string} listingType
   * @param {number} swipeCount
   */
  trackGallerySwipe(listingId, listingType, swipeCount) {
    if (swipeCount >= 3) {
      this._queueEvent("gallery_swipe", listingId, listingType, {
        swipe_count: swipeCount,
      });
    }
  }

  /**
   * Track scroll to reviews section.
   * @param {string} listingId
   * @param {string} listingType
   */
  trackScrollToReviews(listingId, listingType) {
    this._queueEvent("scroll_reviews", listingId, listingType, {});
  }

  /**
   * Track wishlist add.
   * @param {string} listingId
   * @param {string} listingType
   * @param {number} price
   */
  trackWishlist(listingId, listingType, price) {
    this._queueEvent("wishlist", listingId, listingType, { price });
  }

  /**
   * Track reservation (high-value signal — flushes immediately).
   * @param {string} listingId
   * @param {string} listingType
   * @param {number} price
   */
  trackReservation(listingId, listingType, price) {
    this._queueEvent("reservation", listingId, listingType, { price });
    this._flush(); // Flush immediately on high-value signal
  }

  /**
   * Handle login transition: flush queue, merge session, update userId.
   * @param {string} userId
   */
  async onLogin(userId) {
    // Step 1: flush current queue before identity changes
    this._flushBeacon();

    // Step 2: merge anonymous session with user account
    try {
      await fetch(this.baseUrl + "/api/recommendations/merge-session", {
        method: "POST",
        body: JSON.stringify({
          session_id: this.sessionId,
          user_id: userId,
        }),
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      console.warn("Session merge failed (non-critical):", e);
    }

    // Step 3: update userId regardless of merge result
    // Anonymous events are already sent. Future events use the real userId.
    this._userId = userId;
  }

  /**
   * Set the current location zone (call when user navigates to a destination).
   * @param {string} zone
   */
  setLocationZone(zone) {
    this._locationZone = zone;
  }

  /**
   * Clean up: stop timer, flush remaining events.
   */
  destroy() {
    if (this._flushTimer) {
      clearInterval(this._flushTimer);
      this._flushTimer = null;
    }
    this._flushBeacon();
  }

  // ─────────────────────────────────────────
  // PRIVATE METHODS
  // ─────────────────────────────────────────

  /**
   * Add an event to the queue. Auto-flushes at 10 events.
   */
  _queueEvent(event, listingId, listingType, meta = {}) {
    this._queue.push({
      event,
      listing_id: listingId,
      listing_type: listingType || "ACTIVITY",
      meta,
    });
    if (this._queue.length >= 10) this._flush();
  }

  /**
   * Flush queued events via fetch (async, receives response).
   * Syncs session_rewards from server to prevent reward explosion.
   */
  async _flush() {
    if (this._queue.length === 0 || this._isFlushing) return;
    this._isFlushing = true;

    const payload = this._buildPayload();
    this._queue = [];

    try {
      const res = await fetch(
        this.baseUrl + "/api/recommendations/events",
        {
          method: "POST",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await res.json();
      // Sync session_rewards from server (prevents reward explosion)
      this._sessionRewards = data.session_rewards || {};
    } catch (e) {
      // Re-queue events on failure, retry on next flush cycle
      this._queue = [...payload.events, ...this._queue];
    } finally {
      this._isFlushing = false;
    }
  }

  /**
   * Flush via sendBeacon (fire-and-forget for page close).
   * Cannot receive response → session_rewards NOT synced (acceptable for exit).
   * Slices to last 20 events to respect sendBeacon's ~64KB limit.
   */
  _flushBeacon() {
    if (this._queue.length === 0) return;

    // BEACON SIZE LIMIT: sendBeacon has ~64KB limit
    // Slice to last 20 events if queue is large
    if (this._queue.length > 20) {
      this._queue = this._queue.slice(-20);
    }

    const sent = navigator.sendBeacon(
      this.baseUrl + "/api/recommendations/events",
      new Blob([JSON.stringify(this._buildPayload())], {
        type: "application/json",
      })
    );
    if (sent) this._queue = [];
    // If sendBeacon returns false (queue full), events are lost.
    // This is acceptable: page is closing, we have what we need.
  }

  /**
   * Build the batch request payload.
   */
  _buildPayload() {
    // Update time fields
    this._sessionState.hour = new Date().getHours();
    this._sessionState.month = new Date().getMonth() + 1;

    return {
      session_id: this.sessionId,
      user_id: this._userId,
      location_zone: this._locationZone || "unknown",
      session_state: {
        scroll_depth: this._sessionState.scrollDepth,
        dwell_seconds: this._sessionState.dwellSeconds,
        price_range_viewed: this._sessionState.priceRangeViewed,
        click_sequence: this._sessionState.clickSequence,
        lat: this._sessionState.lat,
        lon: this._sessionState.lon,
        device_type: this._sessionState.deviceType,
        hour: this._sessionState.hour,
        month: this._sessionState.month,
        budget_segment: this._sessionState.budgetSegment,
      },
      session_rewards: { ...this._sessionRewards },
      events: [...this._queue],
    };
  }

  /**
   * Update tracked price range from a listing impression/click.
   */
  _updatePriceRange(price) {
    if (!price || price <= 0) return;
    const r = this._sessionState.priceRangeViewed;
    if (r.min === 0 || price < r.min) r.min = price;
    if (price > r.max) r.max = price;
  }

  /**
   * Infer budget segment from viewed price range.
   */
  _getBudgetSegment() {
    const { min, max } = this._sessionState.priceRangeViewed;
    const avg = (min + max) / 2;
    if (avg <= 0) return "unknown";
    if (avg < 100) return "budget";
    if (avg < 300) return "mid";
    if (avg < 600) return "premium";
    return "luxury";
  }

  /**
   * Detect device type from user agent.
   */
  _detectDevice() {
    if (typeof navigator === "undefined") return "desktop";
    const ua = navigator.userAgent;
    if (/tablet|ipad/i.test(ua)) return "tablet";
    if (/mobile|android|iphone/i.test(ua)) return "mobile";
    return "desktop";
  }

  /**
   * Track max scroll depth passively.
   */
  _setupScrollTracking() {
    if (typeof window === "undefined") return;
    window.addEventListener(
      "scroll",
      () => {
        const scrolled = window.scrollY + window.innerHeight;
        const total = document.documentElement.scrollHeight;
        const depth = Math.min(scrolled / total, 1.0);
        if (depth > this._sessionState.scrollDepth) {
          this._sessionState.scrollDepth = depth;
        }
      },
      { passive: true }
    );
  }

  /**
   * Request geolocation once (silently ignores denied permission).
   */
  _setupGeolocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this._sessionState.lat = pos.coords.latitude;
        this._sessionState.lon = pos.coords.longitude;
      },
      () => {} // Silently ignore denied permission
    );
  }

  /**
   * Flush on page close via beforeunload and visibilitychange.
   */
  _setupPageCloseHandlers() {
    if (typeof window === "undefined") return;
    window.addEventListener("beforeunload", () => this._flushBeacon());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this._flushBeacon();
    });
  }
}

// ─────────────────────────────────────────
// Export: ESM + CommonJS + browser global
// ─────────────────────────────────────────

if (typeof module !== "undefined" && module.exports) {
  module.exports = RecommendationTracker;
} else if (typeof window !== "undefined") {
  window.RecommendationTracker = RecommendationTracker;
}
