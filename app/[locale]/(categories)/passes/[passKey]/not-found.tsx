import Link from "next/link";

export default function PassNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <h1 className="text-2xl font-bold text-gray-900">Pass not found</h1>
      <p className="text-gray-500">This pass does not exist or has been removed.</p>
      <Link href="/passes" className="text-primary hover:underline text-sm">
        Browse all passes
      </Link>
    </div>
  );
}
