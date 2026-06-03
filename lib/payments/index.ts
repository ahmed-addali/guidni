// ─────────────────────────────────────────────────────────────────────────────
// Payment abstraction layer — the ONLY import other code should use.
//
// MIGRATION GUIDE (simulation → Stripe):
//   1. Install:  pnpm add stripe
//   2. Add env:  STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
//   3. Create:   lib/payments/stripe.ts implementing the same 5 functions
//   4. Swap:     Replace the re-exports below with the stripe.ts imports
//   5. Add:      app/api/webhooks/stripe/route.ts to handle stripe events
//   6. Done.     All calling code (lib/actions/plan-purchases.ts etc.) unchanged.
//
// MIGRATION GUIDE (simulation → Konnect):
//   Same steps — implement lib/payments/konnect.ts, swap re-exports.
// ─────────────────────────────────────────────────────────────────────────────

export type {
  CheckoutSessionParams,
  CheckoutSession,
  CheckoutSessionStatus,
  PaymentVerificationResult,
} from "./types";

// ── Active implementation ──────────────────────────────────────────────────
// To switch payment provider: change these imports only.

import {
  createSession,
  getSession,
  confirmSession,
  cancelSession,
  verifySession,
} from "./simulation";

export {
  createSession as createCheckoutSession,
  getSession as getCheckoutSession,
  confirmSession as confirmCheckoutSession,
  cancelSession as cancelCheckoutSession,
  verifySession as verifyPayment,
};
