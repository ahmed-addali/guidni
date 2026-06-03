"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { FiShoppingBag, FiDollarSign, FiTrendingUp, FiPackage } from "react-icons/fi";
import { PLATFORM_CURRENCY } from "@/lib/utils/constants";
import type { OrderStatus } from "@prisma/client";

type OrderItem = {
  quantity:  number;
  unitPrice: number;
  product:   { id: string; name: string };
};

type Order = {
  id:        string;
  status:    OrderStatus;
  total:     number;
  createdAt: Date | string;
  items:     OrderItem[];
};

interface Props {
  orders:   Order[];
  products: { id: string; name: string }[];
}

export function OverviewTab({ orders, products }: Props) {
  const t = useTranslations("PartnerDashboard.editShop.overview");

  const stats = useMemo(() => {
    const now        = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const active = orders.filter((o) => o.status !== "CANCELLED" && o.status !== "REFUNDED");

    const totalOrders     = active.length;
    const totalRevenue    = active.reduce((s, o) => s + o.total, 0);
    const avgOrderValue   = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    const thisMonth       = active.filter((o) => new Date(o.createdAt).getTime() >= monthStart);
    const monthOrders     = thisMonth.length;
    const monthRevenue    = thisMonth.reduce((s, o) => s + o.total, 0);

    // Top products by quantity sold
    const productTotals: Record<string, { name: string; qty: number; revenue: number }> = {};
    for (const order of active) {
      for (const item of order.items) {
        const { id, name } = item.product;
        if (!productTotals[id]) productTotals[id] = { name, qty: 0, revenue: 0 };
        productTotals[id].qty     += item.quantity;
        productTotals[id].revenue += item.quantity * item.unitPrice;
      }
    }
    const topProducts = Object.entries(productTotals)
      .sort((a, b) => b[1].qty - a[1].qty)
      .slice(0, 3)
      .map(([, v]) => v);

    return { totalOrders, totalRevenue, avgOrderValue, monthOrders, monthRevenue, topProducts };
  }, [orders]);

  const cards = [
    {
      icon:  <FiShoppingBag className="h-5 w-5 text-blue-600" />,
      label: t("totalOrders"),
      value: stats.totalOrders,
      sub:   t("thisMonth", { count: stats.monthOrders }),
    },
    {
      icon:  <FiDollarSign className="h-5 w-5 text-green-600" />,
      label: t("totalRevenue"),
      value: `${stats.totalRevenue.toLocaleString()} ${PLATFORM_CURRENCY}`,
      sub:   t("thisMonthRevenue", { amount: stats.monthRevenue.toLocaleString(), currency: PLATFORM_CURRENCY }),
    },
    {
      icon:  <FiTrendingUp className="h-5 w-5 text-purple-600" />,
      label: t("avgOrder"),
      value: `${stats.avgOrderValue.toLocaleString()} ${PLATFORM_CURRENCY}`,
      sub:   t("perOrder"),
    },
    {
      icon:  <FiPackage className="h-5 w-5 text-amber-600" />,
      label: t("totalProducts"),
      value: products.length,
      sub:   t("inCatalog"),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              {card.icon}
              <span className="text-xs font-medium text-gray-500">{card.label}</span>
            </div>
            <p className="text-xl font-bold text-gray-900 leading-none">{card.value}</p>
            <p className="text-xs text-gray-400">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Top products */}
      {stats.topProducts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{t("topProducts")}</h3>
          <div className="space-y-2">
            {stats.topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-4">#{i + 1}</span>
                  <span className="text-sm font-medium text-gray-800">{p.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-700">
                    {p.revenue.toLocaleString()} {PLATFORM_CURRENCY}
                  </p>
                  <p className="text-xs text-gray-400">
                    {t("unitsSold", { count: p.qty })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {orders.length === 0 && (
        <div className="py-12 flex flex-col items-center gap-3 text-center text-gray-400">
          <FiShoppingBag className="h-10 w-10" />
          <p className="text-sm font-medium">{t("noOrders")}</p>
          <p className="text-xs">{t("noOrdersHint")}</p>
        </div>
      )}
    </div>
  );
}
