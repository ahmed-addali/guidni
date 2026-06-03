import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { FiChevronLeft, FiExternalLink, FiFileText, FiImage, FiStar, FiSettings, FiCalendar } from "react-icons/fi";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getMyBusinessProfile, getStayReviews, getAvailabilityData } from "@/lib/actions/partner";
import { getDestinations } from "@/lib/actions/destinations";
import { StayDetailsTab } from "./_components/StayDetailsTab";
import { ImagesTab } from "../../activities/[activitySlug]/_components/ImagesTab";
import { AvailabilityTab } from "./_components/AvailabilityTab";
import { ReviewsTab } from "./_components/ReviewsTab";
import { SettingsTab } from "./_components/SettingsTab";
import { ToggleTabs, ToggleTabsList, ToggleTabsTrigger, ToggleTabsContent } from "@/components/ui/toggle-tabs";

type Params = Promise<{ locale: string; staySlug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { locale, staySlug } = await params;
  const t = await getTranslations({ locale, namespace: "PartnerDashboard.editStay" });
  const stay = await prisma.stay.findUnique({
    where: { slug: staySlug },
    select: { title: true },
  });
  return { title: `${stay?.title ?? "Stay"} · ${t("metaTitleSuffix")}` };
}

export default async function EditStayPage({ params }: { params: Params }) {
  const { locale, staySlug } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) notFound();

  const [profile, rawDestinations] = await Promise.all([
    getMyBusinessProfile(),
    getDestinations(),
  ]);
  if (!profile) notFound();

  const stay = await prisma.stay.findUnique({
    where: { slug: staySlug },
    include: { images: { select: { id: true, url: true }, orderBy: { order: "asc" } } },
  });

  if (!stay || stay.profileId !== profile.id) notFound();

  const t = await getTranslations({ locale, namespace: "PartnerDashboard.editStay" });

  const destinations = rawDestinations.map((d) => ({
    id:      d.id,
    label:   `${d.city}, ${d.country}`,
    city:    d.city,
    country: d.country,
    region:  d.region ?? "",
  }));

  const [{ reviews, guidniReview }, availabilityData] = await Promise.all([
    getStayReviews(stay.id),
    getAvailabilityData(stay.id),
  ]);
  const { blocked: blockedDates, reservations } = availabilityData;
  const unanswered = reviews.filter((r) => !r.response).length;

  return (
    <div className="space-y-6 max-w-screen-lg">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href={`/${locale}/partner/stays`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-2"
          >
            <FiChevronLeft className="h-4 w-4" />
            {t("backLabel")}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 truncate">{stay.title}</h1>
          <p className="text-sm text-gray-400 mt-1">{t("headerSubtitle")}</p>
        </div>
        <a
          href={`/${locale}/stays/${staySlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 rounded-xl px-3 py-2 hover:text-blue-600 hover:border-blue-300 transition-colors shrink-0 mt-7"
        >
          <FiExternalLink className="h-4 w-4" />
          {t("previewLabel")}
        </a>
      </div>

      <ToggleTabs defaultValue="details">
        <ToggleTabsList>
          <ToggleTabsTrigger value="details">
            <FiFileText />
            {t("tabs.details")}
          </ToggleTabsTrigger>

          <ToggleTabsTrigger value="images">
            <FiImage />
            {t("tabs.images")}
            {stay.images.length > 0 && (
              <span className="ml-0.5 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium data-active:bg-gray-200">
                {stay.images.length}
              </span>
            )}
          </ToggleTabsTrigger>

          <ToggleTabsTrigger value="availability">
            <FiCalendar />
            {t("tabs.availability")}
            {(blockedDates.length > 0 || reservations.length > 0) && (
              <span className="ml-0.5 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">
                {reservations.length + blockedDates.length}
              </span>
            )}
          </ToggleTabsTrigger>

          <ToggleTabsTrigger value="reviews">
            <FiStar />
            {t("tabs.reviews")}
            {reviews.length > 0 && (
              <span className={`ml-0.5 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                unanswered > 0
                  ? "bg-orange-100 text-orange-600"
                  : "bg-gray-100 text-gray-500"
              }`}>
                {reviews.length}
              </span>
            )}
          </ToggleTabsTrigger>

          <ToggleTabsTrigger value="settings">
            <FiSettings />
            {t("tabs.settings")}
          </ToggleTabsTrigger>
        </ToggleTabsList>

        <ToggleTabsContent value="details" keepMounted>
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <StayDetailsTab stay={stay} destinations={destinations} />
          </div>
        </ToggleTabsContent>

        <ToggleTabsContent value="images" keepMounted>
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <ImagesTab
              listingId={stay.id}
              type="stay"
              images={stay.images}
            />
          </div>
        </ToggleTabsContent>

        <ToggleTabsContent value="availability">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <AvailabilityTab
              stayId={stay.id}
              locale={locale}
              initialBlockedDates={blockedDates}
              initialReservations={reservations}
            />
          </div>
        </ToggleTabsContent>

        <ToggleTabsContent value="reviews">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <ReviewsTab
              reviews={reviews}
              guidniReview={guidniReview}
              stayId={stay.id}
            />
          </div>
        </ToggleTabsContent>

        <ToggleTabsContent value="settings">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <SettingsTab stayId={stay.id} />
          </div>
        </ToggleTabsContent>
      </ToggleTabs>
    </div>
  );
}
