"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import { TbRoute } from "react-icons/tb";
import { deleteTransfer } from "@/lib/actions/partner-transfers";
import { RequestReviewDialog } from "@/components/partner/RequestReviewDialog";

type Transfer = {
  id: string;
  slug: string;
  title: string;
  type: string;
  pricePerTrip: number | null;
  pricePerHour: number | null;
  images: { id: string; url: string }[];
  _count: { reservations: number };
};

const TYPE_LABELS: Record<string, string> = {
  AIRPORT_TRANSFER: "Airport Transfer",
  TAXI:             "City Taxi",
  CHAUFFEUR:        "Private Chauffeur",
  SHUTTLE:          "Shuttle",
};

function getPriceLabel(t: { type: string; pricePerTrip: number | null; pricePerHour: number | null }) {
  if (t.type === "CHAUFFEUR" && t.pricePerHour) return `${t.pricePerHour} TND/hr`;
  if (t.pricePerTrip) return `${t.pricePerTrip} TND/trip`;
  return "—";
}

export function TransfersClient({ transfers }: { transfers: Transfer[] }) {
  const params = useParams();
  const locale = params.locale as string;
  const base   = `/${locale}/partner/transfers`;

  const [pending, start]            = useTransition();
  const [deleting, setDeleting]     = useState<string | null>(null);

  function handleDelete(id: string) {
    if (!confirm("Delete this transfer? This cannot be undone.")) return;
    setDeleting(id);
    start(async () => {
      const res = await deleteTransfer(id);
      if (res.success) toast.success("Transfer deleted");
      else toast.error("error" in res ? res.error : "Failed to delete");
      setDeleting(null);
    });
  }

  if (transfers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white border border-gray-100 rounded-2xl">
        <TbRoute className="h-16 w-16 text-gray-200" />
        <div className="text-center">
          <p className="font-medium text-gray-700">No transfers yet</p>
          <p className="text-sm text-gray-400 mt-1">Add your first service to start accepting bookings.</p>
        </div>
        <Link
          href={`${base}/new`}
          className="mt-1 flex items-center gap-1.5 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <FiPlus className="h-4 w-4" />
          Add transfer
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <div className="divide-y divide-gray-100">
        {transfers.map((tr) => (
          <div key={tr.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
            {/* Thumbnail */}
            <div className="relative h-14 w-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
              {tr.images[0] ? (
                <Image src={tr.images[0].url} alt={tr.title} fill className="object-cover" sizes="80px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <TbRoute className="h-7 w-7 text-gray-300" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{tr.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{TYPE_LABELS[tr.type] ?? tr.type}</p>
            </div>

            {/* Price + bookings */}
            <div className="text-right shrink-0 hidden sm:block">
              <p className="text-sm font-semibold text-gray-900">{getPriceLabel(tr)}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {tr._count.reservations} booking{tr._count.reservations !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`${base}/${tr.slug}`}
                className="flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition-colors"
              >
                <FiEdit2 className="h-3.5 w-3.5" />
                Edit
              </Link>
              <RequestReviewDialog listingId={tr.id} relationType="TRANSFER" offerHint="e.g. Free round-trip airport transfer — vehicle and driver included" />
              <button
                disabled={deleting === tr.id || pending}
                onClick={() => handleDelete(tr.id)}
                className="flex items-center gap-1 text-xs px-3 py-1.5 border border-red-100 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <FiTrash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
