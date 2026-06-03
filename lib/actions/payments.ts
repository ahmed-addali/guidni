"use server";

import {
  getCheckoutSession,
  confirmCheckoutSession,
  cancelCheckoutSession,
} from "@/lib/payments";

export async function getPaymentSessionAction(sessionId: string) {
  try {
    return await getCheckoutSession(sessionId);
  } catch {
    return null;
  }
}

export async function confirmPaymentAction(
  sessionId: string
): Promise<{ success: true; redirectUrl: string } | { success: false; error: string }> {
  try {
    const session = await confirmCheckoutSession(sessionId);
    // Replace {SESSION_ID} placeholder in successUrl (mirrors Stripe's ?session_id={CHECKOUT_SESSION_ID})
    const redirectUrl = session.successUrl.replace("{SESSION_ID}", session.id);
    return { success: true as const, redirectUrl };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Payment failed",
    };
  }
}

export async function cancelPaymentAction(
  sessionId: string
): Promise<{ success: true; redirectUrl: string } | { success: false; error: string }> {
  try {
    const session = await cancelCheckoutSession(sessionId);
    return { success: true as const, redirectUrl: session.cancelUrl };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Cancel failed",
    };
  }
}
