"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { FiPlus, FiEdit2, FiTrash2, FiStar, FiPackage } from "react-icons/fi";
import { FaStore } from "react-icons/fa6";
import { deleteShop } from "@/lib/actions/partner-shops";
import { RequestReviewDialog } from "@/components/partner/RequestReviewDialog";

type Shop = {
  id:         string;
  slug:       string;
  name:       string;
  category:   string;
  city:       string | null;
  country:    string;
  note:       string | null;
  nbReviews:  number;
  isOpen:     boolean;
  coverPhoto: string | null;
  images:     { id: string; url: string }[];
  products:   { id: string }[];
  orders:     { id: string }[];
};

export function ShopsClient({ shops }: { shops: Shop[] }) {
  const params = useParams();
  const locale = params.locale as string;
  const base   = `/${locale}/partner/shops`;

  const [pending, start]          = useTransition();
  const [deleting, setDeleting]   = useState<string | null>(null);

  function handleDelete(id: string) {
    if (!confirm("Delete this shop? All products and orders will also be removed.")) return;
    setDeleting(id);
    start(async () => {
      const res = await deleteShop(id);
      if (res.success) toast.success("Shop deleted");
      else toast.error(res.error ?? "Failed to delete");
      setDeleting(null);
    });
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          {shops.length} shop{shops.length === 1 ? "" : "s"}
        </p>
        <Link
          href={`${base}/new`}
          className="flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors"
        >
          <FiPlus className="h-4 w-4" />
          New Shop
        </Link>
      </div>

      {shops.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl px-6 py-16 text-center space-y-3">
          <FaStore className="h-10 w-10 text-gray-300 mx-auto" />
          <p className="text-sm font-medium text-gray-500">No shops yet</p>
          <p className="text-xs text-gray-400">Create your first shop to start selling to travellers.</p>
          <Link
            href={`${base}/new`}
            className="inline-flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors mt-2"
          >
            <FiPlus className="h-4 w-4" />
            Create shop
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {shops.map((s) => {
            const imageUrl = s.coverPhoto ?? s.images[0]?.url ?? null;
            return (
              <div key={s.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative h-36 bg-gray-100">
                  {imageUrl ? (
                    <Image src={imageUrl} alt={s.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-2">
                      <FaStore className="h-8 w-8 text-gray-300" />
                      <span className="text-xs text-gray-400">No cover photo</span>
                    </div>
                  )}
                  <span className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.isOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                    {s.isOpen ? "Open" : "Closed"}
                  </span>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-gray-800 truncate">{s.name}</h3>
                  <p className="text-xs text-gray-400">{[s.city, s.country].filter(Boolean).join(", ")}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <FiPackage className="h-3 w-3" /> {s.products.length} products
                    </span>
                    <span>{s.orders.length} orders</span>
                    <span className="flex items-center gap-1">
                      <FiStar className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {s.note ?? "—"} ({s.nbReviews})
                    </span>
                  </div>
                </div>

                <div className="px-4 pb-4 space-y-2">
                  <div className="flex gap-2">
                    <Link
                      href={`${base}/${s.slug}`}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs border border-gray-200 rounded-lg py-2 text-gray-600 hover:border-primary hover:text-primary transition-colors font-medium"
                    >
                      <FiEdit2 className="h-3.5 w-3.5" /> Edit
                    </Link>
                    <button
                      disabled={deleting === s.id || pending}
                      onClick={() => handleDelete(s.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs border border-red-100 rounded-lg py-2 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <FiTrash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                  <div className="flex justify-center">
                    <RequestReviewDialog listingId={s.id} relationType="SHOP" offerHint="e.g. Product selection for the reviewer — 3-5 representative items across your main categories" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
