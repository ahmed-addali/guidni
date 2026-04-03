import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json();
  const { activityId, date, adults, children } = body;

  if (!activityId || !date || adults + children === 0) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  try {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      select: { capacity: true, availableTimes: true },
    });

    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    // All reservations for this date
    const reservations = await prisma.activityReservation.findMany({
      where: { activityId, date: new Date(date) },
      select: { time: true, adults: true, children: true },
    });

    // Count total booked participants per time slot
    const bookedBySlot = new Map<string, number>();
    for (const r of reservations) {
      const key = r.time;
      bookedBySlot.set(key, (bookedBySlot.get(key) ?? 0) + r.adults + r.children);
    }

    // Return slots where remaining capacity fits the requested group
    const allSlots = activity.availableTimes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const requested = adults + children;
    const availableSlots = allSlots.filter(
      (slot) => (bookedBySlot.get(slot) ?? 0) + requested <= activity.capacity
    );

    return NextResponse.json({ availableSlots });
  } catch (error) {
    console.error("Availability check error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
