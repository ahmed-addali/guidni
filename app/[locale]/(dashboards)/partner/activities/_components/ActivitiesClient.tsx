"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { FiPlus, FiEdit2, FiTrash2, FiActivity, FiStar } from "react-icons/fi";
import { deleteActivity } from "@/lib/actions/partner";
import { RequestReviewDialog } from "@/components/partner/RequestReviewDialog";

type Activity = {
  id: string;
  slug: string;
  title: string;
  category: string;
  price: number;
  capacity: number;
  region: string;
  duration: string | null;
  nbReviews: number;
  note: string | null;
  images: { id: string; url: string }[];
  _count: { reservations: number };
};

export function ActivitiesClient({ activities }: { activities: Activity[] }) {
  const params = useParams();
  const locale = params.locale as string;
  const base   = `/${locale}/partner/activities`;

  const [pending, start]         = useTransition();
  const [deleting, setDeleting]   = useState<string | null>(null);

  function handleDelete(id: string) {
    if (!confirm("Delete this activity? This cannot be undone.")) return;
    setDeleting(id);
    start(async () => {
      const res = await deleteActivity(id);
      if (res.success) toast.success("Activity deleted");
      else toast.error(res.error ?? "Failed to delete");
      setDeleting(null);
    });
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{activities.length} activit{activities.length === 1 ? "y" : "ies"}</p>
        <Link
          href={`${base}/new`}
          className="flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors"
        >
          <FiPlus className="h-4 w-4" />
          New Activity
        </Link>
      </div>

      {/* Empty state */}
      {activities.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl px-6 py-16 text-center space-y-3">
          <FiActivity className="h-10 w-10 text-gray-300 mx-auto" />
          <p className="text-sm font-medium text-gray-500">No activities yet</p>
          <p className="text-xs text-gray-400">Create your first activity to start receiving bookings.</p>
          <Link
            href={`${base}/new`}
            className="inline-flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors mt-2"
          >
            <FiPlus className="h-4 w-4" />
            Create activity
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {activities.map((a) => (
            <div key={a.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              {/* Image */}
              <div className="relative h-44 bg-gray-100">
                {a.images[0] ? (
                  <Image src={a.images[0].url} alt={a.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-2">
                    <FiActivity className="h-8 w-8 text-gray-300" />
                    <span className="text-xs text-gray-400">No photos yet</span>
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-xs font-semibold px-2 py-1 rounded-lg text-gray-700">
                  {a.price.toLocaleString()} TND
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-gray-800 truncate">{a.title}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                  <span className="bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">{a.category}</span>
                  <span>{a.region}</span>
                  {a.duration && <span>{a.duration}</span>}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
                  <span>{a._count.reservations} bookings</span>
                  <span className="flex items-center gap-1">
                    <FiStar className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {a.note ?? "—"} ({a.nbReviews})
                  </span>
                  <span>Cap: {a.capacity}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="px-4 pb-4 space-y-2">
                <div className="flex gap-2">
                  <Link
                    href={`${base}/${a.slug}`}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs border border-gray-200 rounded-lg py-2 text-gray-600 hover:border-primary hover:text-primary transition-colors font-medium"
                  >
                    <FiEdit2 className="h-3.5 w-3.5" />
                    Edit
                  </Link>
                  <button
                    disabled={deleting === a.id || pending}
                    onClick={() => handleDelete(a.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs border border-red-100 rounded-lg py-2 text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors disabled:opacity-50"
                  >
                    <FiTrash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
                <div className="flex justify-center">
                  <RequestReviewDialog
                    listingId={a.id}
                    relationType="ACTIVITY"
                    offerHint="e.g. Free experience for 2 participants — full guided tour included"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
