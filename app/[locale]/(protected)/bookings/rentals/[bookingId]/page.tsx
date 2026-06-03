import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { MaxWidthWrapper } from "@/components/shared/MaxWidthWrapper";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { getRentalBookingById } from "@/lib/actions/user-bookings";
import { PLATFORM_CURRENCY } from "@/lib/utils/constants";
import { FiCalendar, FiMapPin, FiFileText } from "react-icons/fi";
import { TbCar } from "react-icons/tb";
import { ChevronLeft } from "lucide-react";
import { CancelRentalBookingButton } from "./_components/CancelRentalBookingButton";
import { BookingQRCode } from "@/components/bookings/BookingQRCode";

type Params = Promise<{ locale: string; bookingId: string }>;

export default async function RentalBookingDetailPage({ params }: { params: Params }) {
  const { locale, bookingId } = await params;

  const [booking, t] = await Promise.all([
    getRentalBookingById(bookingId),
    getTranslations({ locale, namespace: "BookingDetail" }),
  ]);

  if (!booking) notFound();

  const rental = booking.rental;
  const total = Number(booking.totalPrice);

  const fmtDate = (d: Date) =>
    d.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const location = [rental.city, rental.region, rental.country].filter(Boolean).join(", ");

  return (
    <MaxWidthWrapper className="py-8">
      {/* Back link */}
      <Link
        href={`/${locale}/bookings?tab=rentals`}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("backToBookings")}
      </Link>

      <div className="max-w-2xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">{t("rentalTitle")}</h1>
          <StatusBadge status={booking.status} />
        </div>

        {/* Cover image */}
        {rental.images[0]?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={rental.images[0].url}
            alt={rental.title}
            className="w-full h-52 object-cover rounded-lg"
          />
        ) : (
          <div className="w-full h-52 rounded-lg bg-teal-50 flex items-center justify-center">
            <TbCar className="h-12 w-12 text-teal-300" />
          </div>
        )}

        {/* Rental name + location */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{rental.title}</h2>
          <span className="inline-block mt-1 text-xs text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full capitalize">
            {rental.type.toLowerCase().replace("_", " ")}
          </span>
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
              <p className="text-xs text-gray-400">{t("pickupDate")}</p>
              <p className="font-medium">{fmtDate(booking.startDate)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <FiCalendar className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">{t("returnDate")}</p>
              <p className="font-medium">{fmtDate(booking.endDate)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <TbCar className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">{t("days")}</p>
              <p className="font-medium">
                {booking.days} {t("days")}
              </p>
            </div>
          </div>
        </div>

        {booking.notes && (
          <>
            <Separator />
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <FiFileText className="h-4 w-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">{t("notes")}</p>
                  <p className="text-gray-700">{booking.notes}</p>
                </div>
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Price breakdown */}
        <div className="space-y-2 text-sm">
          <h3 className="font-semibold text-gray-900">{t("priceBreakdown")}</h3>
          <div className="flex justify-between text-gray-600">
            <span>
              {rental.pricePerDay} {PLATFORM_CURRENCY} × {booking.days} {t("days")}
            </span>
            <span>{total} {PLATFORM_CURRENCY}</span>
          </div>
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
          <CancelRentalBookingButton
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
