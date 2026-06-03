"use server";

import { cache } from "react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { generateBookingRef } from "@/lib/utils/booking-ref";

interface CreateInput {
  transferId:      string;
  date:            Date;
  time:            string;
  pickupLocation:  string;
  dropoffLocation?: string;
  passengers:      number;
  hoursRequested?: number;
  flightNumber?:   string;
  contactName:     string;
  contactPhone?:   string;
  notes?:          string;
}

export async function createTransferReservation(input: CreateInput) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false as const, error: "Not authenticated" };

  const transfer = await prisma.transfer.findUnique({ where: { id: input.transferId } });
  if (!transfer) return { success: false as const, error: "Transfer not found" };

  // Server-side price calculation
  let totalPrice = 0;
  switch (transfer.type) {
    case "CHAUFFEUR":
      totalPrice = (transfer.pricePerHour ?? 0) * (input.hoursRequested ?? 1);
      break;
    case "SHUTTLE":
      totalPrice = transfer.pricePerPerson
        ? transfer.pricePerPerson * input.passengers
        : (transfer.pricePerTrip ?? 0);
      break;
    default: // AIRPORT_TRANSFER, TAXI
      totalPrice = transfer.pricePerTrip ?? 0;
  }

  const bookingRef = generateBookingRef();

  const reservation = await prisma.transferReservation.create({
    data: {
      bookingRef,
      date:            input.date,
      time:            input.time,
      pickupLocation:  input.pickupLocation,
      dropoffLocation: input.dropoffLocation ?? null,
      passengers:      input.passengers,
      hoursRequested:  input.hoursRequested ?? null,
      flightNumber:    input.flightNumber ?? null,
      contactName:     input.contactName,
      contactPhone:    input.contactPhone ?? null,
      notes:           input.notes ?? null,
      totalPrice,
      userId:          session.user.id,
      transferId:      input.transferId,
    },
    select: { id: true, bookingRef: true },
  });

  return { success: true as const, data: reservation };
}

export const getUserTransferReservations = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return [];

  return prisma.transferReservation.findMany({
    where: { userId: session.user.id },
    include: {
      transfer: {
        select: {
          id: true, title: true, type: true,
          images: { select: { url: true }, take: 1 },
          city: true, country: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
});

export const getPartnerTransferReservations = cache(async (transferId: string) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return [];

  const profile = await prisma.businessProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) return [];

  const transfer = await prisma.transfer.findUnique({ where: { id: transferId } });
  if (!transfer || transfer.profileId !== profile.id) return [];

  return prisma.transferReservation.findMany({
    where: { transferId },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { date: "asc" },
  });
});

export async function updateTransferReservationStatus(
  reservationId: string,
  status: "CONFIRMED" | "CANCELLED" | "COMPLETED"
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false as const, error: "Not authenticated" };

  const profile = await prisma.businessProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) return { success: false as const, error: "No business profile" };

  const reservation = await prisma.transferReservation.findUnique({
    where: { id: reservationId },
    include: { transfer: { select: { profileId: true } } },
  });

  if (!reservation || reservation.transfer.profileId !== profile.id)
    return { success: false as const, error: "Not found" };

  const updated = await prisma.transferReservation.update({
    where: { id: reservationId },
    data: { status },
  });

  revalidatePath("/partner/transfers");
  return { success: true as const, data: updated };
}

export async function cancelTransferReservation(reservationId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false as const, error: "Not authenticated" };

  const reservation = await prisma.transferReservation.findUnique({
    where: { id: reservationId },
  });

  if (!reservation || reservation.userId !== session.user.id)
    return { success: false as const, error: "Not found" };

  if (reservation.status === "COMPLETED" || reservation.status === "CANCELLED")
    return { success: false as const, error: "Cannot cancel this booking" };

  const updated = await prisma.transferReservation.update({
    where: { id: reservationId },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/bookings");
  return { success: true as const, data: updated };
}
