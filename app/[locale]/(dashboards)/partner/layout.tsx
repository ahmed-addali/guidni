import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMyBusinessProfile } from "@/lib/actions/partner";
import { PartnerSidebar } from "@/components/partner/PartnerSidebar";

type Params = Promise<{ locale: string }>;

export default async function PartnerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Params;
}) {
  const { locale } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/partner`);
  }
  if (session.user.role !== "PARTNER" && session.user.role !== "ADMIN") {
    redirect(`/${locale}`);
  }

  const profile = await getMyBusinessProfile();
  if (!profile) {
    redirect(`/${locale}/become-partner/apply`);
  }

  return (
    <div className="flex bg-gray-50 min-h-[calc(100vh-4rem)]">
      <PartnerSidebar businessName={profile.name} categories={profile.categories} profileImage={profile.profileImage} />
      <main className="flex-1 min-w-0 p-5 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
