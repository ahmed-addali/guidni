import { notFound } from "next/navigation";
import { CheckCircle2, MapPin, Calendar, Star } from "lucide-react";
import { prisma } from "@/lib/db";
import { AgentTierBadge } from "@/components/agent/AgentTierBadge";

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const agent = await prisma.agentProfile.findUnique({
    where:  { pseudonym: slug },
    select: { displayName: true, pseudonym: true },
  });
  if (!agent) return { title: "Agent not found" };
  const name = agent.pseudonym ? `@${agent.pseudonym}` : agent.displayName;
  return { title: `${name} — Guidni Local Agent` };
}

export default async function AgentPublicProfilePage({ params }: { params: Params }) {
  const { slug } = await params;

  const agent = await prisma.agentProfile.findUnique({
    where:  { pseudonym: slug, isActive: true },
    select: {
      id:          true,
      displayName: true,
      pseudonym:   true,
      bio:         true,
      tier:        true,
      isVerified:  true,
      totalEarned: true,
      createdAt:   true,
      destination: { select: { city: true, country: true } },
      _count:      { select: { invitations: true } },
    },
  });

  if (!agent) notFound();

  const name       = agent.pseudonym ? `@${agent.pseudonym}` : agent.displayName;
  const location   = [agent.destination?.city, agent.destination?.country].filter(Boolean).join(", ");
  const memberSince = agent.createdAt.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <div className="max-w-lg mx-auto px-4 py-12 space-y-6">

      {/* Profile card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-8 space-y-5">

        {/* Avatar + name */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-primary">
              {name.replace("@", "").charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{name}</h1>
              <AgentTierBadge tier={agent.tier} />
            </div>
            {agent.isVerified && (
              <div className="flex items-center gap-1.5 mt-1">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-sm text-primary font-medium">Verified Guidni Agent</span>
              </div>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
          {location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-gray-400" />
              {location}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-gray-400" />
            Member since {memberSince}
          </span>
        </div>

        {/* Bio */}
        {agent.bio && (
          <p className="text-sm text-gray-600 leading-relaxed">{agent.bio}</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{agent._count.invitations}</p>
            <p className="text-xs text-gray-400 mt-0.5">Bookings facilitated</p>
          </div>
          <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              <p className="text-2xl font-bold text-gray-900">
                {agent.tier === "ELITE" ? "5.0" : agent.tier === "PRO" ? "4.8" : "4.5"}
              </p>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Agent rating</p>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400">
        This agent operates under the Guidni Local Agent program.
      </p>
    </div>
  );
}
