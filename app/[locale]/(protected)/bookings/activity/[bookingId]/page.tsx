import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { MaxWidthWrapper } from "@/components/shared/MaxWidthWrapper";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { getActivityBookingById } from "@/lib/actions/user-bookings";
import { TAXES, SERVICE_FEE } from "@/lib/constants/payments";
import { FiCalendar, FiClock, FiMapPin, FiUsers } from "react-icons/fi";
import { ChevronLeft } from "lucide-react";
import { CancelActivityBookingButton } from "./_components/CancelActivityBookingButton";
import { BookingQRCode } from "@/components/bookings/BookingQRCode";

type Params = Promise<{ locale: string; bookingId: string }>;

export default async function ActivityBookingDetailPage({ params }: { params: Params }) {
  const { locale, bookingId } = await params;

  const [booking, t] = await Promise.all([
    getActivityBookingById(bookingId),
    getTranslations({ locale, namespace: "BookingDetail" }),
  ]);

  if (!booking) notFound();

  const activity = booking.activity;
  const subtotal = (booking.adults + booking.children) * activity.price;
  const total = Number(booking.totalPrice);

  const displayDate = booking.date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const location = [
    activity.destination?.city,
    activity.destination?.country,
  ]
    .filter(Boolean)
    .join(", ");

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
          <h1 className="text-2xl font-bold text-gray-900">{t("activityTitle")}</h1>
          <StatusBadge status={booking.status} />
        </div>

        {/* Cover image */}
        {activity.images[0]?.url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activity.images[0].url}
            alt={activity.title}
            className="w-full h-52 object-cover rounded-lg"
          />
        )}

        {/* Activity name */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{activity.title}</h2>
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
              <p className="text-xs text-gray-400">{t("date")}</p>
              <p className="font-medium">{displayDate}</p>
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
            <FiUsers className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">{t("participants")}</p>
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
              {booking.adults + booking.children} × {activity.price} TND
            </span>
            <span>{subtotal} TND</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>{t("taxes")}</span>
            <span>{TAXES} TND</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>{t("serviceFee")}</span>
            <span>{SERVICE_FEE} TND</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold text-gray-900">
            <span>{t("total")}</span>
            <span>{total} TND</span>
          </div>
        </div>

        <Separator />

        {/* Payment info */}
        <div className="space-y-1 text-sm">
          <h3 className="font-semibold text-gray-900">{t("payment")}</h3>
          <p className="text-gray-600">
            {t("method")}: {booking.paymentMethod}
          </p>
          <p className="text-gray-600">
            {t("paymentOption")}: {booking.paymentOption === "NOW" ? t("payNow") : t("payLater")}
          </p>
        </div>

        {/* Booking reference + QR code */}
        <BookingQRCode
          bookingRef={booking.bookingRef}
          baseUrl={process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}
        />

        {/* Cancel button */}
        {booking.status === "PENDING" && (
          <CancelActivityBookingButton
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
