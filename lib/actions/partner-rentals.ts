"use server";

import { cache } from "react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { RentalSchema, type RentalInput } from "@/lib/validations/rental";
import { generateBookingRef } from "@/lib/utils/booking-ref";

async function getProfile() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  return prisma.businessProfile.findUnique({ where: { userId: session.user.id } });
}

export const getMyRentals = cache(async (page = 1, limit = 12) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { rentals: [], total: 0, totalPages: 0 };
  const profile = await prisma.businessProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) return { rentals: [], total: 0, totalPages: 0 };

  const skip = (page - 1) * limit;

  const [rentals, total] = await Promise.all([
    prisma.rental.findMany({
      where:   { profileId: profile.id },
      select: {
        id:          true,
        slug:        true,
        title:       true,
        type:        true,
        status:      true,
        pricePerDay: true,
        brand:       true,
        model:       true,
        destination: { select: { city: true } },
        images:      { take: 1, select: { url: true } },
        _count:      { select: { reservations: true } },
      },
      orderBy: { title: "asc" },
      skip,
      take: limit,
    }),
    prisma.rental.count({ where: { profileId: profile.id } }),
  ]);

  return { rentals, total, totalPages: Math.ceil(total / limit) };
});

export const getMyRentalBySlug = cache(async (slug: string) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  const profile = await prisma.businessProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) return null;
  return prisma.rental.findFirst({
    where: { slug, profileId: profile.id },
    include: { images: true, destination: true },
  });
});

