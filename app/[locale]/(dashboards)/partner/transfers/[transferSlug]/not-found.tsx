import Link from "next/link";
import { TbRoute } from "react-icons/tb";

export default function TransferEditNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <TbRoute className="h-16 w-16 text-gray-200" />
      <h1 className="text-2xl font-bold text-gray-900">Transfer not found</h1>
      <p className="text-gray-500 text-sm max-w-xs">
        This listing may have been removed or you don't have access to it.
      </p>
      <Link
        href="../transfers"
        className="mt-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Back to transfers
      </Link>
    </div>
  );
}
