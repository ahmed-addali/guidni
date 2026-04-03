import Link from "next/link";
import { FaStore } from "react-icons/fa6";

export default function ShopNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
      <FaStore className="h-16 w-16 text-gray-200" />
      <h1 className="text-2xl font-bold text-gray-900">Shop not found</h1>
      <p className="text-gray-500 max-w-sm">
        This shop may have been removed or the link is incorrect.
      </p>
      <Link
        href="../shops"
        className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Browse shops
      </Link>
    </div>
  );
}
