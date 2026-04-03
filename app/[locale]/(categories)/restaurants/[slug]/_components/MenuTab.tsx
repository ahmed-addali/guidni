"use client";

import { useState } from "react";
import Image from "next/image";
import { UtensilsCrossed } from "lucide-react";
import { MenuItemDialog } from "./MenuItemDialog";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string | null;
  images: { url: string }[];
};

interface Props {
  menu: MenuItem[];
  labels: {
    noMenu: string;
    groupBy: string;
    showAll: string;
    other: string;
  };
}

export function MenuTab({ menu, labels }: Props) {
  const [byCategory, setByCategory] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const grouped = menu.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const cat = item.category ?? labels.other;
    acc[cat] = acc[cat] ?? [];
    acc[cat].push(item);
    return acc;
  }, {});

  if (menu.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400 text-sm">
        {labels.noMenu}
      </div>
    );
  }

  const renderItem = (item: MenuItem) => {
    const img = item.images?.[0]?.url ?? null;
    return (
      <button
        key={item.id}
        onClick={() => setSelectedItem(item)}
        className="flex gap-4 bg-white border border-gray-100 rounded-xl p-4 hover:shadow-sm hover:border-gray-200 transition-all text-left w-full cursor-pointer"
      >
        {img ? (
          <div className="relative h-20 w-20 shrink-0 rounded-lg overflow-hidden">
            <Image src={img} alt={item.name} fill className="object-cover" sizes="80px" />
          </div>
        ) : (
          <div className="h-20 w-20 shrink-0 rounded-lg bg-gray-100 flex items-center justify-center">
            <UtensilsCrossed className="w-6 h-6 text-gray-300" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-800 text-sm">{item.name}</h4>
          {item.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <span className="font-bold text-gray-900 text-sm">{item.price} TND</span>
        </div>
      </button>
    );
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setByCategory((v) => !v)}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            {byCategory ? labels.showAll : labels.groupBy}
          </button>
        </div>

        {byCategory ? (
          Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{cat}</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {items.map(renderItem)}
              </div>
            </div>
          ))
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {menu.map(renderItem)}
          </div>
        )}
      </div>

      <MenuItemDialog item={selectedItem} onClose={() => setSelectedItem(null)} />
    </>
  );
}
