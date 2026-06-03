import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/utils/constants";

const LOCALES = ["en", "fr", "ar"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [shops, products, transfers, rentals] = await Promise.all([
    prisma.shop.findMany({
      select: { slug: true, createdAt: true },
      orderBy: { id: "desc" },
    }),
    prisma.product.findMany({
      select: {
        slug:      true,
        createdAt: true,
        shop:      { select: { slug: true } },
      },
      orderBy: { id: "desc" },
    }),
    prisma.transfer.findMany({
      where:   { status: "ACTIVE" },
      select:  { slug: true, createdAt: true },
      orderBy: { id: "desc" },
    }),
    prisma.rental.findMany({
      where:   { status: "ACTIVE" },
      select:  { slug: true, createdAt: true },
      orderBy: { id: "desc" },
    }),
  ]);

  const shopEntries: MetadataRoute.Sitemap = shops.flatMap((shop) =>
    LOCALES.map((locale) => ({
      url:              `${SITE_URL}/${locale}/shops/${shop.slug}`,
      lastModified:     shop.createdAt,
      changeFrequency:  "weekly" as const,
      priority:         0.7,
    }))
  );

  const productEntries: MetadataRoute.Sitemap = products.flatMap((product) =>
    LOCALES.map((locale) => ({
      url:             `${SITE_URL}/${locale}/shops/${product.shop.slug}/products/${product.slug}`,
      lastModified:    product.createdAt,
      changeFrequency: "weekly" as const,
      priority:        0.6,
    }))
  );

  const transferEntries: MetadataRoute.Sitemap = transfers.flatMap((tr) =>
    LOCALES.map((locale) => ({
      url:             `${SITE_URL}/${locale}/transport/transfers/${tr.slug}`,
      lastModified:    tr.createdAt,
      changeFrequency: "weekly" as const,
      priority:        0.7,
    }))
  );

  const rentalEntries: MetadataRoute.Sitemap = rentals.flatMap((r) =>
    LOCALES.map((locale) => ({
      url:             `${SITE_URL}/${locale}/transport/rentals/${r.slug}`,
      lastModified:    r.createdAt,
      changeFrequency: "weekly" as const,
      priority:        0.7,
    }))
  );

  return [...shopEntries, ...productEntries, ...transferEntries, ...rentalEntries];
}
