import { getAllGuidesAdmin, setGuideVerification, setGuideFeatured, setGuideActive } from "@/lib/actions/admin-guides";
import { GuidesAdminClient } from "./_components/GuidesAdminClient";

type Params = Promise<{ locale: string }>;

export const metadata = { title: "Guides — Admin · Guidni" };

export default async function AdminGuidesPage({ params }: { params: Params }) {
  const { locale } = await params;
  const guides = await getAllGuidesAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Local Guides</h1>
        <p className="text-sm text-gray-400 mt-1">{guides.length} guide profile{guides.length !== 1 ? "s" : ""}</p>
      </div>
      <GuidesAdminClient guides={guides} locale={locale} />
    </div>
  );
}
