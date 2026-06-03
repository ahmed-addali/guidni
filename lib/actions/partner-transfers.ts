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

export const getMyTransfers = cache(async (page = 1, limit = 12) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { transfers: [], total: 0, totalPages: 0 };
  const profile = await prisma.businessProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) return { transfers: [], total: 0, totalPages: 0 };

  const skip = (page - 1) * limit;

  const [transfers, total] = await Promise.all([
    prisma.transfer.findMany({
      where:   { profileId: profile.id },
      select: {
        id:             true,
        slug:           true,
        title:          true,
        type:           true,
        status:         true,
        pricePerTrip:   true,
        pricePerHour:   true,
        destination:    { select: { city: true } },
        images:         { take: 1, select: { url: true } },
        _count:         { select: { reservations: true } },
      },
      orderBy: { title: "asc" },
      skip,
      take: limit,
    }),
    prisma.transfer.count({ where: { profileId: profile.id } }),
  ]);

  return { transfers, total, totalPages: Math.ceil(total / limit) };
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

export async function getTransferReviews(transferId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { reviews: [], guidniReview: null };

  const [reviews, guidniReview] = await Promise.all([
    prisma.review.findMany({
      where: { relationType: "TRANSFER", relationId: transferId },
      include: { user: { select: { name: true, image: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.guidniReview.findUnique({
      where: { relationType_relationId: { relationType: "TRANSFER", relationId: transferId } },
      select: {
        id: true,
        status: true,
        reviewerName: true,
        visitedAt: true,
        summaryQuote: true,
        fullReview: true,
        whatWeLoved: true,
        worthKnowing: true,
        bestFor: true,
        scoreTotal: true,
        publishedAt: true,
        images: { select: { url: true }, take: 3 },
      },
    }),
  ]);

  return { reviews, guidniReview };
}

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
  revalidatePath(`/partner/transfers/${existing.slug}`);
  return { success: true as const, data: updated };
}

export async function updateTransferStatus(
  transferId: string,
  status: "DRAFT" | "ACTIVE"
) {
  const profile = await getProfile();
  if (!profile) return { success: false as const, error: "Not authenticated" };

  const existing = await prisma.transfer.findUnique({ where: { id: transferId } });
  if (!existing || existing.profileId !== profile.id)
    return { success: false as const, error: "Not found" };

  await prisma.transfer.update({ where: { id: transferId }, data: { status } });
  revalidatePath("/partner/transfers");
  revalidatePath(`/partner/transfers/${existing.slug}`);
  return { success: true as const };
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

  const maxOrder = await prisma.images.aggregate({
    where: { transferId },
    _max: { order: true },
  });
  const image = await prisma.images.create({
    data: { url, transferId, order: (maxOrder._max.order ?? -1) + 1 },
  });
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

export async function reorderTransferImages(transferId: string, orderedIds: string[]) {
  const profile = await getProfile();
  if (!profile) return { success: false as const, error: "Not authenticated" };

  const transfer = await prisma.transfer.findUnique({ where: { id: transferId } });
  if (!transfer || transfer.profileId !== profile.id)
    return { success: false as const, error: "Not found" };

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.images.update({ where: { id }, data: { order: index } })
    )
  );
  revalidatePath(`/partner/transfers/${transfer.slug}`);
  return { success: true as const };
}

export async function setTransferImageAsCover(imageId: string, transferId: string) {
  const profile = await getProfile();
  if (!profile) return { success: false as const, error: "Not authenticated" };

  const transfer = await prisma.transfer.findUnique({ where: { id: transferId } });
  if (!transfer || transfer.profileId !== profile.id)
    return { success: false as const, error: "Not found" };

  const allImages = await prisma.images.findMany({
    where: { transferId },
    orderBy: { order: "asc" },
  });
  const reordered = [
    imageId,
    ...allImages.filter((img) => img.id !== imageId).map((img) => img.id),
  ];
  await prisma.$transaction(
    reordered.map((id, index) =>
      prisma.images.update({ where: { id }, data: { order: index } })
    )
  );
  revalidatePath(`/partner/transfers/${transfer.slug}`);
  return { success: true as const };
}

export async function toggleTransferBlockedDate(transferId: string, dateStr: string) {
  const profile = await getProfile();
  if (!profile) return { success: false as const, error: "Not authenticated" };

  const transfer = await prisma.transfer.findUnique({ where: { id: transferId } });
  if (!transfer || transfer.profileId !== profile.id)
    return { success: false as const, error: "Unauthorized" };

  const date = new Date(dateStr + "T00:00:00.000Z");

  const existing = await prisma.transferBlockedDate.findUnique({
    where: { transferId_date: { transferId, date } },
  });

  if (existing) {
    await prisma.transferBlockedDate.delete({ where: { id: existing.id } });
    return { success: true as const, blocked: false };
  } else {
    await prisma.transferBlockedDate.create({ data: { transferId, date } });
    return { success: true as const, blocked: true };
  }
}

export async function getTransferAvailabilityData(transferId: string) {
  const profile = await getProfile();
  if (!profile) return {
    blocked: [] as string[],
    reservations: [] as { date: string; time: string; status: string; bookingRef: string; passengers: number }[],
  };

  const transfer = await prisma.transfer.findUnique({ where: { id: transferId } });
  if (!transfer || transfer.profileId !== profile.id) return {
    blocked: [] as string[],
    reservations: [] as { date: string; time: string; status: string; bookingRef: string; passengers: number }[],
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [blockedRows, reservations] = await Promise.all([
    prisma.transferBlockedDate.findMany({
      where: { transferId },
      select: { date: true },
      orderBy: { date: "asc" },
    }),
    prisma.transferReservation.findMany({
      where: {
        transferId,
        status: { in: ["PENDING", "CONFIRMED"] },
        date: { gte: today },
      },
      select: { date: true, time: true, status: true, bookingRef: true, passengers: true, hoursRequested: true, contactName: true },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    }),
  ]);

  return {
    blocked: blockedRows.map((d) => d.date.toISOString().slice(0, 10)),
    reservations: reservations.map((r) => ({
      date:           r.date.toISOString().slice(0, 10),
      time:           r.time,
      status:         r.status,
      bookingRef:     r.bookingRef,
      passengers:     r.passengers,
      hoursRequested: r.hoursRequested,
      contactName:    r.contactName,
    })),
  };
}
