"use server";

import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { generateBookingRef } from "@/lib/utils/booking-ref";
import type { PassReservationInput } from "@/lib/validations/pass";

// 6-month pass validity
const PASS_VALIDITY_MONTHS = 6;

// ─── Create a pass reservation ────────────────────────────────────────────────

export async function createPassReservation(data: PassReservationInput) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false as const, error: "Not authenticated" };

  const pass = await db.pass.findUnique({
    where: { id: data.passId },
    include: { fixedActivities: true, optionalActivities: true },
  });
  if (!pass) return { success: false as const, error: "Pass not found" };

  const bookingRef = generateBookingRef();
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + PASS_VALIDITY_MONTHS);

  // Build the set of optional activities chosen (capped at optionalCount)
  const selectedOptional = (data.selectedOptionalActivityIds ?? []).slice(0, pass.optionalCount);

  const reservation = await db.passReservation.create({
    data: {
      bookingRef,
      passKey:      pass.passKey,
      passId:       pass.id,
      userId:       session.user.id,
      date:         new Date(data.date),
      participants: data.participants,
      totalPrice:   data.totalPrice,
      language:     data.language,
      notes:        data.notes,
      expiresAt,
      // Create child activity reservations for fixed activities
      activityReservations: {
        create: [
          ...pass.fixedActivities.map((act) => ({
            bookingRef:    generateBookingRef(),
            activityId:    act.id,
            userId:        session.user.id,
            date:          new Date(data.date),
            time:          "09:00",
            adults:        data.participants,
            children:      0,
            totalPrice:    0,
            typeInPass:    "FIXED" as const,
            paymentMethod: "INCLUDED_IN_PASS" as const,
          })),
          ...pass.optionalActivities
            .filter((act) => selectedOptional.includes(act.id))
            .map((act) => ({
              bookingRef:    generateBookingRef(),
              activityId:    act.id,
              userId:        session.user.id,
              date:          new Date(data.date),
              time:          "09:00",
              adults:        data.participants,
              children:      0,
              totalPrice:    0,
              typeInPass:    "OPTIONAL" as const,
              paymentMethod: "INCLUDED_IN_PASS" as const,
            })),
        ],
      },
    },
  });

  return { success: true as const, data: reservation };
}

// ─── User queries ─────────────────────────────────────────────────────────────

export const getUserPassReservations = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return [];

  return db.passReservation.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      pass: { select: { name: true, passKey: true } },
      activityReservations: {
        include: { activity: { select: { title: true, images: { take: 1 } } } },
      },
    },
  });
});

export const getPassReservationByRef = cache(async (bookingRef: string) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const reservation = await db.passReservation.findUnique({
    where: { bookingRef },
    include: {
      pass: true,
      activityReservations: {
        include: { activity: { include: { images: { take: 1 } } } },
      },
    },
  });

  // Only owner or admin can view
  if (!reservation) return null;
  if (reservation.userId !== session.user.id && session.user.role !== "ADMIN") return null;

  return reservation;
});

// ─── Admin queries ────────────────────────────────────────────────────────────

export const getAllPassReservations = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user?.role !== "ADMIN") return [];

  return db.passReservation.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      pass: { select: { name: true, passKey: true } },
    },
  });
});
