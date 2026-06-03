"use server";

import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getSessionUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id ?? null;
}

// ─── Activity Bookings ────────────────────────────────────────────────────────

export const getUserActivityBookings = cache(async () => {
  const userId = await getSessionUserId();
  if (!userId) return [];

  return prisma.activityReservation.findMany({
    where: { userId },
    include: {
      activity: {
        select: {
          id: true,
          title: true,
          price: true,
          images: { select: { url: true }, take: 1 },
          destination: { select: { city: true, country: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
});

export async function getActivityBookingById(bookingId: string) {
  const userId = await getSessionUserId();
  if (!userId) return null;

  return prisma.activityReservation.findFirst({
    where: { id: bookingId, userId },
    include: {
      activity: {
        select: {
          id: true,
          title: true,
          price: true,
          duration: true,
          images: { select: { url: true } },
          destination: { select: { city: true, country: true } },
        },
      },
    },
  });
}

// ─── Stay Bookings ────────────────────────────────────────────────────────────

export const getUserStayBookings = cache(async () => {
  const userId = await getSessionUserId();
  if (!userId) return [];

  return prisma.staysReservation.findMany({
    where: { userId },
    include: {
      stay: {
        select: {
          id: true,
          title: true,
          price: true,
          region: true,
          city: true,
          images: { select: { url: true }, take: 1 },
          destination: { select: { city: true, country: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
});

export async function getStayBookingById(bookingId: string) {
  const userId = await getSessionUserId();
  if (!userId) return null;

  return prisma.staysReservation.findFirst({
    where: { id: bookingId, userId },
    include: {
      stay: {
        select: {
          id: true,
          title: true,
          price: true,
          cleaningFee: true,
          serviceFee: true,
          region: true,
          city: true,
          country: true,
          images: { select: { url: true } },
          destination: { select: { city: true, country: true } },
        },
      },
    },
  });
}

// ─── Cancel Booking ───────────────────────────────────────────────────────────

export async function cancelActivityBooking(bookingId: string) {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: "Not authenticated." };

  const booking = await prisma.activityReservation.findFirst({
    where: { id: bookingId, userId },
  });

  if (!booking) return { success: false, error: "Booking not found." };
  if (booking.status === "CANCELLED") {
    return { success: false, error: "Already cancelled." };
  }

  await prisma.activityReservation.update({
    where: { id: bookingId },
    data: { status: "CANCELLED" },
  });

  return { success: true };
}

export async function cancelStayBooking(bookingId: string) {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: "Not authenticated." };

  const booking = await prisma.staysReservation.findFirst({
    where: { id: bookingId, userId },
  });

  if (!booking) return { success: false, error: "Booking not found." };
  if (booking.status === "CANCELLED") {
    return { success: false, error: "Already cancelled." };
  }

  await prisma.staysReservation.update({
    where: { id: bookingId },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });

  return { success: true };
}

// ─── Rental Bookings ──────────────────────────────────────────────────────────

export async function getRentalBookingById(bookingId: string) {
  const userId = await getSessionUserId();
  if (!userId) return null;

  return prisma.rentalReservation.findFirst({
    where: { id: bookingId, userId },
    select: {
      id: true,
      bookingRef: true,
      startDate: true,
      endDate: true,
      days: true,
      totalPrice: true,
      status: true,
      notes: true,
      createdAt: true,
      rental: {
        select: {
          id: true,
          title: true,
          type: true,
          pricePerDay: true,
          city: true,
          region: true,
          country: true,
          images: { select: { url: true }, take: 1 },
        },
      },
    },
  });
}

export async function cancelRentalBooking(bookingId: string) {
  const userId = await getSessionUserId();
  if (!userId) return { success: false as const, error: "Not authenticated." };

  const booking = await prisma.rentalReservation.findFirst({
    where: { id: bookingId, userId },
  });

  if (!booking) return { success: false as const, error: "Booking not found." };
  if (booking.status === "CANCELLED" || booking.status === "COMPLETED")
    return { success: false as const, error: "Cannot cancel this booking." };

  await prisma.rentalReservation.update({
    where: { id: bookingId },
    data: { status: "CANCELLED" },
  });

  return { success: true as const };
}

// ─── Transfer Bookings ────────────────────────────────────────────────────────

export async function getTransferBookingById(bookingId: string) {
  const userId = await getSessionUserId();
  if (!userId) return null;

  return prisma.transferReservation.findFirst({
    where: { id: bookingId, userId },
    select: {
      id: true,
      bookingRef: true,
      date: true,
      time: true,
      pickupLocation: true,
      dropoffLocation: true,
      passengers: true,
      hoursRequested: true,
      flightNumber: true,
      contactName: true,
      contactPhone: true,
      notes: true,
      totalPrice: true,
      status: true,
      createdAt: true,
      transfer: {
        select: {
          id: true,
          title: true,
          type: true,
          pricePerTrip: true,
          pricePerHour: true,
          pricePerPerson: true,
          city: true,
          country: true,
          images: { select: { url: true }, take: 1 },
        },
      },
    },
  });
}

export async function cancelTransferBooking(bookingId: string) {
  const userId = await getSessionUserId();
  if (!userId) return { success: false as const, error: "Not authenticated." };

  const booking = await prisma.transferReservation.findFirst({
    where: { id: bookingId, userId },
  });

  if (!booking) return { success: false as const, error: "Booking not found." };
  if (booking.status === "CANCELLED" || booking.status === "COMPLETED")
    return { success: false as const, error: "Cannot cancel this booking." };

  await prisma.transferReservation.update({
    where: { id: bookingId },
    data: { status: "CANCELLED" },
  });

  return { success: true as const };
}
