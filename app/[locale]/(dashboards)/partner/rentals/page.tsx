import { getTranslations } from "next-intl/server";
import { getMyRentals } from "@/lib/actions/partner-rentals";
import { Pagination } from "@/components/shared/Pagination";
import { RentalsClient } from "./_components/RentalsClient";

type Params = Promise<{ locale: string }>;
type SearchParams = Promise<{ page?: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PartnerDashboard.rentals" });
  return { title: t("metaTitle") };
}

export default async function PartnerRentalsPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const [{ rentals, total, totalPages }, t] = await Promise.all([
    getMyRentals(page),
    getTranslations({ locale, namespace: "PartnerDashboard.rentals" }),
  ]);

  return (
    <div className="space-y-6 max-w-screen-xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("pageTitle")}</h1>
        <p className="text-sm text-gray-400 mt-1">{t("pageSubtitle")}</p>
      </div>

      <RentalsClient rentals={rentals as never} total={total} />

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
