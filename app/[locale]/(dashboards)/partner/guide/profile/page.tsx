import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDestinations } from "@/lib/actions/destinations";
import { getMyGuideProfile } from "@/lib/actions/partner-guides";
import { GuideProfileForm } from "./_components/GuideProfileForm";

type Params = Promise<{ locale: string }>;

export const metadata = { title: "Guide Profile — Guidni Partner" };

export default async function GuideProfilePage({ params }: { params: Params }) {
  const { locale } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect(`/${locale}/login`);

  const [profile, destinations] = await Promise.all([
    getMyGuideProfile(),
    getDestinations(),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {profile ? "Edit Profile" : "Create Guide Profile"}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {profile
            ? "Your public profile shown to travelers browsing local guides."
            : "Set up your public guide profile to start publishing plans."}
        </p>
      </div>

      <GuideProfileForm
        profile={profile ? { ...profile } : null}
        destinations={destinations.map((d) => ({ id: d.id, city: d.city, country: d.country }))}
        locale={locale}
      />
    </div>
  );
}
