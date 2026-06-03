import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { FiCalendar, FiUsers, FiCheckCircle, FiClock, FiHash } from "react-icons/fi";
import { Separator } from "@/components/ui/separator";
import { MaxWidthWrapper } from "@/components/shared/MaxWidthWrapper";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { BookingQRCode } from "@/components/bookings/BookingQRCode";
import { getPassReservationByRef } from "@/lib/actions/pass-reservations";
import { TAXES, SERVICE_FEE } from "@/lib/constants/payments";

type Params = Promise<{ locale: string; bookingRef: string }>;

export default async function PassBookingDetailPage({ params }: { params: Params }) {
  const { locale, bookingRef } = await params;

  const [reservation, t] = await Promise.all([
    getPassReservationByRef(bookingRef),
    getTranslations({ locale, namespace: "PassBookingDetail" }),
  ]);

  if (!reservation) notFound();

  const expiryDate = reservation.expiresAt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const startDate = reservation.date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const fixedActivities = reservation.activityReservations.filter(
    (r) => r.typeInPass === "FIXED"
  );
  const optionalActivities = reservation.activityReservations.filter(
    (r) => r.typeInPass === "OPTIONAL"
  );

  return (
    <MaxWidthWrapper className="py-8">
      <Link
        href={`/${locale}/bookings`}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("backToBookings")}
      </Link>

      <div className="max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {reservation.pass?.name ?? reservation.passKey}
            </h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="flex items-center gap-1 text-sm text-gray-500 font-mono">
                <FiHash className="h-3.5 w-3.5" />
                {reservation.bookingRef}
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-sm text-gray-400">{reservation.passKey}</span>
            </div>
          </div>
          <StatusBadge status={reservation.status} />
        </div>

        {/* QR Code — shown prominently at the top */}
        <BookingQRCode
          bookingRef={reservation.bookingRef}
          baseUrl={process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}
        />

        <Separator />

        {/* Details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-700">
            <FiCalendar className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">{t("startDate")}</p>
              <p className="font-medium">{startDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <FiClock className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">{t("validUntil")}</p>
              <p className="font-medium">{expiryDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <FiUsers className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">{t("participants")}</p>
              <p className="font-medium">{reservation.participants}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Included activities */}
        {fixedActivities.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-gray-900">{t("includedActivities")}</h2>
            {fixedActivities.map((ar) => (
              <Link
                key={ar.id}
                href={`/${locale}/bookings/activity/${ar.id}`}
                className="flex items-center gap-3 group hover:bg-gray-50 rounded-xl p-1 -mx-1 transition-colors"
              >
                {ar.activity.images[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ar.activity.images[0].url}
                    alt={ar.activity.title}
                    className="w-10 h-10 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0" />
                )}
                <p className="flex-1 text-sm text-gray-800 group-hover:text-primary transition-colors">
                  {ar.activity.title}
                </p>
                <FiCheckCircle className="h-4 w-4 text-green-500 shrink-0" />
              </Link>
            ))}
          </div>
        )}

        {/* Chosen optional activities */}
        {optionalActivities.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-gray-900">{t("chosenActivities")}</h2>
            {optionalActivities.map((ar) => (
              <Link
                key={ar.id}
                href={`/${locale}/bookings/activity/${ar.id}`}
                className="flex items-center gap-3 group hover:bg-gray-50 rounded-xl p-1 -mx-1 transition-colors"
              >
                {ar.activity.images[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ar.activity.images[0].url}
                    alt={ar.activity.title}
                    className="w-10 h-10 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0" />
                )}
                <p className="flex-1 text-sm text-gray-800 group-hover:text-primary transition-colors">
                  {ar.activity.title}
                </p>
                <FiCheckCircle className="h-4 w-4 text-blue-400 shrink-0" />
              </Link>
            ))}
          </div>
        )}

        <Separator />

        {/* Price */}
        <div className="space-y-2 text-sm">
          <h3 className="font-semibold text-gray-900">{t("priceBreakdown")}</h3>
          <div className="flex justify-between text-gray-600">
            <span>
              {reservation.participants} × {((Number(reservation.totalPrice) - TAXES - SERVICE_FEE) / reservation.participants).toFixed(0)} TND
            </span>
            <span>{(Number(reservation.totalPrice) - TAXES - SERVICE_FEE).toFixed(0)} TND</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>{t("serviceFee")}</span>
            <span>{SERVICE_FEE} TND</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>{t("taxes")}</span>
            <span>{TAXES} TND</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold text-gray-900">
            <span>{t("total")}</span>
            <span>{Number(reservation.totalPrice).toFixed(0)} TND</span>
          </div>
        </div>
      </div>
    </MaxWidthWrapper>
  );
}
