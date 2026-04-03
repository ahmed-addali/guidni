"use server";

import { cache } from "react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { TransferSchema, type TransferInput } from "@/lib/validations/transfer";
import { generateBookingRef } from "@/lib/utils/booking-ref";

async function getProfile() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  return prisma.businessProfile.findUnique({ where: { userId: session.user.id } });
}

export const getMyTransfers = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return [];
  const profile = await prisma.businessProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) return [];
  return prisma.transfer.findMany({
    where: { profileId: profile.id },
    include: { images: { take: 1 }, _count: { select: { reservations: true } } },
    orderBy: { title: "asc" },
  });
});

export const getMyTransferBySlug = cache(async (slug: string) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  const profile = await prisma.businessProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) return null;
  return prisma.transfer.findFirst({
    where: { slug, profileId: profile.id },
    include: { images: true, destination: true },
  });
});

export async function createTransfer(data: TransferInput) {
  const profile = await getProfile();
  if (!profile) return { success: false as const, error: "Not authenticated" };

  const parsed = TransferSchema.safeParse(data);
  if (!parsed.success) return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid data" };

  const { destinationId, ...rest } = parsed.data;

  const baseSlug = rest.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  const suffix = generateBookingRef().replace("GN-", "").toLowerCase();
  const slug = `${baseSlug}-${suffix}`;

  const transfer = await prisma.transfer.create({
    data: {
      ...rest,
      slug,
      profileId: profile.id,
      ...(destinationId ? { destinationId } : {}),
    },
  });

  revalidatePath("/partner/transfers");
  return { success: true as const, data: transfer };
}

export async function updateTransfer(transferId: string, data: TransferInput) {
  const profile = await getProfile();
  if (!profile) return { success: false as const, error: "Not authenticated" };

  const existing = await prisma.transfer.findUnique({ where: { id: transferId } });
  if (!existing || existing.profileId !== profile.id)
    return { success: false as const, error: "Not found" };

  const parsed = TransferSchema.safeParse(data);
  if (!parsed.success) return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid data" };

  const { destinationId, ...rest } = parsed.data;

  const updated = await prisma.transfer.update({
    where: { id: transferId },
    data: {
      ...rest,
      destinationId: destinationId ?? null,
    },
  });

  revalidatePath("/partner/transfers");
  return { success: true as const, data: updated };
}

export async function deleteTransfer(transferId: string) {
  const profile = await getProfile();
  if (!profile) return { success: false as const, error: "Not authenticated" };

  const existing = await prisma.transfer.findUnique({ where: { id: transferId } });
  if (!existing || existing.profileId !== profile.id)
    return { success: false as const, error: "Not found" };

  await prisma.transfer.delete({ where: { id: transferId } });
  revalidatePath("/partner/transfers");
  return { success: true as const };
}

export async function addTransferImage(transferId: string, url: string) {
  const profile = await getProfile();
  if (!profile) return { success: false as const, error: "Not authenticated" };

  const transfer = await prisma.transfer.findUnique({ where: { id: transferId } });
  if (!transfer || transfer.profileId !== profile.id)
    return { success: false as const, error: "Not found" };

  const image = await prisma.images.create({ data: { url, transferId } });
  revalidatePath(`/partner/transfers/${transfer.slug}`);
  return { success: true as const, data: image };
}

export async function removeTransferImage(imageId: string) {
  const profile = await getProfile();
  if (!profile) return { success: false as const, error: "Not authenticated" };

  const image = await prisma.images.findUnique({
    where: { id: imageId },
    include: { transfer: { select: { profileId: true, slug: true } } },
  });
  if (!image?.transfer || image.transfer.profileId !== profile.id)
    return { success: false as const, error: "Not found" };

  await prisma.images.delete({ where: { id: imageId } });
  revalidatePath(`/partner/transfers/${image.transfer.slug}`);
  return { success: true as const };
}
