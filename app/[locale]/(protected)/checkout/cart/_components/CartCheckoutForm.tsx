"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { FiShoppingCart, FiPackage } from "react-icons/fi";
import { useCartStore } from "@/stores/cartStore";
import { createProductOrders } from "@/lib/actions/product-orders";
import { PLATFORM_CURRENCY } from "@/lib/utils/constants";

type DeliveryMethod = "PICKUP" | "DELIVERY";

interface Labels {
  empty:              string;
  emptyHint:          string;
  orderSummary:       string;
  delivery:           string;
  deliveryMethod:     Record<DeliveryMethod, string>;
  deliveryAddress:    string;
  deliveryCity:       string;
  deliveryCountry:    string;
  notes:              string;
  notesPlaceholder:   string;
  subtotal:           string;
  deliveryCost:       string;
  freeDelivery:       string;
  deliveryCalculated: string;
  shopSubtotal:       string;
  grandTotal:         string;
  placeOrder:         string;
  paymentNote:        string;
  addressRequired:    string;
  success:            string;
  error:              string;
}

interface Props {
  locale: string;
  labels: Labels;
}

const DELIVERY_METHODS: DeliveryMethod[] = ["PICKUP", "DELIVERY"];

export function CartCheckoutForm({ locale, labels }: Props) {
  const router    = useRouter();
  const loc       = useLocale();
  const items     = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("PICKUP");
  const [address,   setAddress]   = useState("");
  const [city,      setCity]      = useState("");
  const [country,   setCountry]   = useState("");
  const [notes,     setNotes]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [addrError, setAddrError] = useState(false);

  // Group items by shop
  const groups = items.reduce<Record<string, typeof items>>((acc, item) => {
    (acc[item.shopId] ??= []).push(item);
    return acc;
  }, {});

  const subtotalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const needsAddress   = deliveryMethod === "DELIVERY";

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <FiShoppingCart className="h-12 w-12 text-gray-200" />
        <p className="text-gray-500">{labels.empty}</p>
        <Link href={`/${locale}/shops`} className="text-sm text-blue-600 hover:underline">
          {labels.emptyHint} →
        </Link>
      </div>
    );
  }

  async function handleSubmit() {
    if (needsAddress && !address.trim()) {
      setAddrError(true);
      return;
    }
    setAddrError(false);
    setLoading(true);

    const result = await createProductOrders(
      items.map((i) => ({
        productId: i.productId,
        shopId:    i.shopId,
        quantity:  i.quantity,
        unitPrice: i.price,
      })),
      {
        deliveryMethod,
        deliveryAddress: address  || undefined,
        deliveryCity:    city     || undefined,
        deliveryCountry: country  || undefined,
        notes:           notes    || undefined,
      }
    );

    setLoading(false);

    if (!result.success) {
      toast.error(result.error ?? labels.error);
      return;
    }

    clearCart();
    // Redirect to orders list with success flag — multi-shop carts create multiple orders
    router.push(`/${loc}/orders?checkout=success`);
  }

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
      {/* Left column */}
      <div className="space-y-6">
        {/* Order summary */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">{labels.orderSummary}</h2>
          {Object.entries(groups).map(([shopId, shopItems]) => {
            const shopSubtotal = shopItems.reduce((s, i) => s + i.price * i.quantity, 0);
            return (
              <div key={shopId} className="space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {shopItems[0].shopName}
                </p>
                {shopItems.map((item) => (
                  <div key={item.productId} className="flex gap-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FiPackage className="h-5 w-5 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">
                        {item.quantity} × {item.price} {PLATFORM_CURRENCY}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 shrink-0">
                      {item.price * item.quantity} {PLATFORM_CURRENCY}
                    </p>
                  </div>
                ))}
                <div className="flex justify-between text-xs font-medium text-gray-500 pt-2 border-t border-gray-50">
                  <span>{labels.shopSubtotal}</span>
                  <span>{shopSubtotal} {PLATFORM_CURRENCY}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Delivery */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">{labels.delivery}</h2>

          {/* Method selector */}
          <div className="flex flex-wrap gap-2">
            {DELIVERY_METHODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setDeliveryMethod(m)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  deliveryMethod === m
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                {labels.deliveryMethod[m]}
              </button>
            ))}
          </div>

          {/* Address fields — shown only for DELIVERY */}
          {needsAddress && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  {labels.deliveryAddress}
                </label>
                <textarea
                  value={address}
                  onChange={(e) => { setAddress(e.target.value); setAddrError(false); }}
                  rows={2}
                  className={`w-full border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${
                    addrError ? "border-red-300" : "border-gray-200"
                  }`}
                />
                {addrError && (
                  <p className="text-xs text-red-500 mt-1">{labels.addressRequired}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    {labels.deliveryCity}
                  </label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    {labels.deliveryCountry}
                  </label>
                  <input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <label className="text-sm font-medium text-gray-700 block mb-2">{labels.notes}</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={labels.notesPlaceholder}
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
      </div>

      {/* Right: price summary (sticky) */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 sticky top-24">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>{labels.subtotal}</span>
            <span>{subtotalAmount} {PLATFORM_CURRENCY}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>{labels.deliveryCost}</span>
            <span className="text-gray-400 text-xs">
              {deliveryMethod === "PICKUP" ? labels.freeDelivery : labels.deliveryCalculated}
            </span>
          </div>
        </div>

        <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
          <span>{labels.grandTotal}</span>
          <span>{subtotalAmount} {PLATFORM_CURRENCY}</span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-primary text-white rounded-xl py-3 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              {labels.placeOrder}
            </span>
          ) : labels.placeOrder}
        </button>

        <p className="text-xs text-gray-400 text-center leading-relaxed">
          {labels.paymentNote}
        </p>
      </div>
    </div>
  );
}
