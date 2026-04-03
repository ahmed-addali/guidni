"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { FiShoppingCart } from "react-icons/fi";
import { FaCartShopping } from "react-icons/fa6";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCartStore } from "@/stores/cartStore";
import { CartItem } from "./CartItem";

interface Props {
  open:    boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: Props) {
  const locale     = useLocale();
  const router     = useRouter();
  const items      = useCartStore((s) => s.items);
  const totalAmount = useCartStore((s) => s.totalAmount);
  const totalItems  = useCartStore((s) => s.totalItems);
  const removeItem  = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  // Group items by shopId
  const groups = items.reduce<Record<string, typeof items>>((acc, item) => {
    (acc[item.shopId] ??= []).push(item);
    return acc;
  }, {});

  function handleCheckout() {
    onClose();
    router.push(`/${locale}/checkout/cart`);
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b border-gray-100">
          <SheetTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <FaCartShopping className="h-4 w-4 text-primary" />
            Cart {totalItems > 0 && `(${totalItems})`}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <FiShoppingCart className="h-12 w-12 text-gray-200" />
            <p className="text-gray-500 text-sm">Your cart is empty</p>
            <Link
              href={`/${locale}/shops`}
              onClick={onClose}
              className="text-sm text-blue-600 hover:underline"
            >
              Discover local shops →
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6">
              {Object.entries(groups).map(([shopId, groupItems]) => {
                const shopSubtotal = groupItems.reduce(
                  (sum, i) => sum + i.price * i.quantity,
                  0
                );
                return (
                  <div key={shopId} className="py-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      {groupItems[0].shopName}
                    </p>
                    {groupItems.map((item) => (
                      <CartItem
                        key={item.productId}
                        item={item}
                        onRemove={removeItem}
                        onUpdateQty={updateQuantity}
                      />
                    ))}
                    <div className="flex justify-between text-xs font-medium text-gray-500 mt-2 pt-2 border-t border-gray-50">
                      <span>Shop subtotal</span>
                      <span>{shopSubtotal} TND</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 space-y-3">
              <div className="flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span>{totalAmount} TND</span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full bg-primary text-white rounded-xl py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Proceed to Checkout
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
