import { getAllGuidePlansAdmin, getModerationQueue } from "@/lib/actions/admin-guides";
import { GuidePlansAdminClient } from "./_components/GuidePlansAdminClient";

type Params = Promise<{ locale: string }>;

export const metadata = { title: "Guide Plans — Admin · Guidni" };

export default async function AdminGuidePlansPage({ params }: { params: Params }) {
  const { locale } = await params;
  const [plans, queue] = await Promise.all([
    getAllGuidePlansAdmin(),
    getModerationQueue(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Guide Plans</h1>
          <p className="text-sm text-gray-400 mt-1">{plans.length} guide plan{plans.length !== 1 ? "s" : ""}</p>
        </div>
        {queue.length > 0 && (
          <span className="text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full">
            {queue.length} pending moderation
          </span>
        )}
      </div>
      <GuidePlansAdminClient plans={plans} moderationQueue={queue} locale={locale} />
    </div>
  );
}
