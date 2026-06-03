"use client";

import { useState, useMemo, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { FiShoppingBag, FiSearch } from "react-icons/fi";
import { updateOrderStatus } from "@/lib/actions/partner-shops";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { PLATFORM_CURRENCY } from "@/lib/utils/constants";
import type { OrderStatus } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderItem = {
  id:        string;
  quantity:  number;
  unitPrice: number;
  product:   { id: string; name: string };
};

type Order = {
  id:             string;
  orderRef:       string;
  status:         OrderStatus;
  deliveryMethod: string;
  subtotal:       number;
  deliveryCost:   number;
  total:          number;
  createdAt:      Date | string;
  items:          OrderItem[];
  user:           { name: string | null; email: string } | null;
};

const STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  PENDING:    ["CONFIRMED", "CANCELLED"],
  CONFIRMED:  ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED:    ["DELIVERED", "CANCELLED"],
  DELIVERED:  ["REFUNDED"],
  CANCELLED:  [],
  REFUNDED:   [],
};

const ALL_STATUSES: OrderStatus[] = [
  "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED",
];

// ─── Component ────────────────────────────────────────────────────────────────

export function OrdersTab({ orders: initialOrders }: { orders: Order[] }) {
  const t      = useTranslations("PartnerDashboard.editShop.orders");
  const locale = useLocale();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [search, setSearch]         = useState("");
  const [statusFilter, setFilter]   = useState<OrderStatus | "">("");
  const [dateFrom, setDateFrom]     = useState("");
  const [dateTo, setDateTo]         = useState("");
  const [, start] = useTransition();

  const filtered = useMemo(() => {
    let list = orders;
    if (statusFilter) list = list.filter((o) => o.status === statusFilter);
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      list = list.filter((o) => new Date(o.createdAt).getTime() >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      list = list.filter((o) => new Date(o.createdAt).getTime() <= to.getTime());
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (o) =>
          o.orderRef.toLowerCase().includes(q) ||
          (o.user?.name ?? "").toLowerCase().includes(q) ||
          (o.user?.email ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, search, statusFilter, dateFrom, dateTo]);

  function handleStatusChange(orderId: string, newStatus: OrderStatus) {
    start(async () => {
      const res = await updateOrderStatus(orderId, newStatus);
      if (res.success) {
        toast.success(t("statusUpdateSuccess"));
        setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
      } else {
        toast.error(res.error ?? t("statusUpdateFailed"));
      }
    });
  }

  const count = orders.length;

  if (orders.length === 0) {
    return (
      <div className="border-2 border-dashed border-gray-200 rounded-2xl py-14 flex flex-col items-center justify-center gap-3 text-gray-400">
        <FiShoppingBag className="h-8 w-8" />
        <p className="text-sm">{t("empty")}</p>
        <p className="text-xs">{t("emptyHint")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-base font-semibold text-gray-800">{t("heading")}</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {t(count === 1 ? "countSingular" : "countPlural", { count })}
          </p>
        </div>
      </div>

      {/* Search + Filter row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setFilter(e.target.value as OrderStatus | "")}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
        >
          <option value="">{t("filterAll")}</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`statuses.${s}` as Parameters<typeof t>[0])}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          title={t("dateFromLabel")}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          title={t("dateToLabel")}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="py-10 text-center text-sm text-gray-400">{t("empty")}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const nextStatuses = STATUS_FLOW[order.status] ?? [];
            const deliveryKey  = order.deliveryMethod as "PICKUP" | "DELIVERY";
            const deliveryLabel = t(
              `deliveryMethods.${deliveryKey}` as Parameters<typeof t>[0],
              undefined,
              { defaultValue: order.deliveryMethod.replace(/_/g, " ") }
            );
            const date = new Date(order.createdAt).toLocaleDateString(locale, {
              day: "numeric", month: "short", year: "numeric",
            });
            const itemCount = order.items.length;

            return (
              <div key={order.id} className="border border-gray-100 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-800 font-mono">{order.orderRef}</span>
                      <OrderStatusBadge
                        status={order.status}
                        label={t(`statuses.${order.status}` as Parameters<typeof t>[0])}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {date} · {deliveryLabel} · {t(itemCount === 1 ? "itemSingular" : "itemPlural", { count: itemCount })}
                    </p>
                    {order.user && (
                      <p className="text-xs text-gray-500 mt-1">
                        {t("customer")}: <span className="font-medium text-gray-700">{order.user.name ?? order.user.email}</span>
                        {order.user.name && (
                          <span className="text-gray-400"> · {order.user.email}</span>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800">
                      {order.total.toLocaleString()} {PLATFORM_CURRENCY}
                    </p>
                    {order.deliveryCost > 0 && (
                      <p className="text-xs text-gray-400">
                        {t("deliveryCostLabel", { amount: order.deliveryCost })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-1">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs text-gray-500">
                      <span>{item.product.name} &times; {item.quantity}</span>
                      <span>{(item.unitPrice * item.quantity).toLocaleString()} {PLATFORM_CURRENCY}</span>
                    </div>
                  ))}
                </div>

                {/* Status actions */}
                {nextStatuses.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-gray-100">
                    <span className="text-xs text-gray-400">{t("updateLabel")}</span>
                    {nextStatuses.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleStatusChange(order.id, s)}
                        className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:border-primary hover:text-primary transition-colors font-medium"
                      >
                        {t(`statuses.${s}` as Parameters<typeof t>[0])}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
