import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { FiChevronLeft, FiExternalLink, FiFileText, FiImage, FiStar, FiSettings, FiCalendar } from "react-icons/fi";
import { getDestinations } from "@/lib/actions/destinations";
import { getMyTransferBySlug, getTransferReviews, getTransferAvailabilityData } from "@/lib/actions/partner-transfers";
import { getPartnerTransferReservations } from "@/lib/actions/transfer-reservations";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ToggleTabs, ToggleTabsList, ToggleTabsTrigger, ToggleTabsContent } from "@/components/ui/toggle-tabs";
import { DetailsTab }     from "./_components/DetailsTab";
import { ImagesTab }      from "./_components/ImagesTab";
import { AvailabilityTab } from "./_components/AvailabilityTab";
import { ReviewsTab }     from "./_components/ReviewsTab";
import { SettingsTab }    from "./_components/SettingsTab";
import { ReservationsTab } from "./_components/ReservationsTab";

type Params = Promise<{ locale: string; transferSlug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { locale, transferSlug } = await params;
  const t        = await getTranslations({ locale, namespace: "PartnerDashboard.editTransfer" });
  const transfer = await getMyTransferBySlug(transferSlug);
  return { title: `${transfer?.title ?? "Transfer"} · ${t("metaTitleSuffix")}` };
}

export default async function EditTransferPage({ params }: { params: Params }) {
  const { locale, transferSlug } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) notFound();

  const [transfer, destinations, t] = await Promise.all([
    getMyTransferBySlug(transferSlug),
    getDestinations(),
    getTranslations({ locale, namespace: "PartnerDashboard.editTransfer" }),
  ]);

  if (!transfer) notFound();

  const [{ reviews, guidniReview }, reservations, availabilityData] = await Promise.all([
    getTransferReviews(transfer.id),
    getPartnerTransferReservations(transfer.id),
    getTransferAvailabilityData(transfer.id),
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
            href={`/${locale}/partner/transfers`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-2"
          >
            <FiChevronLeft className="h-4 w-4" />
            {t("backLabel")}
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{transfer.title}</h1>
            {transfer.status !== "ACTIVE" && (
              <StatusBadge status={transfer.status} />
            )}
          </div>
          <p className="text-sm text-gray-400 mt-1">{t("headerSubtitle")}</p>
        </div>
        {transfer.destination && (
          <a
            href={`/${locale}/transport/transfers/${transfer.slug}`}
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
            {t("tabs.images", { count: transfer.images.length })}
            {transfer.images.length > 0 && (
              <span className="ml-0.5 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium data-active:bg-gray-200">
                {transfer.images.length}
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
            transfer={transfer}
            destinations={destList}
          />
        </ToggleTabsContent>

        <ToggleTabsContent value="images">
          <ImagesTab
            transferId={transfer.id}
            images={transfer.images}
          />
        </ToggleTabsContent>

        <ToggleTabsContent value="availability">
          <AvailabilityTab
            transferId={transfer.id}
            transferType={transfer.type}
            locale={locale}
            initialBlockedDates={blockedDates}
            initialReservations={upcomingReservations}
          />
        </ToggleTabsContent>

        <ToggleTabsContent value="reviews">
          <ReviewsTab
            reviews={reviews}
            guidniReview={guidniReview}
            transferId={transfer.id}
          />
        </ToggleTabsContent>

        <ToggleTabsContent value="bookings">
          <ReservationsTab initialReservations={reservations} />
        </ToggleTabsContent>

        <ToggleTabsContent value="settings">
          <SettingsTab
            transferId={transfer.id}
            transferTitle={transfer.title}
            transferStatus={transfer.status as "DRAFT" | "ACTIVE" | "SUSPENDED"}
          />
        </ToggleTabsContent>
      </ToggleTabs>
    </div>
  );
}
