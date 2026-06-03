"use client";

import { useState } from "react";
import { FiShoppingCart } from "react-icons/fi";
import { toast } from "sonner";
import { PLATFORM_CURRENCY } from "@/lib/utils/constants";

interface Props {
  productId:   string;
  shopId:      string;
  shopName:    string;
  productName: string;
  price:       number;
  imageUrl?:   string | null;
  stock:       number;
  locale:      string;
  labels: {
    addToCart:  string;
    added:      string;
    outOfStock: string;
    price:      string;
  };
}

export function ProductMobileBar({
  productId, shopId, shopName, productName, price, imageUrl, stock, locale, labels,
}: Props) {
  const [added, setAdded] = useState(false);

  function handleAdd() {
    if (stock === 0) return;
    import("@/stores/cartStore").then(({ useCartStore }) => {
      const addItem = useCartStore.getState().addItem;
      addItem({ productId, shopId, shopName, name: productName, price, imageUrl: imageUrl ?? undefined, quantity: 1, maxStock: stock });
      setAdded(true);
      toast.success(labels.added);
      setTimeout(() => setAdded(false), 2000);
    });
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white border-t border-gray-100 px-4 py-3 flex items-center justify-between gap-4">
      <div>
        <p className="text-xs text-gray-500">{labels.price}</p>
        <p className="text-lg font-bold text-gray-900">{price} {PLATFORM_CURRENCY}</p>
      </div>
      <button
        onClick={handleAdd}
        disabled={stock === 0}
        className="flex items-center gap-2 bg-primary text-white rounded-xl px-6 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        <FiShoppingCart className="h-4 w-4" />
        {stock === 0 ? labels.outOfStock : (added ? labels.added : labels.addToCart)}
      </button>
    </div>
  );
}
