"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, ArrowRight } from "lucide-react";
import type { PlanShoppingBlock } from "@/lib/planner/types";

type Props = {
  shopping: PlanShoppingBlock;
  locale: string;
};

export function ShoppingBlock({ shopping, locale }: Props) {
  if (!shopping.shops.length) return null;

  return (
    <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <ShoppingBag className="h-4 w-4 text-orange-600 shrink-0" />
        <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide">
          Shopping Picks
        </span>
      </div>

      {/* Shops */}
      <div className="space-y-3">
        {shopping.shops.map((shop) => (
          <div key={shop.shopId} className="bg-white rounded-xl border border-orange-100 p-3">
            {/* Shop header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{shop.shopName}</p>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{shop.note}</p>
              </div>
              <Link
                href={`/${locale}/shops/${shop.shopSlug}`}
                className="flex items-center gap-1 text-xs text-orange-600 font-medium px-2 py-1 rounded-lg hover:bg-orange-50 transition-colors whitespace-nowrap shrink-0"
              >
                View <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Products */}
            {shop.products.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {shop.products.map((product) => (
                  <Link
                    key={product.productId}
                    href={`/${locale}/shops/${shop.shopSlug}/products/${product.productSlug}`}
                    className="flex-shrink-0 w-20 group"
                  >
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 mb-1">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.productName}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          sizes="80px"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-2xl">
                          🛍
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-600 truncate leading-tight">
                      {product.productName}
                    </p>
                    <p className="text-[10px] font-semibold text-orange-600">
                      TND {product.price}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
