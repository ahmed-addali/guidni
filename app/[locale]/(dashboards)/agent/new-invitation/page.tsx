import { notFound } from "next/navigation";
import { getMyAgentProfile } from "@/lib/actions/agent";
import { prisma } from "@/lib/db";
import { CreateInvitationForm } from "./_components/CreateInvitationForm";

type Params = Promise<{ locale: string }>;

export async function generateMetadata() {
  return { title: "New Invitation — Agent Dashboard" };
}

export default async function NewInvitationPage({ params }: { params: Params }) {
  const { locale } = await params;

  const [profile, activities] = await Promise.all([
    getMyAgentProfile(),
    prisma.activity.findMany({
      select: {
        id:                     true,
        title:                  true,
        city:                   true,
        price:                  true,
        availableTimes:         true,
        agentCommissionEnabled: true,
        agentCommissionRate:    true,
        destination:            { select: { city: true } },
      },
      orderBy: [
        { agentCommissionEnabled: "desc" },
        { title: "asc" },
      ],
      take: 200,
    }),
  ]);

  if (!profile) notFound();

  const activityOptions = activities.map((a) => ({
    id:                     a.id,
    title:                  a.title,
    city:                   a.destination?.city ?? a.city ?? "",
    price:                  a.price,
    times:                  a.availableTimes,
    agentCommissionEnabled: a.agentCommissionEnabled,
    agentCommissionRate:    a.agentCommissionRate,
  }));

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Send an Invitation</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Create a personalised booking link to share with your tourist.
        </p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8">
        <CreateInvitationForm activities={activityOptions} locale={locale} />
      </div>
    </div>
  );
}
