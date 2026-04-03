"use server";

import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import type { PassInput } from "@/lib/validations/pass";

// ─── Public queries ────────────────────────────────────────────────────────────

export const getPassesByDestination = cache(async (destinationSlug?: string) => {
  const where = destinationSlug
    ? { destination: { slug: destinationSlug } }
    : {};

  return db.pass.findMany({
    where,
    orderBy: [{ popular: "desc" }, { price: "asc" }],
    include: {
      destination: true,
      fixedActivities: {
        include: { images: { take: 1 } },
      },
      optionalActivities: {
        include: { images: { take: 1 } },
      },
    },
  });
});

export const getFeaturedPasses = cache(async (destinationSlug?: string) => {
  return db.pass.findMany({
    where: destinationSlug ? { destination: { slug: destinationSlug } } : {},
    take: 6,
    orderBy: [{ popular: "desc" }, { price: "asc" }],
    select: {
      id: true,
      passKey: true,
      name: true,
      arabicName: true,
      description: true,
      price: true,
      discount: true,
      popular: true,
      optionalCount: true,
      destination: { select: { slug: true, city: true } },
      fixedActivities: { select: { id: true, title: true }, take: 3 },
      optionalActivities: { select: { id: true } },
    },
  });
});

export type FeaturedPass = Awaited<ReturnType<typeof getFeaturedPasses>>[number];

export const getPassByKey = cache(async (passKey: string) => {
  return db.pass.findUnique({
    where: { passKey },
    include: {
      destination: true,
      fixedActivities: {
        include: { images: true },
      },
      optionalActivities: {
        include: { images: true },
      },
    },
  });
});

// ─── Admin mutations ──────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");
  return session;
}

export async function createPass(data: PassInput) {
  await requireAdmin();

  const existing = await db.pass.findUnique({ where: { passKey: data.passKey } });
  if (existing) return { success: false as const, error: "Pass key already exists" };

  const pass = await db.pass.create({
    data: {
      passKey:           data.passKey,
      name:              data.name,
      arabicName:        data.arabicName || null,
      description:       data.description || null,
      arabicDescription: data.arabicDescription || null,
      price:             data.price,
      discount:          data.discount,
      popular:           data.popular,
      optionalCount:     data.optionalCount,
      destinationId:     data.destinationId || null,
    },
  });

  return { success: true as const, data: pass };
}

export async function updatePass(passKey: string, data: Partial<PassInput>) {
  await requireAdmin();

  const pass = await db.pass.update({
    where: { passKey },
    data: {
      name:              data.name,
      arabicName:        data.arabicName || null,
      description:       data.description || null,
      arabicDescription: data.arabicDescription || null,
      price:             data.price,
      discount:          data.discount,
      popular:           data.popular,
      optionalCount:     data.optionalCount,
      destinationId:     data.destinationId || null,
    },
  });

  return { success: true as const, data: pass };
}

export async function deletePass(passKey: string) {
  await requireAdmin();
  await db.pass.delete({ where: { passKey } });
  return { success: true as const };
}

export async function updatePassFixedActivities(passKey: string, activityIds: string[]) {
  await requireAdmin();

  await db.pass.update({
    where: { passKey },
    data: {
      fixedActivities: { set: activityIds.map((id) => ({ id })) },
    },
  });

  return { success: true as const };
}

export async function updatePassOptionalActivities(passKey: string, activityIds: string[]) {
  await requireAdmin();

  await db.pass.update({
    where: { passKey },
    data: {
      optionalActivities: { set: activityIds.map((id) => ({ id })) },
    },
  });

  return { success: true as const };
}

// ─── Admin: get all activities for assignment UI ──────────────────────────────

export const getAllActivities = cache(async (destinationSlug?: string) => {
  const where = destinationSlug ? { destination: { slug: destinationSlug } } : {};
  return db.activity.findMany({
    where,
    select: { id: true, slug: true, title: true, city: true, images: { take: 1 } },
    orderBy: { title: "asc" },
  });
});
