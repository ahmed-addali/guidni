import { getTranslations } from "next-intl/server";
import { getPartnerActivities } from "@/lib/actions/partner";
import { Pagination } from "@/components/shared/Pagination";
import { ActivitiesClient } from "./_components/ActivitiesClient";

type SearchParams = Promise<{ page?: string }>;

export async function generateMetadata() {
  const t = await getTranslations("PartnerDashboard.activities");
  return { title: t("metaTitle") };
}

export default async function PartnerActivitiesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const t = await getTranslations("PartnerDashboard.activities");
  const { activities, total, totalPages } = await getPartnerActivities(page);

  return (
    <div className="space-y-6 max-w-screen-xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("pageTitle")}</h1>
        <p className="text-sm text-gray-400 mt-1">{t("pageSubtitle")}</p>
      </div>

      <ActivitiesClient activities={activities} total={total} />

      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          previousLabel={t("previous")}
          nextLabel={t("next")}
        />
      )}
    </div>
  );
}
