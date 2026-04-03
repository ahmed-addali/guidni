import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { FiCalendar, FiUsers, FiCheckCircle } from "react-icons/fi";
import { IoBedOutline } from "react-icons/io5";
import { BookingQRCode } from "@/components/bookings/BookingQRCode";

type Props = { params: Promise<{ locale: string; ref: string }> };

async function findBookingByRef(ref: string) {
  const [activity, stay] = await Promise.all([
    prisma.activityReservation.findUnique({
      where: { bookingRef: ref },
      include: {
        activity: {
          select: {
            title: true,
            images: { select: { url: true }, take: 1 },
            destination: { select: { city: true, country: true } },
          },
        },
        user: { select: { name: true } },
      },
    }),
    prisma.staysReservation.findUnique({
      where: { bookingRef: ref },
      include: {
        stay: {
          select: {
            title: true,
            images: { select: { url: true }, take: 1 },
            city: true,
            country: true,
          },
        },
        user: { select: { name: true } },
      },
    }),
  ]);

  if (activity) return { type: "activity" as const, data: activity };
  if (stay) return { type: "stay" as const, data: stay };
  return null;
}

export default async function VerifyBookingPage({ params }: Props) {
  const { ref } = await params;
  const result = await findBookingByRef(ref);

  if (!result) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (result.type === "activity") {
    const { data } = result;
    const listing = data.activity;
    const coverUrl = listing.images[0]?.url;
    const location = [listing.destination?.city, listing.destination?.country]
      .filter(Boolean)
      .join(", ");
    const guestFirstName = data.user.name?.split(" ")[0] ?? "Guest";
    const displayDate = data.date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return (
      <VerifyLayout
        coverUrl={coverUrl}
        listingTitle={listing.title}
        location={location}
        bookingRef={ref}
        baseUrl={baseUrl}
        status={data.status}
        guestFirstName={guestFirstName}
      >
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1.5">
            <FiCalendar className="h-4 w-4 text-gray-400" />
            {displayDate} · {data.time}
          </span>
          <span className="flex items-center gap-1.5">
            <FiUsers className="h-4 w-4 text-gray-400" />
            {data.adults} adults{data.children > 0 ? `, ${data.children} children` : ""}
          </span>
        </div>
      </VerifyLayout>
    );
  }

  // Stay
  const { data } = result;
  const listing = data.stay;
  const coverUrl = listing.images[0]?.url;
  const location = [listing.city, listing.country].filter(Boolean).join(", ");
  const guestFirstName = data.user.name?.split(" ")[0] ?? "Guest";
  const fmtDate = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <VerifyLayout
      coverUrl={coverUrl}
      listingTitle={listing.title}
      location={location}
      bookingRef={ref}
      baseUrl={baseUrl}
      status={data.status}
      guestFirstName={guestFirstName}
    >
      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        <span className="flex items-center gap-1.5">
          <FiCalendar className="h-4 w-4 text-gray-400" />
          {fmtDate(data.checkIn)} → {fmtDate(data.checkOut)}
        </span>
        <span className="flex items-center gap-1.5">
          <IoBedOutline className="h-4 w-4 text-gray-400" />
          {data.nights} night{data.nights !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1.5">
          <FiUsers className="h-4 w-4 text-gray-400" />
          {data.adults} adults{data.children > 0 ? `, ${data.children} children` : ""}
        </span>
      </div>
    </VerifyLayout>
  );
}

// ─── Shared layout ─────────────────────────────────────────────────────────

interface VerifyLayoutProps {
  coverUrl?: string;
  listingTitle: string;
  location: string;
  bookingRef: string;
  baseUrl: string;
  status: string;
  guestFirstName: string;
  children: React.ReactNode;
}

function VerifyLayout({
  coverUrl,
  listingTitle,
  location,
  bookingRef,
  baseUrl,
  status,
  guestFirstName,
  children,
}: VerifyLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md overflow-hidden">
        {/* Cover image */}
        {coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={listingTitle}
            className="w-full h-40 object-cover"
          />
        )}

        <div className="p-6 space-y-5">
          {/* Check icon + title */}
          <div className="flex items-start gap-3">
            <FiCheckCircle className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Booking for</p>
              <p className="font-semibold text-gray-900">{guestFirstName}</p>
            </div>
          </div>

          {/* Listing info */}
          <div>
            <h2 className="font-bold text-gray-900 text-base line-clamp-2">
              {listingTitle}
            </h2>
            {location && (
              <p className="text-xs text-gray-400 mt-0.5">{location}</p>
            )}
          </div>

          {/* Booking details (date/guests etc.) */}
          <div className="space-y-1">{children}</div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Status</span>
            {/* @ts-expect-error status string is compatible */}
            <StatusBadge status={status} />
          </div>

          {/* QR code */}
          <BookingQRCode bookingRef={bookingRef} baseUrl={baseUrl} />
        </div>
      </div>
    </div>
  );
}
