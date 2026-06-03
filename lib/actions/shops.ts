"use server";

import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

const ACTIVE_SHOP = { status: "ACTIVE" as const };

export const getShops = cache(async (destinationSlug?: string, categories?: string[]) => {
  return prisma.shop.findMany({
    where: {
      ...ACTIVE_SHOP,
      ...(destinationSlug ? { destination: { slug: destinationSlug } } : {}),
      ...(categories && categories.length > 0 ? { category: { in: categories } } : {}),
    },
    include: {
      images: { take: 3 },
      products: {
        take: 3,
        include: { images: { take: 1 } },
        orderBy: { featured: "desc" },
      },
      destination: { select: { city: true, slug: true } },
    },
    orderBy: [{ featuredInHome: "desc" }, { nbReviews: "desc" }],
  });
});

const DEFAULT_SHOPS_PER_PAGE = 12;

export const getShopsPaginated = cache(
  async ({
    destinationSlug,
    categories,
    search,
    page = 1,
    perPage = DEFAULT_SHOPS_PER_PAGE,
  }: {
    destinationSlug?: string;
    categories?: string[];
    search?: string;
    page?: number;
    perPage?: number;
  }) => {
    const where = {
      ...ACTIVE_SHOP,
      ...(destinationSlug ? { destination: { slug: destinationSlug } } : {}),
      ...(categories && categories.length > 0 ? { category: { in: categories } } : {}),
      ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
    };
    const [shops, total] = await Promise.all([
      prisma.shop.findMany({
        where,
        include: {
          images: { take: 3 },
          products: {
            take: 3,
            include: { images: { take: 1 } },
            orderBy: { featured: "desc" },
          },
          destination: { select: { city: true, slug: true } },
        },
        orderBy: [{ featuredInHome: "desc" }, { nbReviews: "desc" }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.shop.count({ where }),
    ]);
    return { shops, total, page, perPage, totalPages: Math.ceil(total / perPage) };
  }
);

export const getShopBySlug = cache(async (slug: string) => {
  const shop = await prisma.shop.findFirst({
    where: { slug, ...ACTIVE_SHOP },
    include: {
      images: true,
      products: {
        include: { images: { take: 1 } },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      },
      businessProfile: {
        select: { name: true, country: true, profileImage: true, isVerified: true, createdAt: true },
      },
      destination: { select: { city: true, country: true, slug: true } },
      hours: true,
    },
  });
  if (!shop) notFound();
  return shop;
});

export const getShopHours = cache(async (shopId: string) => {
  return prisma.shopHours.findMany({
    where: { shopId },
    orderBy: { id: "asc" },
  });
});

export async function upsertShopHours(
  shopId: string,
  hours: {
    day: string;
    opening: string | null;
    closing: string | null;
    isClosed: boolean;
    isFullDayOpening: boolean;
  }[]
) {
  await prisma.shopHours.deleteMany({ where: { shopId } });
  await prisma.shopHours.createMany({
    data: hours.map((h) => ({ ...h, shopId })),
  });
  return { success: true as const };
}

export const getRelatedShops = cache(
  async (shopId: string, destinationId: string | null | undefined, limit = 6) => {
    if (!destinationId) return [];
    return prisma.shop.findMany({
      where: { id: { not: shopId }, destinationId, ...ACTIVE_SHOP },
      include: {
        images: { take: 3 },
        products: {
          take: 3,
          include: { images: { take: 1 } },
          orderBy: { featured: "desc" },
        },
        destination: { select: { city: true, slug: true } },
      },
      orderBy: [{ featuredInHome: "desc" }, { nbReviews: "desc" }],
      take: limit,
    });
  }
);

export const getFeaturedShops = cache(async (destinationSlug?: string) => {
  const shops = await prisma.shop.findMany({
    where: {
      ...ACTIVE_SHOP,
      featuredInHome: true,
      ...(destinationSlug ? { destination: { slug: destinationSlug } } : {}),
    },
    include: {
      images: { take: 1 },
      products: {
        take: 3,
        include: { images: { take: 1 } },
        orderBy: { featured: "desc" },
      },
      destination: { select: { city: true, slug: true } },
    },
    take: 8,
  });

  if (shops.length === 0) {
    return prisma.shop.findMany({
      where: {
        ...ACTIVE_SHOP,
        ...(destinationSlug ? { destination: { slug: destinationSlug } } : {}),
      },
      include: {
        images: { take: 1 },
        products: {
          take: 3,
          include: { images: { take: 1 } },
          orderBy: { featured: "desc" },
        },
        destination: { select: { city: true, slug: true } },
      },
      take: 8,
    });
  }

  return shops;
});

export const getProductBySlug = cache(async (shopSlug: string, productSlug: string) => {
  return prisma.product.findFirst({
    where: { slug: productSlug, shop: { slug: shopSlug, ...ACTIVE_SHOP } },
    include: {
      images: true,
      shop: {
        select: {
          id: true,
          slug: true,
          name: true,
          arabicName: true,
          logo: true,
          category: true,
          deliveryMethods: true,
          deliveryFee: true,
          freeShippingAbove: true,
          minOrderAmount: true,
        },
      },
    },
  });
});

export const getProductsByShop = cache(async (shopId: string, category?: string) => {
  return prisma.product.findMany({
    where: {
      shopId,
      ...(category ? { category } : {}),
    },
    include: { images: { take: 1 } },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });
});

export const getFeaturedProducts = cache(async (destinationSlug?: string) => {
  return prisma.product.findMany({
    where: {
      featured: true,
      isHandmade: true,
      shop: {
        ...ACTIVE_SHOP,
        ...(destinationSlug ? { destination: { slug: destinationSlug } } : {}),
      },
    },
    include: {
      images: { take: 1 },
      shop: { select: { name: true, slug: true } },
    },
    take: 8,
  });
});

export const getShopProducts = cache(
  async (shopId: string, excludeProductId?: string) => {
    return prisma.product.findMany({
      where: {
        shopId,
        ...(excludeProductId ? { id: { not: excludeProductId } } : {}),
      },
      include: { images: { take: 1 } },
      take: 6,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    });
  }
);

const DEFAULT_PRODUCTS_PER_PAGE = 24;

export const getProductsPaginated = cache(
  async ({
    destinationSlug,
    categories,
    handmade,
    search,
    page = 1,
    perPage = DEFAULT_PRODUCTS_PER_PAGE,
  }: {
    destinationSlug?: string;
    categories?: string[];
    handmade?: boolean;
    search?: string;
    page?: number;
    perPage?: number;
  }) => {
    const where = {
      shop: {
        ...ACTIVE_SHOP,
        ...(destinationSlug ? { destination: { slug: destinationSlug } } : {}),
      },
      ...(categories && categories.length > 0 ? { category: { in: categories } } : {}),
      ...(handmade ? { isHandmade: true } : {}),
      ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
    };
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: { take: 1 },
          shop: { select: { name: true, slug: true } },
        },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.product.count({ where }),
    ]);
    return { products, total, page, perPage, totalPages: Math.ceil(total / perPage) };
  }
);
