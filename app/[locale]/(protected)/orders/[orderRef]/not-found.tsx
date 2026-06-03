import Link from "next/link";

export default function OrderNotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
      <p className="text-4xl">🛍️</p>
      <h1 className="text-xl font-bold text-gray-900">Order not found</h1>
      <p className="text-gray-500 text-sm">
        This order doesn&apos;t exist or doesn&apos;t belong to your account.
      </p>
      <Link
        href="/orders"
        className="inline-block bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
      >
        My Orders
      </Link>
    </div>
  );
}
