import Link from "next/link";
import { FiPlus } from "react-icons/fi";
import { getMyTransfers } from "@/lib/actions/partner-transfers";
import { TransfersClient } from "./_components/TransfersClient";

export async function generateMetadata() {
  return { title: "Transfers · Partner Dashboard" };
}

export default async function PartnerTransfersPage() {
  const transfers = await getMyTransfers();

  return (
    <div className="space-y-6 max-w-screen-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transfers</h1>
          <p className="text-sm text-gray-400 mt-1">Manage your transfer and chauffeur services.</p>
        </div>
        <Link
          href="transfers/new"
          className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
        >
          <FiPlus className="h-4 w-4" />
          Add transfer
        </Link>
      </div>

      <TransfersClient transfers={transfers} />
    </div>
  );
}
