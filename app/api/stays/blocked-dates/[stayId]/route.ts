import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ stayId: string }> }
) {
  const { stayId } = await params;

  try {
    const reservations = await prisma.staysReservation.findMany({
      where: {
        stayId,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: { checkIn: true, checkOut: true },
    });

    // Return as ISO date strings (date only)
    const blockedRanges = reservations.map((r) => ({
      checkIn: r.checkIn.toISOString().split("T")[0],
      checkOut: r.checkOut.toISOString().split("T")[0],
    }));

    return NextResponse.json({ blockedRanges });
  } catch (error) {
    console.error("Blocked dates error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
