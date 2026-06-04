"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FiPlus, FiEdit2, FiTrash2, FiPackage, FiStar, FiAlertTriangle } from "react-icons/fi";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteProduct } from "@/lib/actions/partner-shops";
import { PRODUCT_CATEGORIES } from "@/lib/utils/shop-categories";
import { PLATFORM_CURRENCY } from "@/lib/utils/constants";

type Product = {
  id:           string;
  slug:         string;
  name:         string;
  category:     string;
  price:        number;
  comparePrice: number | null;
  stock:        number | null;
  featured:     boolean;
  isHandmade:   boolean;
  isLocalOnly:  boolean;
  images:       { id: string; url: string }[];
};

// ─── Stock badge ──────────────────────────────────────────────────────────────

function StockBadge({ stock, t }: { stock: number | null; t: ReturnType<typeof useTranslations> }) {
  if (stock === null) {
    return <span className="text-gray-400">{t("stockUnlimited")}</span>;
  }
  if (stock === 0) {
    return (
      <span className="text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">
        {t("stockOut")}
      </span>
    );
  }
  if (stock <= 5) {
    return (
      <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
        {t("stockLow")} ({stock})
      </span>
    );
  }
  return <span className="text-gray-500">{stock}</span>;
}

// ─── Main component ───────────────────────────────────────────────────────────

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
  const t = useTranslations("PartnerDashboard.editShop.products");
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [, start] = useTransition();

  const base = `/${locale}/partner/shops/${shopSlug}/products`;

  const getCatLabel = (id: string) =>
    PRODUCT_CATEGORIES.find((c) => c.id === id)?.label.en ?? id;

  function handleDelete(id: string, name: string) {
    start(async () => {
      const res = await deleteProduct(id);
      if (res.success) {
        toast.success(t("deleteToast"));
        setProducts((p) => p.filter((pr) => pr.id !== id));
      } else {
        toast.error(res.error ?? t("deleteFailed"));
      }
    });
  }

  const count       = products.length;
  const lowStock    = products.filter((p) => p.stock !== null && p.stock > 0 && p.stock <= 5);
  const outOfStock  = products.filter((p) => p.stock === 0);

  return (
    <div className="space-y-5">
      {/* Low/out stock alert banner */}
      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <FiAlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 space-y-0.5">
            {outOfStock.length > 0 && (
              <p>
                <span className="font-semibold">{t("alertOutOfStock")}:</span>{" "}
                {outOfStock.map((p) => p.name).join(", ")}
              </p>
            )}
            {lowStock.length > 0 && (
              <p>
                <span className="font-semibold">{t("alertLowStock")}:</span>{" "}
                {lowStock.map((p) => `${p.name} (${p.stock})`).join(", ")}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800">{t("heading")}</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {t(count === 1 ? "countSingular" : "countPlural", { count })}
          </p>
        </div>
        <Link
          href={`${base}/new`}
          className="flex items-center gap-2 text-sm text-primary border border-primary/30 bg-primary/5 rounded-xl px-4 py-2.5 hover:bg-primary/10 transition-colors font-medium"
        >
          <FiPlus className="h-4 w-4" />
          {t("addButton")}
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl py-14 flex flex-col items-center justify-center gap-3 text-gray-400">
          <FiPackage className="h-8 w-8" />
          <p className="text-sm">{t("empty")}</p>
          <Link href={`${base}/new`} className="text-xs text-primary hover:underline">
            {t("emptyLink")}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => {
            const rowCls =
              p.stock === 0
                ? "border-red-100 bg-red-50/40"
                : p.stock !== null && p.stock <= 5
                ? "border-amber-100 bg-amber-50/40"
                : "border-gray-100";
            return (
            <div key={p.id} className={`flex items-center gap-4 border rounded-xl p-4 ${rowCls}`}>
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
                      <FiStar className="h-2.5 w-2.5" /> {t("badgeFeatured")}
                    </span>
                  )}
                  {p.isHandmade && (
                    <span className="text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">
                      {t("badgeHandmade")}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                  <span>{getCatLabel(p.category)}</span>
                  <span className="font-medium text-gray-600">
                    {p.price.toLocaleString()} {PLATFORM_CURRENCY}
                  </span>
                  <StockBadge stock={p.stock} t={t} />
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

                <AlertDialog>
                  <AlertDialogTrigger
                    type="button"
                    className="p-2 text-gray-400 hover:text-red-600 border border-gray-200 rounded-lg hover:border-red-200 transition-colors"
                  >
                    <FiTrash2 className="h-3.5 w-3.5" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("deleteDialogTitle", { name: p.name })}</AlertDialogTitle>
                      <AlertDialogDescription>{t("deleteDialogDesc")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("deleteCancelButton")}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(p.id, p.name)}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                      >
                        {t("deleteConfirmButton")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
