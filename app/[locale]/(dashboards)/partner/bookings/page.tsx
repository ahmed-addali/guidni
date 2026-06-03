import { getPartnerAllBookings } from "@/lib/actions/partner";
import { BookingsClient } from "./_components/BookingsClient";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { locale } = await params;
  return { title: "Bookings · Partner Dashboard" };
}

export default async function PartnerBookingsPage() {
  const bookings = await getPartnerAllBookings();

  return (
    <div className="space-y-6 max-w-screen-xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="text-sm text-gray-400 mt-1">Manage and track all reservations.</p>
      </div>
      <BookingsClient bookings={bookings} />
    </div>
  );
}
