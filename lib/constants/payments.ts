// ── Activity fees ─────────────────────────────────────────────────────────────
/** Flat service fee charged to the traveler per activity booking (shown in breakdown) */
export const ACTIVITY_CLIENT_SERVICE_FEE = 2;   // TND

/** Flat fee charged to the partner after an activity booking is confirmed (not shown to traveler) */
export const ACTIVITY_PARTNER_FEE = 4;          // TND

// ── Stay fees ────────────────────────────────────────────────────────────────
/** Flat service fee charged to the traveler per stay booking (shown in breakdown) */
export const STAY_CLIENT_SERVICE_FEE = 2;       // TND

/** Flat fee charged to the partner after a stay booking is confirmed (not shown to traveler) */
export const STAY_PARTNER_FEE = 4;              // TND

// ── Shared ────────────────────────────────────────────────────────────────────
/** Tunisia TVA rate on tourism services */
export const TUNISIA_TVA_RATE = 0.09;           // 9%

/** Display currency code — used everywhere prices are shown */
export const CURRENCY = "TND";

// ── Legacy (kept for backwards compat — prefer the named constants above) ────
export const TAXES = 3;
export const SERVICE_FEE = 5;
export const TOTAL_FEES = TAXES + SERVICE_FEE;
