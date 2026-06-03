import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { MaxWidthWrapper } from "@/components/shared/MaxWidthWrapper";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { getTransferBookingById } from "@/lib/actions/user-bookings";
import { PLATFORM_CURRENCY } from "@/lib/utils/constants";
import { FiCalendar, FiClock, FiMapPin, FiUsers, FiFileText, FiPhone, FiUser } from "react-icons/fi";
import { TbRoute, TbPlaneDeparture } from "react-icons/tb";
import { ChevronLeft } from "lucide-react";
import { CancelTransferBookingButton } from "./_components/CancelTransferBookingButton";
import { BookingQRCode } from "@/components/bookings/BookingQRCode";

const TRANSFER_TYPE_LABELS: Record<string, string> = {
  AIRPORT_TRANSFER: "Airport Transfer",
  TAXI: "City Taxi",
  CHAUFFEUR: "Private Chauffeur",
  SHUTTLE: "Shuttle",
};

type Params = Promise<{ locale: string; bookingId: string }>;

export default async function TransferBookingDetailPage({ params }: { params: Params }) {
  const { locale, bookingId } = await params;

  const [booking, t] = await Promise.all([
    getTransferBookingById(bookingId),
    getTranslations({ locale, namespace: "BookingDetail" }),
  ]);

  if (!booking) notFound();

  const transfer = booking.transfer;
  const total = Number(booking.totalPrice);

  const fmtDate = (d: Date) =>
    d.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const location = [transfer.city, transfer.country].filter(Boolean).join(", ");

  return (
    <MaxWidthWrapper className="py-8">
      {/* Back link */}
      <Link
        href={`/${locale}/bookings?tab=transfers`}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("backToBookings")}
      </Link>

      <div className="max-w-2xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">{t("transferTitle")}</h1>
          <StatusBadge status={booking.status} />
        </div>

        {/* Cover image */}
        {transfer.images[0]?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={transfer.images[0].url}
            alt={transfer.title}
            className="w-full h-52 object-cover rounded-lg"
          />
        ) : (
          <div className="w-full h-52 rounded-lg bg-blue-50 flex items-center justify-center">
            <TbRoute className="h-12 w-12 text-blue-300" />
          </div>
        )}

        {/* Transfer name + location */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{transfer.title}</h2>
          <span className="inline-block mt-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            {TRANSFER_TYPE_LABELS[transfer.type] ?? transfer.type}
          </span>
          {location && (
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
              <FiMapPin className="h-3.5 w-3.5" />
              {location}
            </div>
          )}
        </div>

        <Separator />

        {/* Trip details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-700">
            <FiCalendar className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">{t("date")}</p>
              <p className="font-medium">{fmtDate(booking.date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <FiClock className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">{t("time")}</p>
              <p className="font-medium">{booking.time}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <FiMapPin className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">{t("pickup")}</p>
              <p className="font-medium">{booking.pickupLocation}</p>
            </div>
          </div>
          {booking.dropoffLocation && (
            <div className="flex items-center gap-2 text-gray-700">
              <FiMapPin className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">{t("dropoff")}</p>
                <p className="font-medium">{booking.dropoffLocation}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-700">
            <FiUsers className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">{t("passengers")}</p>
              <p className="font-medium">{booking.passengers}</p>
            </div>
          </div>
          {transfer.type === "CHAUFFEUR" && booking.hoursRequested && (
            <div className="flex items-center gap-2 text-gray-700">
              <FiClock className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">{t("hours")}</p>
                <p className="font-medium">{booking.hoursRequested} h</p>
              </div>
            </div>
          )}
          {transfer.type === "AIRPORT_TRANSFER" && booking.flightNumber && (
            <div className="flex items-center gap-2 text-gray-700">
              <TbPlaneDeparture className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">{t("flightNumber")}</p>
                <p className="font-medium">{booking.flightNumber}</p>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Contact */}
        <div className="space-y-2 text-sm">
          <h3 className="font-semibold text-gray-900">{t("contact")}</h3>
          <div className="flex items-center gap-2 text-gray-600">
            <FiUser className="h-4 w-4 text-gray-400" />
            <span>{booking.contactName}</span>
          </div>
          {booking.contactPhone && (
            <div className="flex items-center gap-2 text-gray-600">
              <FiPhone className="h-4 w-4 text-gray-400" />
              <span>{booking.contactPhone}</span>
            </div>
          )}
        </div>

        {booking.notes && (
          <>
            <Separator />
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <FiFileText className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">{t("notes")}</p>
                <p>{booking.notes}</p>
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Price */}
        <div className="space-y-2 text-sm">
          <h3 className="font-semibold text-gray-900">{t("priceBreakdown")}</h3>
          {transfer.type === "CHAUFFEUR" && transfer.pricePerHour && booking.hoursRequested && (
            <div className="flex justify-between text-gray-600">
              <span>
                {transfer.pricePerHour} {PLATFORM_CURRENCY} × {booking.hoursRequested} h
              </span>
              <span>{total} {PLATFORM_CURRENCY}</span>
            </div>
          )}
          {transfer.type === "SHUTTLE" && transfer.pricePerPerson && (
            <div className="flex justify-between text-gray-600">
              <span>
                {transfer.pricePerPerson} {PLATFORM_CURRENCY} × {booking.passengers} {t("passengers").toLowerCase()}
              </span>
              <span>{total} {PLATFORM_CURRENCY}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-semibold text-gray-900">
            <span>{t("total")}</span>
            <span>{total} {PLATFORM_CURRENCY}</span>
          </div>
        </div>

        {/* Booking reference + QR code */}
        <BookingQRCode
          bookingRef={booking.bookingRef}
          baseUrl={process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}
        />

        {/* Cancel button */}
        {booking.status === "PENDING" && (
          <CancelTransferBookingButton
            bookingId={booking.id}
            locale={locale}
            label={t("cancel")}
            confirmLabel={t("confirmCancel")}
            cancelLabel={t("keepBooking")}
            successLabel={t("cancelSuccess")}
          />
        )}
      </div>
    </MaxWidthWrapper>
  );
}
