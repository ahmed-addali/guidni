import { getAllGuidePlansAdmin } from "@/lib/actions/admin-guides";
import { GuidePlansAdminClient } from "./_components/GuidePlansAdminClient";

type Params = Promise<{ locale: string }>;

export const metadata = { title: "Guide Plans — Admin · Guidni" };

export default async function AdminGuidePlansPage({ params }: { params: Params }) {
  const { locale } = await params;
  const plans = await getAllGuidePlansAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Guide Plans</h1>
        <p className="text-sm text-gray-400 mt-1">{plans.length} guide plan{plans.length !== 1 ? "s" : ""}</p>
      </div>
      <GuidePlansAdminClient plans={plans} locale={locale} />
    </div>
  );
}
