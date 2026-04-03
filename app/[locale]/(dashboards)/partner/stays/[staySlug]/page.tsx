import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { FiChevronLeft } from "react-icons/fi";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getMyBusinessProfile } from "@/lib/actions/partner";
import { StayDetailsTab } from "./_components/StayDetailsTab";
import { ImagesTab } from "../../activities/[activitySlug]/_components/ImagesTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Params = Promise<{ locale: string; staySlug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { staySlug } = await params;
  const stay = await prisma.stay.findUnique({
    where: { slug: staySlug },
    select: { title: true },
  });
  return { title: `${stay?.title ?? "Stay"} · Partner Dashboard` };
}

export default async function EditStayPage({ params }: { params: Params }) {
  const { locale, staySlug } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) notFound();

  const profile = await getMyBusinessProfile();
  if (!profile) notFound();

  const stay = await prisma.stay.findUnique({
    where: { slug: staySlug },
    include: { images: { select: { id: true, url: true } } },
  });

  if (!stay || stay.profileId !== profile.id) notFound();

  return (
    <div className="space-y-6 max-w-screen-lg">
      <Link
        href={`/${locale}/partner/stays`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
      >
        <FiChevronLeft className="h-4 w-4" />
        Stays
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 truncate">{stay.title}</h1>
        <p className="text-sm text-gray-400 mt-1">Edit your stay listing.</p>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="images">Images ({stay.images.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <StayDetailsTab stay={stay} />
          </div>
        </TabsContent>

        <TabsContent value="images">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <ImagesTab
              listingId={stay.id}
              type="stay"
              images={stay.images}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
