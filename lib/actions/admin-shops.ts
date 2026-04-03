"use server";

import { headers } from "next/headers";
import { cache } from "react";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session.user;
}

// ─── Shops ────────────────────────────────────────────────────────────────────

export const getAdminShops = cache(async () => {
  await requireAdmin();

  return prisma.shop.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id:             true,
      name:           true,
      slug:           true,
      category:       true,
      country:        true,
      city:           true,
      isOpen:         true,
      featuredInHome: true,
      createdAt:      true,
      businessProfile: { select: { name: true, isVerified: true } },
      destination:    { select: { city: true } },
      _count:         { select: { products: true, orders: true } },
    },
  });
});

export async function toggleShopFeatured(shopId: string, featured: boolean) {
  await requireAdmin();

  await prisma.shop.update({ where: { id: shopId }, data: { featuredInHome: featured } });
  revalidatePath("/admin/shops");
  return { success: true as const };
}

export async function toggleShopOpen(shopId: string, isOpen: boolean) {
  await requireAdmin();

  await prisma.shop.update({ where: { id: shopId }, data: { isOpen } });
  revalidatePath("/admin/shops");
  return { success: true as const };
}

// ─── Products ─────────────────────────────────────────────────────────────────

export const getAdminProducts = cache(async () => {
  await requireAdmin();

  return prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id:          true,
      name:        true,
      slug:        true,
      category:    true,
      price:       true,
      stock:       true,
      isHandmade:  true,
      featured:    true,
      createdAt:   true,
      shop: {
        select: {
          id:   true,
          name: true,
          slug: true,
          destination: { select: { city: true } },
        },
      },
      images: { select: { url: true }, take: 1 },
    },
  });
});

export async function toggleProductFeatured(productId: string, featured: boolean) {
  await requireAdmin();

  await prisma.product.update({ where: { id: productId }, data: { featured } });
  revalidatePath("/admin/shops");
  return { success: true as const };
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export const getAdminOrders = cache(async () => {
  await requireAdmin();

  return prisma.productOrder.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id:             true,
      orderRef:       true,
      status:         true,
      deliveryMethod: true,
      total:          true,
      createdAt:      true,
      shop:  { select: { id: true, name: true, slug: true } },
      user:  { select: { name: true, email: true } },
      items: { select: { quantity: true, unitPrice: true } },
    },
  });
});
