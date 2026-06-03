import { getAllGuidesAdmin, getVerificationQueue } from "@/lib/actions/admin-guides";
import { GuidesAdminClient } from "./_components/GuidesAdminClient";

type Params = Promise<{ locale: string }>;

export const metadata = { title: "Guides — Admin · Guidni" };

export default async function AdminGuidesPage({ params }: { params: Params }) {
  const { locale } = await params;
  const [guides, queue] = await Promise.all([
    getAllGuidesAdmin(),
    getVerificationQueue(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Local Guides</h1>
          <p className="text-sm text-gray-400 mt-1">{guides.length} guide profile{guides.length !== 1 ? "s" : ""}</p>
        </div>
        {queue.length > 0 && (
          <span className="text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full">
            {queue.length} pending verification
          </span>
        )}
      </div>
      <GuidesAdminClient guides={guides} verificationQueue={queue} locale={locale} />
    </div>
  );
}
