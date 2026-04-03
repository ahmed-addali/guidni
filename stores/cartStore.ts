"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId:  string;
  shopId:     string;
  shopName:   string;
  name:       string;
  price:      number;
  imageUrl?:  string | null;
  quantity:   number;
  maxStock:   number;
}

interface CartStore {
  items: CartItem[];
  addItem(item: Omit<CartItem, "quantity"> & { quantity?: number }): void;
  removeItem(productId: string): void;
  updateQuantity(productId: string, qty: number): void;
  clearCart(): void;
  totalItems: number;
  totalAmount: number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem(incoming) {
        const qty = incoming.quantity ?? 1;
        set((state) => {
          const existing = state.items.find((i) => i.productId === incoming.productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === incoming.productId
                  ? { ...i, quantity: Math.min(i.quantity + qty, i.maxStock) }
                  : i
              ),
            };
          }
          return {
            items: [
              ...state.items,
              { ...incoming, quantity: Math.min(qty, incoming.maxStock) },
            ],
          };
        });
      },

      removeItem(productId) {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },

      updateQuantity(productId, qty) {
        set((state) => ({
          items: state.items
            .map((i) =>
              i.productId === productId
                ? { ...i, quantity: Math.min(Math.max(0, qty), i.maxStock) }
                : i
            )
            .filter((i) => i.quantity > 0),
        }));
      },

      clearCart() {
        set({ items: [] });
      },

      get totalItems() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },

      get totalAmount() {
        return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      },
    }),
    { name: "guidni-cart" }
  )
);
