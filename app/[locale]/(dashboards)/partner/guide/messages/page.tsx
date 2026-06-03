import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMyGuideProfile } from "@/lib/actions/partner-guides";
import { getGuideConversations } from "@/lib/actions/guide-messages";
import { MessagesInboxClient } from "./_components/MessagesInboxClient";

type Params = Promise<{ locale: string }>;

export const metadata = { title: "Messages — Guidni Partner" };

export default async function GuideMessagesPage({ params }: { params: Params }) {
  const { locale } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect(`/${locale}/login`);

  const profile = await getMyGuideProfile();
  if (!profile) redirect(`/${locale}/partner/guide/profile`);

  const conversations = await getGuideConversations();

  return (
    <div className="space-y-6 max-w-screen-xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-sm text-gray-400 mt-1">
          {conversations.length === 0
            ? "No conversations yet"
            : `${conversations.length} conversation${conversations.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      <MessagesInboxClient
        conversations={conversations}
        currentUserId={session.user.id}
      />
    </div>
  );
}
