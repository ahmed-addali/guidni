"use server";

import { cache } from "react";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ShopSchema, ProductSchema } from "@/lib/validations/shop";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getProfileId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  const profile = await prisma.businessProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  return profile?.id ?? null;
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function uniqueSlug(base: string) {
  let slug = slugify(base);
  let i = 0;
  while (await prisma.shop.findUnique({ where: { slug } })) {
    slug = `${slugify(base)}-${++i}`;
  }
  return slug;
}

async function uniqueProductSlug(base: string) {
  let slug = slugify(base);
  let i = 0;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${slugify(base)}-${++i}`;
  }
  return slug;
}

// ─── Shop CRUD ────────────────────────────────────────────────────────────────

export const getMyShops = cache(async () => {
  const profileId = await getProfileId();
  if (!profileId) return [];

  return prisma.shop.findMany({
    where: { profileId },
    include: {
      images:   { select: { id: true, url: true }, take: 1 },
      products: { select: { id: true } },
      orders:   { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });
});

export const getMyShopBySlug = cache(async (slug: string) => {
  const profileId = await getProfileId();
  if (!profileId) return null;

  return prisma.shop.findFirst({
    where: { slug, profileId },
    include: {
      images:   { select: { id: true, url: true } },
      products: {
        include: { images: { select: { id: true, url: true }, take: 1 } },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      },
      orders: {
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      destination: { select: { id: true, slug: true, city: true, country: true } },
    },
  });
});

export async function createShop(rawData: unknown) {
  const profileId = await getProfileId();
  if (!profileId) return { success: false as const, error: "Not authenticated" };

  const parsed = ShopSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Validation error" };
  }

  const slug = await uniqueSlug(parsed.data.name);
  const shop = await prisma.shop.create({
    data: { ...parsed.data, slug, profileId },
  });

  revalidatePath("/partner/shops");
  return { success: true as const, data: { slug: shop.slug } };
}

export async function updateShop(shopId: string, rawData: unknown) {
  const profileId = await getProfileId();
  if (!profileId) return { success: false as const, error: "Not authenticated" };

  const shop = await prisma.shop.findFirst({ where: { id: shopId, profileId } });
  if (!shop) return { success: false as const, error: "Shop not found" };

  const parsed = ShopSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Validation error" };
  }

  await prisma.shop.update({ where: { id: shopId }, data: parsed.data });
  revalidatePath("/partner/shops");
  return { success: true as const };
}

export async function deleteShop(shopId: string) {
  const profileId = await getProfileId();
  if (!profileId) return { success: false as const, error: "Not authenticated" };

  const shop = await prisma.shop.findFirst({ where: { id: shopId, profileId } });
  if (!shop) return { success: false as const, error: "Shop not found" };

  await prisma.shop.delete({ where: { id: shopId } });
  revalidatePath("/partner/shops");
  return { success: true as const };
}

// ─── Shop images ──────────────────────────────────────────────────────────────

export async function addShopImage(shopId: string, url: string) {
  const profileId = await getProfileId();
  if (!profileId) return { success: false as const, error: "Not authenticated" };

  const shop = await prisma.shop.findFirst({ where: { id: shopId, profileId } });
  if (!shop) return { success: false as const, error: "Shop not found" };

  await prisma.images.create({ data: { url, shopId } });
  revalidatePath("/partner/shops");
  return { success: true as const };
}

export async function removeShopImage(imageId: string) {
  const profileId = await getProfileId();
  if (!profileId) return { success: false as const, error: "Not authenticated" };

  const image = await prisma.images.findUnique({
    where:  { id: imageId },
    select: { shopId: true },
  });
  if (!image?.shopId) return { success: false as const, error: "Image not found" };

  const shop = await prisma.shop.findFirst({ where: { id: image.shopId, profileId } });
  if (!shop) return { success: false as const, error: "Unauthorized" };

  await prisma.images.delete({ where: { id: imageId } });
  revalidatePath("/partner/shops");
  return { success: true as const };
}

// ─── Product CRUD ─────────────────────────────────────────────────────────────

export const getMyProductBySlug = cache(async (shopSlug: string, productSlug: string) => {
  const profileId = await getProfileId();
  if (!profileId) return null;

  return prisma.product.findFirst({
    where: {
      slug:  productSlug,
      shop:  { slug: shopSlug, profileId },
    },
    include: {
      images: { select: { id: true, url: true } },
      shop:   { select: { id: true, slug: true, name: true } },
    },
  });
});

export async function createProduct(shopId: string, rawData: unknown) {
  const profileId = await getProfileId();
  if (!profileId) return { success: false as const, error: "Not authenticated" };

  const shop = await prisma.shop.findFirst({ where: { id: shopId, profileId } });
  if (!shop) return { success: false as const, error: "Shop not found" };

  const parsed = ProductSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Validation error" };
  }

  const slug = await uniqueProductSlug(parsed.data.name);
  const product = await prisma.product.create({
    data: { ...parsed.data, slug, shopId },
  });

  revalidatePath("/partner/shops");
  return { success: true as const, data: { id: product.id, slug: product.slug } };
}

export async function updateProduct(productId: string, rawData: unknown) {
  const profileId = await getProfileId();
  if (!profileId) return { success: false as const, error: "Not authenticated" };

  const product = await prisma.product.findFirst({
    where:  { id: productId },
    select: { id: true, shop: { select: { profileId: true } } },
  });
  if (!product || product.shop.profileId !== profileId) {
    return { success: false as const, error: "Product not found" };
  }

  const parsed = ProductSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Validation error" };
  }

  await prisma.product.update({ where: { id: productId }, data: parsed.data });
  revalidatePath("/partner/shops");
  return { success: true as const };
}

export async function deleteProduct(productId: string) {
  const profileId = await getProfileId();
  if (!profileId) return { success: false as const, error: "Not authenticated" };

  const product = await prisma.product.findFirst({
    where:  { id: productId },
    select: { id: true, shop: { select: { profileId: true } } },
  });
  if (!product || product.shop.profileId !== profileId) {
    return { success: false as const, error: "Product not found" };
  }

  await prisma.product.delete({ where: { id: productId } });
  revalidatePath("/partner/shops");
  return { success: true as const };
}

// ─── Product images ───────────────────────────────────────────────────────────

export async function addProductImage(productId: string, url: string) {
  const profileId = await getProfileId();
  if (!profileId) return { success: false as const, error: "Not authenticated" };

  const product = await prisma.product.findFirst({
    where:  { id: productId },
    select: { id: true, shop: { select: { profileId: true } } },
  });
  if (!product || product.shop.profileId !== profileId) {
    return { success: false as const, error: "Unauthorized" };
  }

  await prisma.images.create({ data: { url, productId } });
  revalidatePath("/partner/shops");
  return { success: true as const };
}

export async function removeProductImage(imageId: string) {
  const profileId = await getProfileId();
  if (!profileId) return { success: false as const, error: "Not authenticated" };

  const image = await prisma.images.findUnique({
    where:  { id: imageId },
    select: { productId: true },
  });
  if (!image?.productId) return { success: false as const, error: "Image not found" };

  const product = await prisma.product.findFirst({
    where:  { id: image.productId },
    select: { shop: { select: { profileId: true } } },
  });
  if (!product || product.shop.profileId !== profileId) {
    return { success: false as const, error: "Unauthorized" };
  }

  await prisma.images.delete({ where: { id: imageId } });
  revalidatePath("/partner/shops");
  return { success: true as const };
}

// ─── Order management ─────────────────────────────────────────────────────────

export async function updateOrderStatus(orderId: string, status: string) {
  const profileId = await getProfileId();
  if (!profileId) return { success: false as const, error: "Not authenticated" };

  const order = await prisma.productOrder.findFirst({
    where:  { id: orderId },
    select: { id: true, shop: { select: { profileId: true } } },
  });
  if (!order || order.shop.profileId !== profileId) {
    return { success: false as const, error: "Order not found" };
  }

  await prisma.productOrder.update({
    where: { id: orderId },
    data:  { status: status as never },
  });
  revalidatePath("/partner/shops");
  return { success: true as const };
}
