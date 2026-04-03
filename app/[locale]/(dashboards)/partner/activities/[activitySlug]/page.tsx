import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { FiChevronLeft } from "react-icons/fi";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getMyBusinessProfile } from "@/lib/actions/partner";
import { ActivityDetailsTab } from "./_components/ActivityDetailsTab";
import { ImagesTab } from "./_components/ImagesTab";
import { AgentProgramSection } from "@/components/agent/AgentProgramSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Params = Promise<{ locale: string; activitySlug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { activitySlug } = await params;
  const activity = await prisma.activity.findUnique({
    where: { slug: activitySlug },
    select: { title: true },
  });
  return { title: `${activity?.title ?? "Activity"} · Partner Dashboard` };
}

export default async function EditActivityPage({ params }: { params: Params }) {
  const { locale, activitySlug } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) notFound();

  const profile = await getMyBusinessProfile();
  if (!profile) notFound();

  const activity = await prisma.activity.findUnique({
    where: { slug: activitySlug },
    include: { images: { select: { id: true, url: true } } },
  });

  if (!activity || activity.profileId !== profile.id) notFound();

  return (
    <div className="space-y-6 max-w-screen-lg">
      {/* Back */}
      <Link
        href={`/${locale}/partner/activities`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
      >
        <FiChevronLeft className="h-4 w-4" />
        Activities
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 truncate">{activity.title}</h1>
        <p className="text-sm text-gray-400 mt-1">Edit your activity listing.</p>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="images">Images ({activity.images.length})</TabsTrigger>
          <TabsTrigger value="agent">Agent Program</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <ActivityDetailsTab activity={activity} />
          </div>
        </TabsContent>

        <TabsContent value="images">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <ImagesTab
              listingId={activity.id}
              type="activity"
              images={activity.images}
            />
          </div>
        </TabsContent>

        <TabsContent value="agent">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <AgentProgramSection
              activityId={activity.id}
              activityPrice={activity.price}
              agentCommissionEnabled={activity.agentCommissionEnabled}
              agentCommissionRate={activity.agentCommissionRate}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
