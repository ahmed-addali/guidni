// ─────────────────────────────────────────────────────────────────────────────
// Payment Simulation — implements the payment interface using Prisma.
// This is the ONLY file that changes when migrating to Stripe or Konnect.
// The interface (types + function signatures) in index.ts stays identical.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db";
import type {
  CheckoutSessionParams,
  CheckoutSession,
  PaymentVerificationResult,
} from "./types";

const SESSION_TTL_MINUTES = 30;

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function toCheckoutSession(row: {
  id: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  successUrl: string;
  cancelUrl: string;
  metadata: unknown;
  paidAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
}): CheckoutSession {
  return {
    id: row.id,
    amount: row.amount,
    currency: row.currency,
    description: row.description,
    status: row.status as CheckoutSession["status"],
    successUrl: row.successUrl,
    cancelUrl: row.cancelUrl,
    metadata: row.metadata as Record<string, string>,
    paymentUrl: `${APP_URL}/en/checkout/payment/${row.id}`,
    paidAt: row.paidAt,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
  };
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createSession(
  params: CheckoutSessionParams
): Promise<CheckoutSession> {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MINUTES * 60 * 1000);

  const row = await prisma.paymentSession.create({
    data: {
      amount: params.amount,
      currency: params.currency ?? "TND",
      description: params.description,
      successUrl: params.successUrl,
      cancelUrl: params.cancelUrl,
      metadata: params.metadata,
      expiresAt,
      ...(params.userId && { userId: params.userId }),
    },
  });

  return toCheckoutSession(row);
}

// ── Retrieve ──────────────────────────────────────────────────────────────────

export async function getSession(
  sessionId: string
): Promise<CheckoutSession | null> {
  const row = await prisma.paymentSession.findUnique({
    where: { id: sessionId },
  });
  if (!row) return null;

  // Auto-expire stale PENDING sessions on read
  if (row.status === "PENDING" && row.expiresAt < new Date()) {
    await prisma.paymentSession.update({
      where: { id: sessionId },
      data: { status: "EXPIRED" },
    });
    return toCheckoutSession({ ...row, status: "EXPIRED" });
  }

  return toCheckoutSession(row);
}

// ── Confirm (simulation "Pay Now" click) ──────────────────────────────────────

export async function confirmSession(
  sessionId: string
): Promise<CheckoutSession> {
  const row = await prisma.paymentSession.findUnique({
    where: { id: sessionId },
  });
  if (!row) throw new Error("Session not found");
  if (row.status !== "PENDING") throw new Error(`Session is ${row.status}`);
  if (row.expiresAt < new Date()) {
    await prisma.paymentSession.update({
      where: { id: sessionId },
      data: { status: "EXPIRED" },
    });
    throw new Error("Session has expired");
  }

  const updated = await prisma.paymentSession.update({
    where: { id: sessionId },
    data: { status: "PAID", paidAt: new Date() },
  });
  return toCheckoutSession(updated);
}

// ── Cancel (simulation "Cancel" click) ───────────────────────────────────────

export async function cancelSession(
  sessionId: string
): Promise<CheckoutSession> {
  const row = await prisma.paymentSession.findUnique({
    where: { id: sessionId },
  });
  if (!row) throw new Error("Session not found");
  if (row.status !== "PENDING") throw new Error(`Session is ${row.status}`);

  const updated = await prisma.paymentSession.update({
    where: { id: sessionId },
    data: { status: "CANCELLED" },
  });
  return toCheckoutSession(updated);
}

// ── Verify (called by success handler to fulfill the order) ──────────────────

export async function verifySession(
  sessionId: string
): Promise<PaymentVerificationResult> {
  const session = await getSession(sessionId);
  if (!session) {
    return { paid: false, sessionId, metadata: {}, amount: 0, currency: "TND" };
  }
  return {
    paid: session.status === "PAID",
    sessionId,
    metadata: session.metadata,
    amount: session.amount,
    currency: session.currency,
  };
}
