import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getMyGuideProfile, getMyGuidePlanById } from "@/lib/actions/partner-guides";
import { GuidePlanEditor } from "./_components/GuidePlanEditor";

type Params = Promise<{ locale: string; planId: string }>;

export const metadata = { title: "Edit Plan — Guidni Partner" };

export default async function GuidePlanEditPage({ params }: { params: Params }) {
  const { locale, planId } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect(`/${locale}/login`);

  const [profile, plan] = await Promise.all([
    getMyGuideProfile(),
    getMyGuidePlanById(planId),
  ]);

  if (!profile) redirect(`/${locale}/partner/guide/profile`);
  if (!plan) notFound();

  return (
    <div className="max-w-screen-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 truncate">
          {plan.title ?? `${plan.duration}-Day Plan`}
        </h1>
        <p className="text-sm text-gray-400 mt-1">Edit your guide plan</p>
      </div>

      <GuidePlanEditor plan={plan} locale={locale} />
    </div>
  );
}
