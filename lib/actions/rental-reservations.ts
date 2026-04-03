"use server";

import { cache } from "react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { generateBookingRef } from "@/lib/utils/booking-ref";
import type { BookingStatus } from "@prisma/client";

export async function createRentalReservation(input: {
  rentalId:  string;
  startDate: Date;
  endDate:   Date;
  days:      number;
  notes?:    string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false as const, error: "Please sign in to book" };

  const rental = await prisma.rental.findUnique({ where: { id: input.rentalId } });
  if (!rental) return { success: false as const, error: "Rental not found" };

  const totalPrice = rental.pricePerDay * input.days;

  const reservation = await prisma.rentalReservation.create({
    data: {
      bookingRef:  generateBookingRef(),
      startDate:   input.startDate,
      endDate:     input.endDate,
      days:        input.days,
      totalPrice,
      notes:       input.notes,
      userId:      session.user.id,
      rentalId:    input.rentalId,
    },
  });

  return { success: true as const, data: reservation };
}

export const getUserRentalReservations = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return [];
  return prisma.rentalReservation.findMany({
    where: { userId: session.user.id },
    include: { rental: { select: { title: true, slug: true, type: true, images: { select: { url: true }, take: 1 } } } },
    orderBy: { createdAt: "desc" },
  });
});

export const getPartnerRentalReservations = cache(async (rentalId: string) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return [];
  const profile = await prisma.businessProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) return [];
  const rental = await prisma.rental.findFirst({ where: { id: rentalId, profileId: profile.id } });
  if (!rental) return [];
  return prisma.rentalReservation.findMany({
    where: { rentalId },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
});

export async function updateRentalReservationStatus(reservationId: string, status: BookingStatus) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false as const, error: "Not authenticated" };

  const reservation = await prisma.rentalReservation.findUnique({
    where: { id: reservationId },
    include: { rental: true },
  });
  if (!reservation) return { success: false as const, error: "Not found" };

  const profile = await prisma.businessProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile || reservation.rental.profileId !== profile.id)
    return { success: false as const, error: "Not authorized" };

  const updated = await prisma.rentalReservation.update({
    where: { id: reservationId },
    data: { status },
  });

  return { success: true as const, data: updated };
}
