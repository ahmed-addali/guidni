"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FiShoppingBag } from "react-icons/fi";
import { updateOrderStatus } from "@/lib/actions/partner-shops";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import type { OrderStatus } from "@prisma/client";

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

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING:    "Pending",
  CONFIRMED:  "Confirmed",
  PROCESSING: "Processing",
  SHIPPED:    "Shipped",
  DELIVERED:  "Delivered",
  CANCELLED:  "Cancelled",
  REFUNDED:   "Refunded",
};

export function OrdersTab({ orders: initialOrders }: { orders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [, start] = useTransition();

  function handleStatusChange(orderId: string, newStatus: OrderStatus) {
    start(async () => {
      const res = await updateOrderStatus(orderId, newStatus);
      if (res.success) {
        toast.success(`Order marked as ${STATUS_LABELS[newStatus]}`);
        setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
      } else {
        toast.error(res.error ?? "Failed to update status");
      }
    });
  }

  if (orders.length === 0) {
    return (
      <div className="border-2 border-dashed border-gray-200 rounded-2xl py-14 flex flex-col items-center justify-center gap-3 text-gray-400">
        <FiShoppingBag className="h-8 w-8" />
        <p className="text-sm">No orders yet.</p>
        <p className="text-xs">Orders will appear here when customers checkout.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-800">Orders</h2>
        <p className="text-xs text-gray-400 mt-0.5">{orders.length} order{orders.length === 1 ? "" : "s"}</p>
      </div>

      <div className="space-y-3">
        {orders.map((order) => {
          const nextStatuses = STATUS_FLOW[order.status] ?? [];
          const date = new Date(order.createdAt).toLocaleDateString("en-GB", {
            day: "numeric", month: "short", year: "numeric",
          });

          return (
            <div key={order.id} className="border border-gray-100 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-gray-800 font-mono">{order.orderRef}</span>
                    <OrderStatusBadge status={order.status} label={STATUS_LABELS[order.status]} />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{date} · {order.deliveryMethod.replace(/_/g, " ")} · {order.items.length} item{order.items.length === 1 ? "" : "s"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800">{order.total.toLocaleString()} TND</p>
                  {order.deliveryCost > 0 && (
                    <p className="text-xs text-gray-400">+{order.deliveryCost} delivery</p>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs text-gray-500">
                    <span>{item.product.name} × {item.quantity}</span>
                    <span>{(item.unitPrice * item.quantity).toLocaleString()} TND</span>
                  </div>
                ))}
              </div>

              {/* Status actions */}
              {nextStatuses.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-gray-100">
                  <span className="text-xs text-gray-400">Update:</span>
                  {nextStatuses.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleStatusChange(order.id, s)}
                      className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:border-primary hover:text-primary transition-colors font-medium"
                    >
                      → {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
