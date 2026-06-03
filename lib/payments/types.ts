// ─────────────────────────────────────────────────────────────────────────────
// Payment abstraction types — mirrors Stripe's Checkout Session API shape.
// When migrating from simulation → Stripe, only lib/payments/index.ts changes.
// All calling code uses these types and stays untouched.
// ─────────────────────────────────────────────────────────────────────────────

export type CheckoutSessionParams = {
  /** Amount in smallest currency unit: millimes for TND (1 TND = 1 000), cents for USD/EUR */
  amount: number;
  /** ISO currency code: "TND" | "USD" | "EUR" */
  currency?: string;
  /** Single line description shown on the payment page */
  description: string;
  /**
   * URL to redirect to on successful payment.
   * Use `{SESSION_ID}` as a placeholder — it will be replaced with the actual session id.
   * e.g. "https://guidni.com/en/planner/abc123?session_id={SESSION_ID}"
   */
  successUrl: string;
  /** URL to redirect to when the user cancels */
  cancelUrl: string;
  /**
   * Arbitrary string key-value pairs.
   * Use this to store what the payment is for so the success handler knows what to fulfill.
   * e.g. { type: "PLAN_PURCHASE", planId: "...", purchaseRef: "..." }
   */
  metadata: Record<string, string>;
  /** Authenticated user id — optional but should always be set when known */
  userId?: string;
};

export type CheckoutSessionStatus = "PENDING" | "PAID" | "CANCELLED" | "EXPIRED" | "FAILED";

export type CheckoutSession = {
  id: string;
  amount: number;
  currency: string;
  description: string;
  status: CheckoutSessionStatus;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
  /** The URL to redirect the user to in order to complete payment */
  paymentUrl: string;
  paidAt?: Date | null;
  expiresAt: Date;
  createdAt: Date;
};

export type PaymentVerificationResult = {
  paid: boolean;
  sessionId: string;
  metadata: Record<string, string>;
  amount: number;
  currency: string;
};
