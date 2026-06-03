import Link from "next/link";
import { TbCar } from "react-icons/tb";

export default function RentalNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <TbCar className="h-16 w-16 text-gray-200" />
      <h1 className="text-2xl font-bold text-gray-900">Rental not found</h1>
      <p className="text-gray-500 text-sm max-w-xs">
        This listing may have been removed or the link is incorrect.
      </p>
      <Link
        href="/transport"
        className="mt-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Browse transport
      </Link>
    </div>
  );
}
