import { notFound } from "next/navigation";
import { getMyAgentProfile } from "@/lib/actions/agent";
import { AgentProfileForm } from "./_components/AgentProfileForm";

type Params = Promise<{ locale: string }>;

export async function generateMetadata() {
  return { title: "Profile — Agent Dashboard" };
}

export default async function AgentProfilePage({ params }: { params: Params }) {
  const { locale } = await params;
  const profile = await getMyAgentProfile();
  if (!profile) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm mt-0.5">Update your agent profile information.</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8">
        <AgentProfileForm
          profile={{
            id:          profile.id,
            displayName: profile.displayName,
            pseudonym:   profile.pseudonym,
            phone:       profile.phone,
            country:     profile.country,
            city:        profile.city,
            bio:         profile.bio,
          }}
        />
      </div>

      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-1">
        <p className="text-sm font-medium text-gray-700">Agent ID</p>
        <p className="text-xs text-gray-400 font-mono">{profile.id}</p>
        <p className="text-xs text-gray-400">
          Joined {new Date(profile.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
