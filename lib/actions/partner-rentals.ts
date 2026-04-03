"use server";

import { cache } from "react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { RentalSchema, type RentalInput } from "@/lib/validations/rental";
import { generateBookingRef } from "@/lib/utils/booking-ref";

async function getProfile() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  return prisma.businessProfile.findUnique({ where: { userId: session.user.id } });
}

export const getMyRentals = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return [];
  const profile = await prisma.businessProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) return [];
  return prisma.rental.findMany({
    where: { profileId: profile.id },
    include: { images: { take: 1 }, _count: { select: { reservations: true } } },
    orderBy: { title: "asc" },
  });
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

  return { success: true as const, data: updated };
}

export async function deleteRental(rentalId: string) {
  const profile = await getProfile();
  if (!profile) return { success: false as const, error: "Not authenticated" };

  const rental = await prisma.rental.findUnique({ where: { id: rentalId } });
  if (!rental || rental.profileId !== profile.id)
    return { success: false as const, error: "Not found" };

  await prisma.rental.delete({ where: { id: rentalId } });
  return { success: true as const };
}
