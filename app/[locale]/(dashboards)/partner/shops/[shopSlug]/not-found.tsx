import Link from "next/link";
import { FiChevronLeft } from "react-icons/fi";
import { FaStore } from "react-icons/fa6";

export default function ShopNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <FaStore className="h-10 w-10 text-gray-300" />
      <h2 className="text-xl font-semibold text-gray-800">Shop not found</h2>
      <p className="text-sm text-gray-400">This shop doesn&apos;t exist or you don&apos;t have access to it.</p>
      <Link href="/partner/shops" className="text-sm text-primary hover:underline flex items-center gap-1">
        <FiChevronLeft className="h-4 w-4" /> Back to shops
      </Link>
    </div>
  );
}
