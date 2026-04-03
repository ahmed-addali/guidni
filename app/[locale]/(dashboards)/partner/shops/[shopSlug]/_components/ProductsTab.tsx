"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { FiPlus, FiEdit2, FiTrash2, FiPackage, FiStar } from "react-icons/fi";
import { deleteProduct } from "@/lib/actions/partner-shops";
import { PRODUCT_CATEGORIES } from "@/lib/utils/shop-categories";

type Product = {
  id:         string;
  slug:       string;
  name:       string;
  category:   string;
  price:      number;
  comparePrice: number | null;
  stock:      number;
  featured:   boolean;
  isHandmade: boolean;
  isLocalOnly: boolean;
  images:     { id: string; url: string }[];
};

export function ProductsTab({
  shopId,
  shopSlug,
  locale,
  products: initialProducts,
}: {
  shopId:   string;
  shopSlug: string;
  locale:   string;
  products: Product[];
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [, start] = useTransition();

  const base = `/${locale}/partner/shops/${shopSlug}/products`;

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    start(async () => {
      const res = await deleteProduct(id);
      if (res.success) {
        toast.success("Product deleted");
        setProducts((p) => p.filter((pr) => pr.id !== id));
      } else {
        toast.error(res.error ?? "Failed to delete");
      }
      setDeleting(null);
    });
  }

  const getCatLabel = (id: string) => PRODUCT_CATEGORIES.find((c) => c.id === id)?.label.en ?? id;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Products</h2>
          <p className="text-xs text-gray-400 mt-0.5">{products.length} product{products.length === 1 ? "" : "s"}</p>
        </div>
        <Link
          href={`${base}/new`}
          className="flex items-center gap-2 text-sm text-primary border border-primary/30 bg-primary/5 rounded-xl px-4 py-2.5 hover:bg-primary/10 transition-colors font-medium"
        >
          <FiPlus className="h-4 w-4" />
          Add product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl py-14 flex flex-col items-center justify-center gap-3 text-gray-400">
          <FiPackage className="h-8 w-8" />
          <p className="text-sm">No products yet.</p>
          <Link href={`${base}/new`} className="text-xs text-primary hover:underline">Add your first product →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-4 border border-gray-100 rounded-xl p-4">
              {/* Thumbnail */}
              <div className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                {p.images[0] ? (
                  <Image src={p.images[0].url} alt={p.name} fill className="object-cover" sizes="56px" />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <FiPackage className="h-5 w-5 text-gray-300" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-gray-800 truncate">{p.name}</span>
                  {p.featured && (
                    <span className="flex items-center gap-0.5 text-[10px] font-semibold text-yellow-600 bg-yellow-50 border border-yellow-200 px-1.5 py-0.5 rounded-full">
                      <FiStar className="h-2.5 w-2.5" /> Featured
                    </span>
                  )}
                  {p.isHandmade && (
                    <span className="text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">
                      Handmade
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                  <span>{getCatLabel(p.category)}</span>
                  <span>{p.price.toLocaleString()} TND</span>
                  <span className={p.stock === 0 ? "text-red-500" : ""}>{p.stock} in stock</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`${base}/${p.slug}`}
                  className="p-2 text-gray-400 hover:text-primary border border-gray-200 rounded-lg hover:border-primary/30 transition-colors"
                >
                  <FiEdit2 className="h-3.5 w-3.5" />
                </Link>
                <button
                  type="button"
                  disabled={deleting === p.id}
                  onClick={() => handleDelete(p.id, p.name)}
                  className="p-2 text-gray-400 hover:text-red-600 border border-gray-200 rounded-lg hover:border-red-200 transition-colors disabled:opacity-50"
                >
                  <FiTrash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
