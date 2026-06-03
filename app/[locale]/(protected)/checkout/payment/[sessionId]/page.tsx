import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCheckoutSession } from "@/lib/payments";
import { PaymentSimulator } from "./_components/PaymentSimulator";

type Props = {
  params: Promise<{ locale: string; sessionId: string }>;
};

export const metadata: Metadata = {
  title: "Complete Payment · Guidni",
  // Prevent search engines from indexing payment pages
  robots: { index: false, follow: false },
};

export default async function PaymentPage({ params }: Props) {
  const { sessionId } = await params;

  const session = await getCheckoutSession(sessionId);
  if (!session) notFound();

  // Show appropriate status pages for terminal states
  if (session.status === "PAID") {
    const redirectUrl = session.successUrl.replace("{SESSION_ID}", session.id);
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
            <span className="text-3xl">✅</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Already paid</h1>
          <p className="text-sm text-gray-500 mb-6">This payment has already been completed.</p>
          <a
            href={redirectUrl}
            className="inline-flex items-center px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            View your plan
          </a>
        </div>
      </div>
    );
  }

  if (session.status === "CANCELLED" || session.status === "EXPIRED") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Payment {session.status === "EXPIRED" ? "expired" : "cancelled"}
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            {session.status === "EXPIRED"
              ? "This payment link has expired. Please start a new checkout."
              : "You cancelled this payment. No charge was made."}
          </p>
          <a
            href={session.cancelUrl}
            className="inline-flex items-center px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Go back
          </a>
        </div>
      </div>
    );
  }

  return (
    <PaymentSimulator
      sessionId={session.id}
      amount={session.amount}
      currency={session.currency}
      description={session.description}
    />
  );
}
