import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMyAgentProfile } from "@/lib/actions/agent";
import { AgentSidebar } from "@/components/agent/AgentSidebar";

type Params = Promise<{ locale: string }>;

export default async function AgentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Params;
}) {
  const { locale } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/agent`);
  }

  const profile = await getMyAgentProfile();
  if (!profile) {
    redirect(`/${locale}/apply-agent`);
  }
  if (!profile.isVerified) {
    redirect(`/${locale}/apply-agent`);
  }

  return (
    <div className="flex bg-gray-50 min-h-[calc(100vh-4rem)]">
      <AgentSidebar
        displayName={profile.displayName}
        pseudonym={profile.pseudonym}
      />
      <main className="flex-1 min-w-0 p-5 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
