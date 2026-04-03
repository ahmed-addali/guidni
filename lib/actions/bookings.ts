"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TAXES, SERVICE_FEE } from "@/lib/constants/payments";
import { generateBookingRef } from "@/lib/utils/booking-ref";
import type { PaymentMethod, PaymentOption } from "@prisma/client";

// ─── Activity Reservation ─────────────────────────────────────────────────────

interface CreateActivityReservationInput {
  activityId:    string;
  date:          string; // ISO string
  time:          string;
  adults:        number;
  children:      number;
  paymentMethod: PaymentMethod;
  paymentOption: PaymentOption;
  notes?:        string;
  agentToken?:   string;
}

export async function createActivityReservation(
  input: CreateActivityReservationInput
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { success: false, error: "You must be logged in to book." };
  }

  const activity = await prisma.activity.findUnique({
    where:  { id: input.activityId },
    select: { price: true, capacity: true, agentCommissionEnabled: true, agentCommissionRate: true, profileId: true },
  });

  if (!activity) {
    return { success: false, error: "Activity not found." };
  }

  const totalPrice =
    (input.adults + input.children) * activity.price + TAXES + SERVICE_FEE;

  const bookingRef = generateBookingRef();

  // ── Agent attribution ──────────────────────────────────────────────────────
  let agentId:           string | undefined;
  let agentInvitationId: string | undefined;
  let commissionRate:    number | undefined;
  let commissionAmount:  number | undefined;

  if (input.agentToken && activity.agentCommissionEnabled) {
    const invitation = await prisma.agentInvitation.findUnique({
      where:   { token: input.agentToken },
      include: { agent: { select: { id: true, isActive: true } } },
    });

    if (
      invitation &&
      invitation.agent.isActive &&
      invitation.status !== "CANCELLED" &&
      invitation.status !== "EXPIRED" &&
      invitation.expiresAt > new Date()
    ) {
      agentId           = invitation.agent.id;
      agentInvitationId = invitation.id;
      commissionRate    = activity.agentCommissionRate ?? 0.05;
      commissionAmount  = Math.round((input.adults + input.children) * activity.price * commissionRate * 100) / 100;
    }
  }
  // ──────────────────────────────────────────────────────────────────────────

  try {
    const reservation = await prisma.activityReservation.create({
      data: {
        bookingRef,
        userId:     session.user.id,
        activityId: input.activityId,
        date:       new Date(input.date),
        time:       input.time,
        adults:     input.adults,
        children:   input.children,
        totalPrice,
        paymentMethod:    input.paymentMethod,
        paymentOption:    input.paymentOption,
        notes:            input.notes,
        agentId,
        agentInvitationId,
        commissionRate,
        commissionAmount,
      },
    });

    // ── Post-booking agent updates (best-effort) ───────────────────────────
    if (agentId && agentInvitationId && commissionAmount !== undefined) {
      const BOOKING_POINTS = 2;
      await Promise.all([
        prisma.agentInvitation.update({
          where: { id: agentInvitationId },
          data:  { status: "BOOKED", bookedAt: new Date() },
        }),
        prisma.agentEarning.create({
          data: {
            agentId,
            bookingRef,
            listingType:     "ACTIVITY",
            listingId:       input.activityId,
            commissionRate:  commissionRate!,
            bookingAmount:   (input.adults + input.children) * activity.price,
            commissionAmount,
            status:          "PENDING",
          },
        }),
        prisma.agentPoint.create({
          data: {
            agentId,
            type:        "BOOKING_COMMISSION",
            amount:      BOOKING_POINTS,
            description: `Booking · ${bookingRef}`,
            referenceId: bookingRef,
            status:      "CONFIRMED",
          },
        }),
        prisma.agentProfile.update({
          where: { id: agentId },
          data:  { points: { increment: BOOKING_POINTS } },
        }),
      ]).catch(() => null); // don't fail booking if agent updates fail

      // Tier check (fire-and-forget — don't block booking response)
      const { checkAndUpgradeTier } = await import("@/lib/utils/agent-tiers");
      checkAndUpgradeTier(agentId).catch(() => null);
    }

    // Referral milestone: first booking for this partner (fire-and-forget)
    if (activity.profileId) {
      const { triggerReferralFirstBooking } = await import("@/lib/utils/agent-referral-milestones");
      triggerReferralFirstBooking(activity.profileId).catch(() => null);
    }
    // ──────────────────────────────────────────────────────────────────────

    return { success: true, data: { id: reservation.id, bookingRef } };
  } catch (error) {
    console.error("createActivityReservation error:", error);
    return { success: false, error: "Failed to create booking. Please try again." };
  }
}

// ─── Stay Reservation ─────────────────────────────────────────────────────────

interface CreateStayReservationInput {
  stayId: string;
  checkIn: string; // ISO string
  checkOut: string; // ISO string
  adults: number;
  children: number;
  paymentMethod: PaymentMethod;
  paymentOption: PaymentOption;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  specialRequests?: string;
}

function calculateNights(checkIn: Date, checkOut: Date): number {
  const ms = checkOut.getTime() - checkIn.getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export async function createStayReservation(
  input: CreateStayReservationInput
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { success: false, error: "You must be logged in to book." };
  }

  const stay = await prisma.stay.findUnique({
    where: { id: input.stayId },
    select: { price: true, cleaningFee: true, serviceFee: true },
  });

  if (!stay) {
    return { success: false, error: "Stay not found." };
  }

  const checkIn = new Date(input.checkIn);
  const checkOut = new Date(input.checkOut);
  const nights = calculateNights(checkIn, checkOut);

  const basePrice = stay.price * nights;
  const cleaningFee = stay.cleaningFee ?? 0;
  const serviceFee = stay.serviceFee ?? 0;
  const taxes = Math.round((basePrice + cleaningFee + serviceFee) * 0.07); // 7% VAT
  const totalPrice = basePrice + cleaningFee + serviceFee + taxes;

  const bookingRef = generateBookingRef();

  try {
    const reservation = await prisma.staysReservation.create({
      data: {
        bookingRef,
        userId: session.user.id,
        stayId: input.stayId,
        checkIn,
        checkOut,
        nights,
        adults: input.adults,
        children: input.children,
        basePrice,
        cleaningFee,
        serviceFee,
        taxes,
        totalPrice,
        paymentMethod: input.paymentMethod,
        paymentOption: input.paymentOption,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        specialRequests: input.specialRequests,
      },
    });

    return { success: true, data: { id: reservation.id, bookingRef } };
  } catch (error) {
    console.error("createStayReservation error:", error);
    return { success: false, error: "Failed to create booking. Please try again." };
  }
}
