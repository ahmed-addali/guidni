"use server";

import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateBookingRef } from "@/lib/utils/booking-ref";
import { ProductOrderSchema } from "@/lib/validations/shop";

const DELIVERY_COSTS: Record<string, number> = {
  PICKUP:         0,
  LOCAL_DELIVERY: 5,
  NATIONWIDE:     10,
  INTERNATIONAL:  20,
};

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createProductOrders(
  rawItems: { productId: string; shopId: string; quantity: number; unitPrice: number }[],
  rawDelivery: {
    deliveryMethod:  string;
    deliveryAddress?: string;
    deliveryCity?:   string;
    deliveryCountry?: string;
    notes?:          string;
  }
): Promise<{ success: true; data: { orderRefs: string[] } } | { success: false; error: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const parsed = ProductOrderSchema.safeParse({ items: rawItems, ...rawDelivery });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation error" };
  }

  const { items, deliveryMethod, deliveryAddress, deliveryCity, deliveryCountry, notes } = parsed.data;
  const productIds = items.map((i) => i.productId);

  // Fetch authoritative prices + stock from DB
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id:    true,
      price: true,
      stock: true,
      shopId: true,
      shop: {
        select: {
          id:               true,
          freeShippingAbove: true,
        },
      },
    },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Validate stock
  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) return { success: false, error: `Product not found: ${item.productId}` };
    if (product.stock < item.quantity) {
      return { success: false, error: `Insufficient stock for one or more products.` };
    }
  }

  // Group by shopId
  const shopGroups: Record<string, typeof items> = {};
  for (const item of items) {
    const product = productMap.get(item.productId)!;
    const shopId = product.shopId;
    (shopGroups[shopId] ??= []).push(item);
  }

  const orderRefs: string[] = [];

  // Create one ProductOrder per shop
  for (const [shopId, shopItems] of Object.entries(shopGroups)) {
    const shopProduct = productMap.get(shopItems[0].productId)!;
    const shop = shopProduct.shop;

    // Use server-side price snapshots
    const subtotal = shopItems.reduce((sum, item) => {
      const product = productMap.get(item.productId)!;
      return sum + product.price * item.quantity;
    }, 0);

    const baseCost  = DELIVERY_COSTS[deliveryMethod] ?? 0;
    const deliveryCost =
      shop.freeShippingAbove != null && subtotal >= shop.freeShippingAbove
        ? 0
        : baseCost;
    const total = subtotal + deliveryCost;

    const orderRef = generateBookingRef();
    orderRefs.push(orderRef);

    await prisma.productOrder.create({
      data: {
        orderRef,
        status:          "PENDING",
        deliveryMethod:  deliveryMethod as never,
        deliveryAddress: deliveryAddress ?? null,
        deliveryCity:    deliveryCity    ?? null,
        deliveryCountry: deliveryCountry ?? null,
        notes:           notes           ?? null,
        subtotal,
        deliveryCost,
        total,
        userId:  session.user.id,
        shopId,
        items: {
          create: shopItems.map((item) => ({
            quantity:  item.quantity,
            unitPrice: productMap.get(item.productId)!.price,
            productId: item.productId,
          })),
        },
      },
    });
  }

  return { success: true, data: { orderRefs } };
}

// ─── Read ──────────────────────────────────────────────────────────────────────

export const getUserOrders = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return [];

  return prisma.productOrder.findMany({
    where:   { userId: session.user.id },
    include: {
      shop: { select: { id: true, name: true, logo: true, slug: true } },
      items: {
        include: {
          product: {
            select: {
              id:     true,
              name:   true,
              images: { select: { url: true }, take: 1 },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
});

export const getUserOrderByRef = cache(async (orderRef: string) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  return prisma.productOrder.findFirst({
    where: { orderRef, userId: session.user.id },
    include: {
      shop: {
        select: {
          id:       true,
          name:     true,
          logo:     true,
          slug:     true,
          phone:    true,
          address:  true,
          city:     true,
          location: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              id:     true,
              name:   true,
              slug:   true,
              images: { select: { url: true }, take: 1 },
            },
          },
        },
      },
    },
  });
});

// ─── Purchase guards ───────────────────────────────────────────────────────────

export const hasCompletedOrderFromShop = cache(async (shopId: string) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return false;

  const order = await prisma.productOrder.findFirst({
    where: {
      userId: session.user.id,
      shopId,
      status: { in: ["DELIVERED"] },
    },
  });
  return !!order;
});

export const hasPurchasedProduct = cache(async (productId: string) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return false;

  const item = await prisma.productOrderItem.findFirst({
    where: {
      productId,
      order: {
        userId: session.user.id,
        status: { in: ["DELIVERED"] },
      },
    },
  });
  return !!item;
});
