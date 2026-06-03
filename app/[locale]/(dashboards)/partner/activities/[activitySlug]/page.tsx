import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { FiChevronLeft, FiExternalLink, FiFileText, FiImage, FiStar, FiSettings } from "react-icons/fi";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getMyBusinessProfile, getActivityReviews } from "@/lib/actions/partner";
import { getDestinations } from "@/lib/actions/destinations";
import { ActivityDetailsTab } from "./_components/ActivityDetailsTab";
import { ImagesTab } from "./_components/ImagesTab";
import { ReviewsTab } from "./_components/ReviewsTab";
import { SettingsTab } from "./_components/SettingsTab";
import { ToggleTabs, ToggleTabsList, ToggleTabsTrigger, ToggleTabsContent } from "@/components/ui/toggle-tabs";

type Params = Promise<{ locale: string; activitySlug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { activitySlug } = await params;
  const t = await getTranslations("PartnerDashboard.editActivity");
  const activity = await prisma.activity.findUnique({
    where: { slug: activitySlug },
    select: { title: true },
  });
  return { title: `${activity?.title ?? "Activity"} · ${t("metaTitleSuffix")}` };
}

export default async function EditActivityPage({ params }: { params: Params }) {
  const { locale, activitySlug } = await params;
  const t = await getTranslations("PartnerDashboard.editActivity");

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) notFound();

  const profile = await getMyBusinessProfile();
  if (!profile) notFound();

  const [activity, destinations] = await Promise.all([
    prisma.activity.findUnique({
      where: { slug: activitySlug },
      include: {
        images: { select: { id: true, url: true }, orderBy: { createdAt: "asc" } },
        timeSlots: { select: { time: true }, orderBy: { time: "asc" } },
      },
    }),
    getDestinations(),
  ]);

  if (!activity || activity.profileId !== profile.id) notFound();

  const destinationOptions = destinations.map((d) => ({
    id:      d.id,
    label:   `${d.city}, ${d.country}`,
    city:    d.city,
    country: d.country,
    region:  d.region ?? "",
  }));

  const { reviews, guidniReview } = await getActivityReviews(activity.id);

  const unanswered = reviews.filter((r) => !r.response).length;

  return (
    <div className="space-y-6 max-w-screen-lg">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href={`/${locale}/partner/activities`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-2"
          >
            <FiChevronLeft className="h-4 w-4" />
            {t("backLabel")}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 truncate">{activity.title}</h1>
          <p className="text-sm text-gray-400 mt-1">{t("headerSubtitle")}</p>
        </div>
        <a
          href={`/${locale}/activities/${activitySlug}`}
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
            {activity.images.length > 0 && (
              <span className="ml-0.5 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium data-active:bg-gray-200">
                {activity.images.length}
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
            <ActivityDetailsTab activity={activity} destinations={destinationOptions} />
          </div>
        </ToggleTabsContent>

        <ToggleTabsContent value="images" keepMounted>
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <ImagesTab
              listingId={activity.id}
              type="activity"
              images={activity.images}
            />
          </div>
        </ToggleTabsContent>

        <ToggleTabsContent value="reviews">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <ReviewsTab
              reviews={reviews}
              guidniReview={guidniReview}
              activityId={activity.id}
            />
          </div>
        </ToggleTabsContent>

        <ToggleTabsContent value="settings">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <SettingsTab
              activityId={activity.id}
              activityPrice={activity.price}
              activityStatus={activity.status}
              agentCommissionEnabled={activity.agentCommissionEnabled}
              agentCommissionRate={activity.agentCommissionRate}
            />
          </div>
        </ToggleTabsContent>
      </ToggleTabs>

    </div>
  );
}
