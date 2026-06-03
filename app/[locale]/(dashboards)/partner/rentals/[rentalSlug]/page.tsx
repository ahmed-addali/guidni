import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { FiChevronLeft, FiExternalLink, FiFileText, FiImage, FiStar, FiSettings, FiCalendar } from "react-icons/fi";
import { getDestinations } from "@/lib/actions/destinations";
import { getMyRentalBySlug, getRentalReviews, getRentalAvailabilityData } from "@/lib/actions/partner-rentals";
import { getPartnerRentalReservations } from "@/lib/actions/rental-reservations";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ToggleTabs, ToggleTabsList, ToggleTabsTrigger, ToggleTabsContent } from "@/components/ui/toggle-tabs";
import { DetailsTab }      from "./_components/DetailsTab";
import { ImagesTab }       from "./_components/ImagesTab";
import { AvailabilityTab } from "./_components/AvailabilityTab";
import { ReviewsTab }      from "./_components/ReviewsTab";
import { SettingsTab }     from "./_components/SettingsTab";
import { ReservationsTab } from "./_components/ReservationsTab";

type Params = Promise<{ locale: string; rentalSlug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { locale, rentalSlug } = await params;
  const t      = await getTranslations({ locale, namespace: "PartnerDashboard.editRental" });
  const rental = await getMyRentalBySlug(rentalSlug);
  return { title: `${rental?.title ?? "Rental"} · ${t("metaTitleSuffix")}` };
}

export default async function EditRentalPage({ params }: { params: Params }) {
  const { locale, rentalSlug } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) notFound();

  const [rental, destinations, t] = await Promise.all([
    getMyRentalBySlug(rentalSlug),
    getDestinations(),
    getTranslations({ locale, namespace: "PartnerDashboard.editRental" }),
  ]);

  if (!rental) notFound();

  const [{ reviews, guidniReview }, reservations, availabilityData] = await Promise.all([
    getRentalReviews(rental.id),
    getPartnerRentalReservations(rental.id),
    getRentalAvailabilityData(rental.id),
  ]);
  const { blocked: blockedDates, reservations: upcomingReservations } = availabilityData;

  const destList = destinations.map((d) => ({
    id:      d.id,
    label:   `${d.city}, ${d.country}`,
    city:    d.city,
    country: d.country,
    region:  d.region ?? null,
  }));

  const unansweredReviews = reviews.filter((r) => !r.response).length;

  return (
    <div className="space-y-6 max-w-screen-lg">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href={`/${locale}/partner/rentals`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-2"
          >
            <FiChevronLeft className="h-4 w-4" />
            {t("backLabel")}
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{rental.title}</h1>
            {rental.status !== "ACTIVE" && (
              <StatusBadge status={rental.status} />
            )}
          </div>
          <p className="text-sm text-gray-400 mt-1">{t("headerSubtitle")}</p>
        </div>
        {rental.destination && (
          <a
            href={`/${locale}/transport/rentals/${rental.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 rounded-xl px-3 py-2 hover:text-blue-600 hover:border-blue-300 transition-colors shrink-0 mt-7"
          >
            <FiExternalLink className="h-4 w-4" />
            {t("previewLabel")}
          </a>
        )}
      </div>

      <ToggleTabs defaultValue="details" className="w-full">
        <ToggleTabsList className="flex-wrap">
          <ToggleTabsTrigger value="details">
            <FiFileText />
            {t("tabs.details")}
          </ToggleTabsTrigger>

          <ToggleTabsTrigger value="images">
            <FiImage />
            {t("tabs.images", { count: rental.images.length })}
            {rental.images.length > 0 && (
              <span className="ml-0.5 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium data-active:bg-gray-200">
                {rental.images.length}
              </span>
            )}
          </ToggleTabsTrigger>

          <ToggleTabsTrigger value="availability">
            <FiCalendar />
            {t("tabs.availability")}
            {(blockedDates.length > 0 || upcomingReservations.length > 0) && (
              <span className="ml-0.5 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">
                {upcomingReservations.length + blockedDates.length}
              </span>
            )}
          </ToggleTabsTrigger>

          <ToggleTabsTrigger value="reviews">
            <FiStar />
            {t("tabs.reviews")}
            {reviews.length > 0 && (
              <span className={`ml-0.5 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                unansweredReviews > 0
                  ? "bg-orange-100 text-orange-600"
                  : "bg-gray-100 text-gray-500"
              }`}>
                {reviews.length}
              </span>
            )}
          </ToggleTabsTrigger>

          <ToggleTabsTrigger value="bookings">
            <FiCalendar />
            {t("tabs.bookings")}
            {reservations.length > 0 && (
              <span className="ml-0.5 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium data-active:bg-gray-200">
                {reservations.length}
              </span>
            )}
          </ToggleTabsTrigger>

          <ToggleTabsTrigger value="settings">
            <FiSettings />
            {t("tabs.settings")}
          </ToggleTabsTrigger>
        </ToggleTabsList>

        <ToggleTabsContent value="details">
          <DetailsTab
            rental={rental}
            destinations={destList}
          />
        </ToggleTabsContent>

        <ToggleTabsContent value="images">
          <ImagesTab
            rentalId={rental.id}
            images={rental.images}
          />
        </ToggleTabsContent>

        <ToggleTabsContent value="availability">
          <AvailabilityTab
            rentalId={rental.id}
            locale={locale}
            initialBlockedDates={blockedDates}
            initialReservations={upcomingReservations}
          />
        </ToggleTabsContent>

        <ToggleTabsContent value="reviews">
          <ReviewsTab
            reviews={reviews}
            guidniReview={guidniReview}
            rentalId={rental.id}
          />
        </ToggleTabsContent>

        <ToggleTabsContent value="bookings">
          <ReservationsTab initialReservations={reservations} />
        </ToggleTabsContent>

        <ToggleTabsContent value="settings">
          <SettingsTab
            rentalId={rental.id}
            rentalTitle={rental.title}
            rentalStatus={rental.status as "DRAFT" | "ACTIVE" | "SUSPENDED"}
          />
        </ToggleTabsContent>
      </ToggleTabs>
    </div>
  );
}
