"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiMinus, FiPlus, FiShoppingCart } from "react-icons/fi";
import { FaBolt } from "react-icons/fa6";
import { toast } from "sonner";
import { PLATFORM_CURRENCY } from "@/lib/utils/constants";

type DeliveryMethod = "PICKUP" | "DELIVERY";

interface CartItem {
  productId:  string;
  shopId:     string;
  shopName:   string;
  name:       string;
  price:      number;
  imageUrl?:  string;
  quantity:   number;
  maxStock:   number;
}

interface Props {
  productId:        string;
  shopId:           string;
  shopName:         string;
  productName:      string;
  price:            number;
  comparePrice?:    number | null;
  stock:            number;
  deliveryMethods:  DeliveryMethod[];
  imageUrl?:        string | null;
  locale:           string;
  labels: {
    inStock:       string;
    outOfStock:    string;
    onlyLeft:      string;
    addToCart:     string;
    buyNow:        string;
    added:         string;
    quantity:      string;
    delivery:      string;
    safeCheckout:  string;
    deliveryLabels: Record<string, string>;
  };
}

export function ProductBuyCard({
  productId, shopId, shopName, productName, price, comparePrice,
  stock, deliveryMethods, imageUrl, locale, labels,
}: Props) {
  const router   = useRouter();
  const [qty, setQty] = useState(1);

  const discount =
    comparePrice && comparePrice > price
      ? Math.round(((comparePrice - price) / comparePrice) * 100)
      : null;

  function changeQty(delta: number) {
    setQty((q) => Math.max(1, Math.min(stock, q + delta)));
  }

  function addToCart() {
    // Dynamic import of cart store to avoid SSR issues
    import("@/stores/cartStore").then(({ useCartStore }) => {
      const addItem = useCartStore.getState().addItem;
      addItem({
        productId,
        shopId,
        shopName,
        name:     productName,
        price,
        imageUrl: imageUrl ?? undefined,
        quantity: qty,
        maxStock: stock,
      } satisfies CartItem);
      toast.success(labels.added);
    });
  }

  function buyNow() {
    import("@/stores/cartStore").then(({ useCartStore }) => {
      const addItem = useCartStore.getState().addItem;
      addItem({
        productId,
        shopId,
        shopName,
        name:     productName,
        price,
        imageUrl: imageUrl ?? undefined,
        quantity: qty,
        maxStock: stock,
      } satisfies CartItem);
      router.push(`/${locale}/checkout/cart`);
    });
  }

  const stockStatus =
    stock === 0
      ? "out"
      : stock <= 5
      ? "low"
      : "ok";

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4 sticky top-24">
      {/* Price */}
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-2xl font-bold text-gray-900">{price} {PLATFORM_CURRENCY}</span>
        {comparePrice && comparePrice > price && (
          <>
            <span className="text-base text-gray-400 line-through">{comparePrice} {PLATFORM_CURRENCY}</span>
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              -{discount}%
            </span>
          </>
        )}
      </div>

      {/* Stock */}
      <p
        className={`text-sm font-medium ${
          stockStatus === "out"
            ? "text-red-500"
            : stockStatus === "low"
            ? "text-amber-600"
            : "text-green-600"
        }`}
      >
        {stockStatus === "out"
          ? labels.outOfStock
          : stockStatus === "low"
          ? labels.onlyLeft
          : labels.inStock}
      </p>

      {/* Quantity */}
      {stockStatus !== "out" && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">{labels.quantity}</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => changeQty(-1)}
              disabled={qty <= 1}
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <FiMinus className="h-3.5 w-3.5" />
            </button>
            <span className="w-8 text-center font-semibold text-gray-900">{qty}</span>
            <button
              onClick={() => changeQty(1)}
              disabled={qty >= stock}
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <FiPlus className="h-3.5 w-3.5" />
            </button>
            <span className="text-sm font-semibold text-gray-900 ml-2">
              = {price * qty} {PLATFORM_CURRENCY}
            </span>
          </div>
        </div>
      )}

      {/* Delivery */}
      {deliveryMethods.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">{labels.delivery}</p>
          <div className="flex flex-wrap gap-1.5">
            {deliveryMethods.map((m) => (
              <span
                key={m}
                className="text-xs text-gray-600 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full"
              >
                {labels.deliveryLabels[m] ?? m}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CTA buttons */}
      <div className="space-y-2.5 pt-1">
        <button
          onClick={addToCart}
          disabled={stockStatus === "out"}
          className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-xl py-3 text-sm font-semibold hover:bg-primary/15 transition-colors disabled:opacity-40"
        >
          <FiShoppingCart className="h-4 w-4" />
          {labels.addToCart}
        </button>
        <button
          onClick={buyNow}
          disabled={stockStatus === "out"}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-xl py-3 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40"
        >
          <FaBolt className="h-4 w-4" />
          {labels.buyNow}
        </button>
      </div>

      {/* Trust line */}
      <p className="text-xs text-gray-400 text-center">{labels.safeCheckout}</p>
    </div>
  );
}
