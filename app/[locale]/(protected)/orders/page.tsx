import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { FaCartShopping } from "react-icons/fa6";
import { FiPackage } from "react-icons/fi";
import { getUserOrders } from "@/lib/actions/product-orders";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";

type Params = Promise<{ locale: string }>;

export default async function OrdersPage({ params }: { params: Params }) {
  const { locale } = await params;
  const [orders, t] = await Promise.all([
    getUserOrders(),
    getTranslations({ locale, namespace: "OrderPage" }),
  ]);

  return (
    <div className="max-w-screen-md mx-auto px-4 py-8 pb-16 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-gray-500 mt-1 text-sm">{t("subtitle")}</p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <FaCartShopping className="h-12 w-12 text-gray-200" />
          <p className="text-gray-500 font-medium">{t("empty")}</p>
          <p className="text-sm text-gray-400">{t("emptyHint")}</p>
          <Link
            href={`/${locale}/shops`}
            className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            {t("browseShops")}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const previewImages = order.items.slice(0, 3).map((i) => i.product.images[0]?.url);
            const extra = order.items.length - 3;

            return (
              <div
                key={order.id}
                className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow"
              >
                {/* Row 1: shop + status + date */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {order.shop.logo ? (
                      <div className="relative w-7 h-7 rounded-full overflow-hidden border border-gray-100 shrink-0">
                        <Image src={order.shop.logo} alt={order.shop.name} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <FiPackage className="h-3.5 w-3.5 text-primary" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {order.shop.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <OrderStatusBadge
                      status={order.status}
                      label={t(`status.${order.status}`)}
                    />
                    <span className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString(locale, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Row 2: product image previews */}
                {previewImages.some(Boolean) && (
                  <div className="flex gap-1.5 mb-3">
                    {previewImages.map((url, i) =>
                      url ? (
                        <div
                          key={i}
                          className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0"
                        >
                          <Image src={url} alt="" fill className="object-cover" />
                        </div>
                      ) : null
                    )}
                    {extra > 0 && (
                      <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                        <span className="text-xs text-gray-400">+{extra}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Row 3: ref + total + link */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">
                      {t("orderRef")} {order.orderRef}
                    </p>
                    <p className="text-xs text-gray-400">
                      {order.items.length} {t("items")}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-gray-900">{order.total} TND</span>
                    <Link
                      href={`/${locale}/orders/${order.orderRef}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {t("viewDetails")}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
