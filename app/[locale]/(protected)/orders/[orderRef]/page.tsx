import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { FiMapPin, FiPhone, FiPackage } from "react-icons/fi";
import { getUserOrderByRef } from "@/lib/actions/product-orders";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";

type Params = Promise<{ locale: string; orderRef: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { orderRef } = await params;
  return { title: `Order ${orderRef} · Guidni` };
}

export default async function OrderDetailPage({ params }: { params: Params }) {
  const { locale, orderRef } = await params;
  const [order, t] = await Promise.all([
    getUserOrderByRef(orderRef),
    getTranslations({ locale, namespace: "OrderPage" }),
  ]);

  if (!order) notFound();

  const isPickup = order.deliveryMethod === "PICKUP";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-16 space-y-6">
      {/* Back */}
      <Link
        href={`/${locale}/orders`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("backToOrders")}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("orderRef")} {order.orderRef}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {t("placedOn")}{" "}
            {new Date(order.createdAt).toLocaleDateString(locale, {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <OrderStatusBadge status={order.status} label={t(`status.${order.status}`)} />
      </div>

      {/* Order items */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-50">
          {order.shop.logo ? (
            <div className="relative w-7 h-7 rounded-full overflow-hidden border border-gray-100">
              <Image src={order.shop.logo} alt={order.shop.name} fill className="object-cover" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <FiPackage className="h-3.5 w-3.5 text-primary" />
            </div>
          )}
          <p className="text-sm font-semibold text-gray-900">
            {t("from")} {order.shop.name}
          </p>
        </div>

        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-3">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                {item.product.images[0]?.url ? (
                  <Image
                    src={item.product.images[0].url}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FiPackage className="h-5 w-5 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                <p className="text-xs text-gray-400">
                  {item.quantity} × {item.unitPrice} TND
                </p>
              </div>
              <p className="text-sm font-semibold text-gray-900 shrink-0">
                {item.quantity * item.unitPrice} TND
              </p>
            </div>
          ))}
        </div>

        {/* Price summary */}
        <div className="border-t border-gray-100 pt-4 space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>{t("subtotal")}</span>
            <span>{order.subtotal} TND</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>{t("deliveryCost")}</span>
            <span>
              {order.deliveryCost === 0 ? (
                <span className="text-green-600">{isPickup ? t("freePickup") : t("freeDelivery", { defaultValue: "Free" })}</span>
              ) : (
                `${order.deliveryCost} TND`
              )}
            </span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
            <span>{t("total")}</span>
            <span>{order.total} TND</span>
          </div>
        </div>
      </div>

      {/* Delivery address */}
      {!isPickup && order.deliveryAddress && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-2">
          <h3 className="text-sm font-semibold text-gray-900">{t("deliveryDetails")}</h3>
          <div className="flex gap-2 text-sm text-gray-600">
            <FiMapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
            <span>
              {[order.deliveryAddress, order.deliveryCity, order.deliveryCountry]
                .filter(Boolean)
                .join(", ")}
            </span>
          </div>
        </div>
      )}

      {/* Shop contact */}
      {(order.shop.phone || order.shop.address) && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-2">
          <h3 className="text-sm font-semibold text-gray-900">{t("shopContact")}</h3>
          {order.shop.phone && (
            <div className="flex gap-2 text-sm text-gray-600">
              <FiPhone className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
              <span>{order.shop.phone}</span>
            </div>
          )}
          {order.shop.address && (
            <div className="flex gap-2 text-sm text-gray-600">
              <FiMapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
              <span>
                {[order.shop.address, order.shop.city].filter(Boolean).join(", ")}
              </span>
            </div>
          )}
          {order.shop.location && (
            <a
              href={order.shop.location}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline block"
            >
              View on Google Maps →
            </a>
          )}
        </div>
      )}

      {/* Notes */}
      {order.notes && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">{t("orderNotes")}</h3>
          <p className="text-sm text-gray-600">{order.notes}</p>
        </div>
      )}

      {/* Footer CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Link
          href={`/${locale}/shops`}
          className="flex-1 text-center border border-gray-200 text-gray-700 rounded-xl py-3 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          {t("continueShopping")}
        </Link>
        <Link
          href={`/${locale}/orders`}
          className="flex-1 text-center bg-primary text-white rounded-xl py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          {t("viewAllOrders")}
        </Link>
      </div>
    </div>
  );
}
