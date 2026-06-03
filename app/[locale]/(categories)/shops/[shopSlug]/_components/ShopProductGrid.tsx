"use client";

import { useState } from "react";
import { ProductCard } from "@/components/shops/ProductCard";
import { PRODUCT_CATEGORIES } from "@/lib/utils/shop-categories";
import { FaBoxOpen } from "react-icons/fa6";

interface Product {
  id:           string;
  slug:         string;
  name:         string;
  arabicName:   string | null;
  price:        number;
  comparePrice: number | null;
  category:     string;
  isHandmade:   boolean;
  imageUrl:     string | null;
}

interface Props {
  shopSlug:     string;
  shopName:     string;
  products:     Product[];
  locale:       string;
  allLabel:     string;
  emptyLabel:   string;
  handmadeLabel: string;
}

export function ShopProductGrid({
  shopSlug, shopName, products, locale, allLabel, emptyLabel, handmadeLabel,
}: Props) {
  const [activeCategory, setActiveCategory] = useState("");

  const presentCategories = Array.from(new Set(products.map((p) => p.category)));

  const tabs = [
    { id: "", label: allLabel },
    ...PRODUCT_CATEGORIES
      .filter((c) => presentCategories.includes(c.id))
      .map((c) => ({
        id: c.id,
        label: c.label[locale as keyof typeof c.label] ?? c.label.en,
      })),
  ];

  const filtered = activeCategory
    ? products.filter((p) => p.category === activeCategory)
    : products;

  return (
    <div className="space-y-4">
      {/* Category tabs */}
      {tabs.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveCategory(id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                activeCategory === id
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <FaBoxOpen className="h-12 w-12 text-gray-200" />
          <p className="text-gray-400 text-sm">{emptyLabel}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              slug={product.slug}
              shopSlug={shopSlug}
              name={product.name}
              shopName={shopName}
              price={product.price}
              comparePrice={product.comparePrice}
              isHandmade={product.isHandmade}
              imageUrl={product.imageUrl}
              locale={locale}
              handmadeLabel={handmadeLabel}
            />
          ))}
        </div>
      )}
    </div>
  );
}
