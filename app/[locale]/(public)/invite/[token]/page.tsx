import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, Users, CalendarDays, ShieldCheck } from "lucide-react";
import { getAgentInvitationByToken, markInvitationOpened } from "@/lib/actions/agent";
import { prisma } from "@/lib/db";

type Params = Promise<{ locale: string; token: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { token } = await params;
  const invitation = await getAgentInvitationByToken(token);
  if (!invitation) return { title: "Invitation not found" };
  return { title: `You've been invited to book on Guidni` };
}

export default async function InvitePage({ params }: { params: Params }) {
  const { locale, token } = await params;

  const invitation = await getAgentInvitationByToken(token);
  if (!invitation) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
          <Clock className="h-8 w-8 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Invitation expired</h1>
        <p className="text-gray-500">
          This invitation link has expired or is no longer valid. Ask your local agent to send a new one.
        </p>
        <Link
          href={`/${locale}/activities`}
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
        >
          Browse activities →
        </Link>
      </div>
    );
  }

  // Mark as opened (fire-and-forget — don't block render)
  void markInvitationOpened(token);

  // Fetch the activity
  const activity = invitation.listingType === "ACTIVITY"
    ? await prisma.activity.findUnique({
        where: { id: invitation.listingId },
        select: {
          id:          true,
          slug:        true,
          title:       true,
          price:       true,
          city:        true,
          availableTimes: true,
          images:      { select: { url: true }, take: 1 },
          destination: { select: { city: true } },
        },
      })
    : null;

  if (!activity) notFound();

  const agentDisplayName = invitation.agent.pseudonym
    ? `@${invitation.agent.pseudonym}`
    : invitation.agent.displayName;

  // Build checkout URL if invitation has pre-filled details
  const checkoutUrl = invitation.date
    ? `/${locale}/checkout?type=activity&activityId=${activity.id}&date=${invitation.date}&time=${invitation.timeSlot ?? activity.availableTimes.split(",")[0]?.trim()}&adults=${invitation.adults}&children=${invitation.children}&agentToken=${token}`
    : `/${locale}/activities/${activity.slug}?agentToken=${token}`;

  const hoursRemaining = Math.floor(
    (invitation.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)
  );
  const expiresSoon = hoursRemaining < 24;

  const coverUrl = activity.images[0]?.url;
  const city = activity.destination?.city ?? activity.city ?? "";

  return (
    <div className="max-w-lg mx-auto px-4 py-12 space-y-6">

      {/* Agent recommendation strip */}
      <div className="flex items-center gap-3 bg-primary/5 border border-primary/10 rounded-2xl px-4 py-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <ShieldCheck className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            Recommended by {agentDisplayName}
          </p>
          {invitation.agent.isVerified && (
            <p className="text-xs text-primary flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Verified Guidni Agent
            </p>
          )}
        </div>
      </div>

      {/* Activity card */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        {coverUrl && (
          <div className="aspect-[16/7] bg-gray-100 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverUrl}
              alt={activity.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-6 space-y-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{activity.title}</h1>
            {city && <p className="text-sm text-gray-400 mt-0.5">{city}</p>}
          </div>

          {/* Booking details from invitation */}
          <div className="grid grid-cols-2 gap-3">
            {invitation.date && (
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                <CalendarDays className="h-4 w-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Date</p>
                  <p className="text-sm font-medium text-gray-800">{invitation.date}</p>
                </div>
              </div>
            )}
            {invitation.timeSlot && (
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Time</p>
                  <p className="text-sm font-medium text-gray-800">{invitation.timeSlot}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
              <Users className="h-4 w-4 text-gray-400 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Guests</p>
                <p className="text-sm font-medium text-gray-800">
                  {invitation.adults} adult{invitation.adults !== 1 ? "s" : ""}
                  {invitation.children > 0 ? ` · ${invitation.children} child${invitation.children !== 1 ? "ren" : ""}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Price / person</p>
                <p className="text-sm font-bold text-gray-900">{activity.price} TND</p>
              </div>
            </div>
          </div>

          {/* Agent's note */}
          {invitation.note && (
            <div className="bg-primary/5 border border-primary/10 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-500 italic">"{invitation.note}"</p>
              <p className="text-xs text-gray-400 mt-1">— {agentDisplayName}</p>
            </div>
          )}

          {/* Expiry warning */}
          {expiresSoon && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              Expires in {hoursRemaining} hour{hoursRemaining !== 1 ? "s" : ""} — book soon!
            </p>
          )}

          <Link
            href={checkoutUrl}
            className="block w-full bg-primary text-white text-center font-semibold py-3.5 rounded-xl hover:bg-primary/90 transition-colors text-base"
          >
            Book now →
          </Link>

          <p className="text-xs text-gray-400 text-center">
            You&apos;ll complete your booking on Guidni&apos;s secure checkout.
          </p>
        </div>
      </div>

      {/* Expiry info */}
      <p className="text-xs text-center text-gray-400">
        This invitation expires on {invitation.expiresAt.toLocaleDateString("en-GB", {
          day: "numeric", month: "long", year: "numeric",
        })}.
      </p>

    </div>
  );
}
