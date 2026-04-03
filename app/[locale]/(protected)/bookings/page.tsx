import { getTranslations } from "next-intl/server";
import { MaxWidthWrapper } from "@/components/shared/MaxWidthWrapper";
import { getUserActivityBookings, getUserStayBookings } from "@/lib/actions/user-bookings";
import { getUserPassReservations } from "@/lib/actions/pass-reservations";
import { getUserRentalReservations } from "@/lib/actions/rental-reservations";
import { getUserTransferReservations } from "@/lib/actions/transfer-reservations";
import { BookingsPageClient } from "./_components/BookingsPageClient";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "BookingsPage" });
  return { title: t("title") };
}

export default async function BookingsPage({ params }: { params: Params }) {
  const { locale } = await params;

  const [activityReservations, stayReservations, passReservations, rentalReservations, transferReservations, t] = await Promise.all([
    getUserActivityBookings(),
    getUserStayBookings(),
    getUserPassReservations(),
    getUserRentalReservations(),
    getUserTransferReservations(),
    getTranslations({ locale, namespace: "BookingsPage" }),
  ]);

  const activityBookings = activityReservations.map((r) => ({
    id: r.id,
    activityTitle: r.activity.title,
    coverImageUrl: r.activity.images[0]?.url,
    date: r.date,
    time: r.time,
    adults: r.adults,
    children: r.children,
    totalPrice: Number(r.totalPrice),
    status: r.status,
  }));

  const stayBookings = stayReservations.map((r) => ({
    id: r.id,
    stayTitle: r.stay.title,
    location: [r.stay.city, r.stay.region].filter(Boolean).join(", "),
    coverImageUrl: r.stay.images[0]?.url,
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    nights: r.nights,
    adults: r.adults,
    children: r.children,
    totalPrice: Number(r.totalPrice),
    status: r.status,
    bookingRef: r.bookingRef,
  }));

  const rentalBookings = rentalReservations.map((r) => ({
    id: r.id,
    rentalTitle: r.rental?.title ?? "Rental",
    rentalType: r.rental?.type ?? "OTHER",
    coverImageUrl: r.rental?.images[0]?.url,
    startDate: r.startDate,
    endDate: r.endDate,
    days: r.days,
    totalPrice: Number(r.totalPrice),
    status: r.status,
    bookingRef: r.bookingRef,
  }));

  const transferBookings = transferReservations.map((r) => ({
    id:             r.id,
    transferTitle:  r.transfer?.title ?? "Transfer",
    transferType:   r.transfer?.type ?? "AIRPORT_TRANSFER",
    coverImageUrl:  r.transfer?.images[0]?.url,
    date:           r.date,
    time:           r.time,
    pickupLocation: r.pickupLocation,
    passengers:     r.passengers,
    totalPrice:     Number(r.totalPrice),
    status:         r.status,
    bookingRef:     r.bookingRef,
  }));

  const passBookings = passReservations.map((r) => ({
    bookingRef: r.bookingRef,
    passName: r.pass?.name ?? r.passKey,
    passKey: r.passKey,
    date: r.date,
    expiresAt: r.expiresAt,
    participants: r.participants,
    totalPrice: Number(r.totalPrice),
    status: r.status,
  }));

  return (
    <MaxWidthWrapper className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      <BookingsPageClient
        activityBookings={activityBookings}
        stayBookings={stayBookings}
        passBookings={passBookings}
        rentalBookings={rentalBookings}
        transferBookings={transferBookings}
        locale={locale}
        labels={{
          activities: t("activities"),
          stays: t("stays"),
          passes: t("passes"),
          rentals: t("rentals"),
          transfers: t("transfers"),
          noActivities: t("noActivities"),
          noStays: t("noStays"),
          noPasses: t("noPasses"),
          noRentals: t("noRentals"),
          noTransfers: t("noTransfers"),
          viewDetails: t("viewDetails"),
          bookingRef: t("bookingRef"),
          adults: t("adults"),
          children: t("children"),
          nights: t("nights"),
          days: t("days"),
          passengers: t("passengers"),
          browseActivities: t("browseActivities"),
          browseStays: t("browseStays"),
          browsePasses: t("browsePasses"),
          browseRentals: t("browseRentals"),
          browseTransfers: t("browseTransfers"),
          participants: t("participants"),
          validUntil: t("validUntil"),
        }}
      />
    </MaxWidthWrapper>
  );
}