export async function getRentalReviews(rentalId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { reviews: [], guidniReview: null };

  const [reviews, guidniReview] = await Promise.all([
    prisma.review.findMany({
      where: { relationType: "RENTAL", relationId: rentalId },
      include: { user: { select: { name: true, image: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.guidniReview.findUnique({
      where: { relationType_relationId: { relationType: "RENTAL", relationId: rentalId } },
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

export async function createRental(data: RentalInput) {
  const profile = await getProfile();
  if (!profile) return { success: false as const, error: "Not authenticated" };

  const parsed = RentalSchema.safeParse(data);
  if (!parsed.success) return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid data" };

  const { destinationId, ...rest } = parsed.data;

  const baseSlug = rest.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  const suffix = generateBookingRef().replace("GN-", "").toLowerCase();
  const slug = `${baseSlug}-${suffix}`;

  const rental = await prisma.rental.create({
    data: {
      ...rest,
      slug,
      profileId: profile.id,
      ...(destinationId ? { destinationId } : {}),
    },
  });

  revalidatePath("/partner/rentals");
  return { success: true as const, data: rental };
}

export async function updateRental(rentalId: string, data: Partial<RentalInput>) {
  const profile = await getProfile();
  if (!profile) return { success: false as const, error: "Not authenticated" };

  const rental = await prisma.rental.findUnique({ where: { id: rentalId } });
  if (!rental || rental.profileId !== profile.id)
    return { success: false as const, error: "Not found" };

  const updated = await prisma.rental.update({
    where: { id: rentalId },
    data: {
      ...data,
      destinationId: data.destinationId ?? null,
    },
  });

  revalidatePath("/partner/rentals");
  revalidatePath(`/partner/rentals/${rental.slug}`);
  return { success: true as const, data: updated };
}

export async function updateRentalStatus(
  rentalId: string,
  status: "DRAFT" | "ACTIVE"
) {
  const profile = await getProfile();
  if (!profile) return { success: false as const, error: "Not authenticated" };

  const existing = await prisma.rental.findUnique({ where: { id: rentalId } });
  if (!existing || existing.profileId !== profile.id)
    return { success: false as const, error: "Not found" };

  await prisma.rental.update({ where: { id: rentalId }, data: { status } });
  revalidatePath("/partner/rentals");
  revalidatePath(`/partner/rentals/${existing.slug}`);
  return { success: true as const };
}

export async function deleteRental(rentalId: string) {
  const profile = await getProfile();
  if (!profile) return { success: false as const, error: "Not authenticated" };

  const rental = await prisma.rental.findUnique({ where: { id: rentalId } });
  if (!rental || rental.profileId !== profile.id)
    return { success: false as const, error: "Not found" };

  await prisma.rental.delete({ where: { id: rentalId } });
  revalidatePath("/partner/rentals");
  return { success: true as const };
}

export async function addRentalImage(rentalId: string, url: string) {
  const profile = await getProfile();
  if (!profile) return { success: false as const, error: "Not authenticated" };

  const rental = await prisma.rental.findUnique({ where: { id: rentalId } });
  if (!rental || rental.profileId !== profile.id)
    return { success: false as const, error: "Not found" };

  const maxOrder = await prisma.images.aggregate({
    where: { rentalId },
    _max: { order: true },
  });
  const image = await prisma.images.create({
    data: { url, rentalId, order: (maxOrder._max.order ?? -1) + 1 },
  });
  revalidatePath(`/partner/rentals/${rental.slug}`);
  return { success: true as const, data: image };
}

export async function removeRentalImage(imageId: string) {
  const profile = await getProfile();
  if (!profile) return { success: false as const, error: "Not authenticated" };

  const image = await prisma.images.findUnique({
    where: { id: imageId },
    include: { rental: { select: { profileId: true, slug: true } } },
  });
  if (!image?.rental || image.rental.profileId !== profile.id)
    return { success: false as const, error: "Not found" };

  await prisma.images.delete({ where: { id: imageId } });
  revalidatePath(`/partner/rentals/${image.rental.slug}`);
  return { success: true as const };
}

export async function reorderRentalImages(rentalId: string, orderedIds: string[]) {
  const profile = await getProfile();
  if (!profile) return { success: false as const, error: "Not authenticated" };

  const rental = await prisma.rental.findUnique({ where: { id: rentalId } });
  if (!rental || rental.profileId !== profile.id)
    return { success: false as const, error: "Not found" };

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.images.update({ where: { id }, data: { order: index } })
    )
  );
  revalidatePath(`/partner/rentals/${rental.slug}`);
  return { success: true as const };
}

export async function setRentalImageAsCover(imageId: string, rentalId: string) {
  const profile = await getProfile();
  if (!profile) return { success: false as const, error: "Not authenticated" };

  const rental = await prisma.rental.findUnique({ where: { id: rentalId } });
  if (!rental || rental.profileId !== profile.id)
    return { success: false as const, error: "Not found" };

  const allImages = await prisma.images.findMany({
    where: { rentalId },
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
  revalidatePath(`/partner/rentals/${rental.slug}`);
  return { success: true as const };
}

export async function toggleRentalBlockedDate(rentalId: string, dateStr: string) {
  const profile = await getProfile();
  if (!profile) return { success: false as const, error: "Not authenticated" };

  const rental = await prisma.rental.findUnique({ where: { id: rentalId } });
  if (!rental || rental.profileId !== profile.id)
    return { success: false as const, error: "Unauthorized" };

  const date = new Date(dateStr + "T00:00:00.000Z");

  const existing = await prisma.rentalBlockedDate.findUnique({
    where: { rentalId_date: { rentalId, date } },
  });

  if (existing) {
    await prisma.rentalBlockedDate.delete({ where: { id: existing.id } });
    return { success: true as const, blocked: false };
  } else {
    await prisma.rentalBlockedDate.create({ data: { rentalId, date } });
    return { success: true as const, blocked: true };
  }
}

export async function getRentalAvailabilityData(rentalId: string) {
  const profile = await getProfile();
  if (!profile) return {
    blocked: [] as string[],
    reservations: [] as { startDate: string; endDate: string; status: string; bookingRef: string }[],
  };

  const rental = await prisma.rental.findUnique({ where: { id: rentalId } });
  if (!rental || rental.profileId !== profile.id) return {
    blocked: [] as string[],
    reservations: [] as { startDate: string; endDate: string; status: string; bookingRef: string }[],
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [blockedRows, reservations] = await Promise.all([
    prisma.rentalBlockedDate.findMany({
      where: { rentalId },
      select: { date: true },
      orderBy: { date: "asc" },
    }),
    prisma.rentalReservation.findMany({
      where: {
        rentalId,
        status: { in: ["PENDING", "CONFIRMED"] },
        endDate: { gte: today },
      },
      select: { startDate: true, endDate: true, status: true, bookingRef: true },
      orderBy: { startDate: "asc" },
    }),
  ]);

  return {
    blocked: blockedRows.map((d) => d.date.toISOString().slice(0, 10)),
    reservations: reservations.map((r) => ({
      startDate:  r.startDate.toISOString().slice(0, 10),
      endDate:    r.endDate.toISOString().slice(0, 10),
      status:     r.status,
      bookingRef: r.bookingRef,
    })),
  };
}
