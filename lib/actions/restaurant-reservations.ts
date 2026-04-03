"use server";

import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BookingStatus } from "@prisma/client";

// ─── Types ─────────────────────────────────────────────────────────────────

export type RestaurantReservationRow = {
  id: string;
  bookingRef: string;
  date: Date;
  time: string;
  guests: number;
  status: BookingStatus;
  notes: string | null;
  guestName: string | null;
  phone: string | null;
  createdAt: Date;
  restaurant: { id: string; name: string; slug: string };
};

export type PartnerReservationRow = {
  id: string;
  bookingRef: string;
  date: Date;
  time: string;
  guests: number;
  status: BookingStatus;
  notes: string | null;
  guestName: string | null;
  phone: string | null;
  createdAt: Date;
  user: { id: string; name: string; email: string };
};

// ─── Public: create reservation (from ReservationWidget) ───────────────────

export async function createReservation(input: {
  restaurantId: string;
  date: string;   // ISO date string "YYYY-MM-DD"
  time: string;   // "HH:MM"
  guests: number;
  notes?: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false as const, error: "Please sign in to make a reservation." };

  const { restaurantId, date, time, guests, notes } = input;

  if (!date || !time || !guests) {
    return { success: false as const, error: "Date, time and guests are required." };
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true, reservationsEnabled: true, maxGuests: true },
  });

  if (!restaurant) return { success: false as const, error: "Restaurant not found." };
  if (!restaurant.reservationsEnabled) return { success: false as const, error: "This restaurant does not accept online reservations." };
  if (restaurant.maxGuests && guests > restaurant.maxGuests) {
    return { success: false as const, error: `Maximum ${restaurant.maxGuests} guests per reservation.` };
  }

  const reservation = await prisma.restaurantReservation.create({
    data: {
      date: new Date(date),
      time,
      guests,
      notes: notes ?? null,
      userId: session.user.id,
      restaurantId,
    },
    select: { id: true, bookingRef: true, date: true, time: true, guests: true, status: true },
  });

  return { success: true as const, data: reservation };
}

// ─── User: get own reservations ─────────────────────────────────────────────

export const getUserRestaurantReservations = cache(async (): Promise<RestaurantReservationRow[]> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return [];

  return prisma.restaurantReservation.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
    select: {
      id: true,
      bookingRef: true,
      date: true,
      time: true,
      guests: true,
      status: true,
      notes: true,
      guestName: true,
      phone: true,
      createdAt: true,
      restaurant: { select: { id: true, name: true, slug: true } },
    },
  });
});

// ─── Partner: get reservations for one restaurant ───────────────────────────

export const getPartnerRestaurantReservations = cache(
  async (restaurantId: string): Promise<PartnerReservationRow[]> => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return [];

    const profile = await prisma.businessProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!profile) return [];

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { profileId: true },
    });
    if (!restaurant || restaurant.profileId !== profile.id) return [];

    return prisma.restaurantReservation.findMany({
      where: { restaurantId },
      orderBy: { date: "desc" },
      select: {
        id: true,
        bookingRef: true,
        date: true,
        time: true,
        guests: true,
        status: true,
        notes: true,
        guestName: true,
        phone: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }
);

// ─── Partner: update reservation status ─────────────────────────────────────

export async function updateReservationStatus(
  reservationId: string,
  status: BookingStatus
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false as const, error: "Not authenticated." };

  const profile = await prisma.businessProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return { success: false as const, error: "No business profile found." };

  const reservation = await prisma.restaurantReservation.findUnique({
    where: { id: reservationId },
    select: { restaurant: { select: { profileId: true } } },
  });

  if (!reservation || reservation.restaurant.profileId !== profile.id) {
    return { success: false as const, error: "Reservation not found." };
  }

  const updated = await prisma.restaurantReservation.update({
    where: { id: reservationId },
    data: { status },
    select: { id: true, status: true },
  });

  return { success: true as const, data: updated };
}
