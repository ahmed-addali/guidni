import { getTranslations } from "next-intl/server";
import { getMyTransfers } from "@/lib/actions/partner-transfers";
import { Pagination } from "@/components/shared/Pagination";
import { TransfersClient } from "./_components/TransfersClient";

type Params = Promise<{ locale: string }>;
type SearchParams = Promise<{ page?: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PartnerDashboard.transfers" });
  return { title: t("metaTitle") };
}

export default async function PartnerTransfersPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const [{ transfers, total, totalPages }, t] = await Promise.all([
    getMyTransfers(page),
    getTranslations({ locale, namespace: "PartnerDashboard.transfers" }),
  ]);

  return (
    <div className="space-y-6 max-w-screen-xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("pageTitle")}</h1>
        <p className="text-sm text-gray-400 mt-1">{t("pageSubtitle")}</p>
      </div>

      <TransfersClient transfers={transfers as never} total={total} />

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
