import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ref: string }> }
) {
  const { ref } = await params;

  const [activity, stay] = await Promise.all([
    prisma.activityReservation.findUnique({
      where: { bookingRef: ref },
      include: {
        activity: { select: { title: true } },
        user: { select: { name: true } },
      },
    }),
    prisma.staysReservation.findUnique({
      where: { bookingRef: ref },
      include: {
        stay: { select: { title: true } },
        user: { select: { name: true } },
      },
    }),
  ]);

  if (activity) {
    return NextResponse.json({
      type: "activity",
      bookingRef: ref,
      listingName: activity.activity.title,
      guestName: activity.user.name,
      date: activity.date.toISOString(),
      time: activity.time,
      adults: activity.adults,
      children: activity.children,
      status: activity.status,
    });
  }

  if (stay) {
    return NextResponse.json({
      type: "stay",
      bookingRef: ref,
      listingName: stay.stay.title,
      guestName: stay.user.name,
      checkIn: stay.checkIn.toISOString(),
      checkOut: stay.checkOut.toISOString(),
      nights: stay.nights,
      adults: stay.adults,
      children: stay.children,
      status: stay.status,
    });
  }

  return NextResponse.json({ error: "Booking not found" }, { status: 404 });
}
