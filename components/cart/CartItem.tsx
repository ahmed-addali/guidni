"use client";

import Image from "next/image";
import { FiMinus, FiPlus, FiTrash2 } from "react-icons/fi";
import { FiPackage } from "react-icons/fi";
import type { CartItem as CartItemType } from "@/stores/cartStore";

interface Props {
  item:           CartItemType;
  onRemove:       (productId: string) => void;
  onUpdateQty:    (productId: string, qty: number) => void;
}

export function CartItem({ item, onRemove, onUpdateQty }: Props) {
  const subtotal = item.price * item.quantity;

  return (
    <div className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
      {/* Image */}
      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FiPackage className="h-6 w-6 text-gray-300" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{item.price} TND / unit</p>

        <div className="flex items-center justify-between mt-2">
          {/* Qty stepper */}
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                item.quantity <= 1
                  ? onRemove(item.productId)
                  : onUpdateQty(item.productId, item.quantity - 1)
              }
              className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
              aria-label="Decrease quantity"
            >
              <FiMinus className="h-3 w-3" />
            </button>
            <span className="text-sm font-semibold text-gray-900 w-5 text-center">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdateQty(item.productId, item.quantity + 1)}
              disabled={item.quantity >= item.maxStock}
              className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              aria-label="Increase quantity"
            >
              <FiPlus className="h-3 w-3" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-900">{subtotal} TND</span>
            <button
              onClick={() => onRemove(item.productId)}
              className="text-gray-300 hover:text-red-400 transition-colors"
              aria-label="Remove item"
            >
              <FiTrash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
