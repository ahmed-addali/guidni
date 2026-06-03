"use client";

import { useState } from "react";
import { FiSearch as Search } from "react-icons/fi";
import { FaBoxOpen } from "react-icons/fa6";
import { ProductCard } from "@/components/shops/ProductCard";
import { PRODUCT_CATEGORIES } from "@/lib/utils/shop-categories";

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
  shopSlug:      string;
  shopName:      string;
  products:      Product[];
  locale:        string;
  labels: {
    all:          string;
    search:       string;
    noResults:    string;
    handmade:     string;
  };
}

export function ProductsListClient({ shopSlug, shopName, products, locale, labels }: Props) {
  const [activeCategory, setActiveCategory] = useState("");
  const [query, setQuery] = useState("");

  const presentCategories = Array.from(new Set(products.map((p) => p.category)));
  const tabs = [
    { id: "", label: labels.all },
    ...PRODUCT_CATEGORIES
      .filter((c) => presentCategories.includes(c.id))
      .map((c) => ({
        id: c.id,
        label: c.label[locale as keyof typeof c.label] ?? c.label.en,
      })),
  ];

  const filtered = products.filter((p) => {
    const matchCat = !activeCategory || p.category === activeCategory;
    const matchQ   = !query || p.name.toLowerCase().includes(query.toLowerCase()) ||
      (p.arabicName ?? "").includes(query);
    return matchCat && matchQ;
  });

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={labels.search}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

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

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <FaBoxOpen className="h-12 w-12 text-gray-200" />
          <p className="text-gray-400 text-sm">{labels.noResults}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
              handmadeLabel={labels.handmade}
            />
          ))}
        </div>
      )}
    </div>
  );
}
