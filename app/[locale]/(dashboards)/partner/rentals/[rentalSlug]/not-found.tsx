import Link from "next/link";

export default function RentalEditNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <h1 className="text-2xl font-bold text-gray-900">Rental not found</h1>
      <p className="text-gray-500 text-sm">This rental doesn&apos;t exist or you don&apos;t have access to it.</p>
      <Link
        href="../rentals"
        className="mt-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Back to rentals
      </Link>
    </div>
  );
}
