import Link from "next/link";

export default function PaymentSessionNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl">⚠️</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Payment session not found</h1>
        <p className="text-sm text-gray-500 mb-6">
          This payment link is invalid or has already been processed.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
