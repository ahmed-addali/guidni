import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { MaxWidthWrapper } from "@/components/shared/MaxWidthWrapper";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { getStayBookingById } from "@/lib/actions/user-bookings";
import { FiCalendar, FiMapPin, FiUsers } from "react-icons/fi";
import { IoBedOutline } from "react-icons/io5";
import { ChevronLeft } from "lucide-react";
import { CancelStayBookingButton } from "./_components/CancelStayBookingButton";
import { BookingQRCode } from "@/components/bookings/BookingQRCode";

type Params = Promise<{ locale: string; bookingId: string }>;

export default async function StayBookingDetailPage({ params }: { params: Params }) {
  const { locale, bookingId } = await params;

  const [booking, t] = await Promise.all([
    getStayBookingById(bookingId),
    getTranslations({ locale, namespace: "BookingDetail" }),
  ]);

  if (!booking) notFound();

  const stay = booking.stay;

  const fmtDate = (d: Date) =>
    d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const location = [stay.city, stay.region, stay.country]
    .filter(Boolean)
    .join(", ");

  const basePrice = Number(booking.basePrice);
  const cleaningFee = Number(booking.cleaningFee ?? 0);
  const serviceFee = Number(booking.serviceFee ?? 0);
  const taxes = Number(booking.taxes ?? 0);
  const total = Number(booking.totalPrice);

  return (
    <MaxWidthWrapper className="py-8">
      {/* Back link */}
      <Link
        href={`/${locale}/bookings`}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("backToBookings")}
      </Link>

      <div className="max-w-2xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">{t("stayTitle")}</h1>
          <StatusBadge status={booking.status} />
        </div>

        {/* Cover image */}
        {stay.images[0]?.url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={stay.images[0].url}
            alt={stay.title}
            className="w-full h-52 object-cover rounded-lg"
          />
        )}

        {/* Stay name */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{stay.title}</h2>
          {location && (
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
              <FiMapPin className="h-3.5 w-3.5" />
              {location}
            </div>
          )}
        </div>

        <Separator />

        {/* Booking details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-700">
            <FiCalendar className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">{t("checkIn")}</p>
              <p className="font-medium">{fmtDate(booking.checkIn)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <FiCalendar className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">{t("checkOut")}</p>
              <p className="font-medium">{fmtDate(booking.checkOut)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <IoBedOutline className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">{t("nights")}</p>
              <p className="font-medium">
                {booking.nights} {t("nights")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <FiUsers className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">{t("guests")}</p>
              <p className="font-medium">
                {booking.adults} {t("adults")}
                {booking.children > 0 ? `, ${booking.children} ${t("children")}` : ""}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Price breakdown */}
        <div className="space-y-2 text-sm">
          <h3 className="font-semibold text-gray-900">{t("priceBreakdown")}</h3>
          <div className="flex justify-between text-gray-600">
            <span>
              {stay.price} TND × {booking.nights} {t("nights")}
            </span>
            <span>{basePrice} TND</span>
          </div>
          {cleaningFee > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>{t("cleaningFee")}</span>
              <span>{cleaningFee} TND</span>
            </div>
          )}
          {serviceFee > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>{t("serviceFee")}</span>
              <span>{serviceFee} TND</span>
            </div>
          )}
          {taxes > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>{t("taxes")}</span>
              <span>{taxes} TND</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-semibold text-gray-900">
            <span>{t("total")}</span>
            <span>{total} TND</span>
          </div>
        </div>

        <Separator />

        {/* Contact info */}
        <div className="space-y-1 text-sm">
          <h3 className="font-semibold text-gray-900">{t("contact")}</h3>
          <p className="text-gray-600">{booking.contactName}</p>
          <p className="text-gray-600">{booking.contactEmail}</p>
          {booking.contactPhone && (
            <p className="text-gray-600">{booking.contactPhone}</p>
          )}
        </div>

        <Separator />

        {/* Payment info */}
        <div className="space-y-1 text-sm">
          <h3 className="font-semibold text-gray-900">{t("payment")}</h3>
          {booking.paymentMethod && (
            <p className="text-gray-600">
              {t("method")}: {booking.paymentMethod}
            </p>
          )}
          {booking.paymentOption && (
            <p className="text-gray-600">
              {t("paymentOption")}:{" "}
              {booking.paymentOption === "NOW" ? t("payNow") : t("payLater")}
            </p>
          )}
        </div>

        {/* Booking reference + QR code */}
        <BookingQRCode
          bookingRef={booking.bookingRef}
          baseUrl={process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}
        />

        {/* Cancel button */}
        {booking.status === "PENDING" && (
          <CancelStayBookingButton
            bookingId={booking.id}
            locale={locale}
            label={t("cancel")}
            confirmLabel={t("confirmCancel")}
            cancelLabel={t("keepBooking")}
          />
        )}
      </div>
    </MaxWidthWrapper>
  );
}
