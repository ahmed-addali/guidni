import { getTranslations } from "next-intl/server";
import { getAdminRestaurants } from "@/lib/actions/admin";
import { RestaurantStatusActions } from "./_components/RestaurantStatusActions";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin.restaurants" });
  return { title: t("metaTitle") };
}

export default async function AdminRestaurantsPage({ params }: { params: Params }) {
  const { locale } = await params;

  const [restaurants, t] = await Promise.all([
    getAdminRestaurants(),
    getTranslations({ locale, namespace: "Admin.restaurants" }),
  ]);

  const counts = restaurants.reduce(
    (acc, r) => {
      const key = r.approvalStatus as keyof typeof acc;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    { APPROVED: 0, DRAFT: 0, SUSPENDED: 0 } as Record<string, number>
  );

  const actionLabels = {
    approveLabel:       t("actionApprove"),
    suspendLabel:       t("actionSuspend"),
    featureLabel:       t("actionFeature"),
    unfeatureLabel:     t("actionUnfeature"),
    approvedLabel:      t("statusApproved"),
    suspendedLabel:     t("statusSuspended"),
    draftLabel:         t("statusDraft"),
    toastApproved:      t("toastApproved"),
    toastSuspended:     t("toastSuspended"),
    toastDraft:         t("toastDraft"),
    toastStatusFailed:  t("toastStatusFailed"),
    toastFeatureFailed: t("toastFeatureFailed"),
  };

  const TYPE_LABEL: Record<string, string> = {
    RESTAURANT: "Restaurant",
    CAFEE_SHOP: "Café",
    BOTH:       "Restaurant & Café",
  };

  return (
    <div className="space-y-6 max-w-screen-xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("heading")}</h1>
        <p className="text-sm text-gray-400 mt-1">
          {t("summary", {
            total:     restaurants.length,
            approved:  counts.APPROVED,
            draft:     counts.DRAFT,
            suspended: counts.SUSPENDED,
          })}
        </p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {restaurants.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">{t("empty")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                  <th className="text-left px-6 py-3 font-medium">{t("colName")}</th>
                  <th className="text-left px-6 py-3 font-medium">{t("colType")}</th>
                  <th className="text-left px-6 py-3 font-medium">{t("colDestination")}</th>
                  <th className="text-left px-6 py-3 font-medium">{t("colPartner")}</th>
                  <th className="text-left px-6 py-3 font-medium">{t("colReservations")}</th>
                  <th className="text-left px-6 py-3 font-medium">{t("colActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {restaurants.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-gray-800 max-w-[220px]">
                      <span className="block truncate">{r.name}</span>
                      <span className="text-xs text-gray-400 font-normal">{r.slug}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        {TYPE_LABEL[r.type] ?? r.type}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-gray-600">
                      {r.destination?.city ?? "—"}
                    </td>
                    <td className="px-6 py-3.5 text-gray-500 text-xs">
                      {r.businessProfile.name}
                    </td>
                    <td className="px-6 py-3.5 text-gray-500 text-xs">
                      {r.reservationsEnabled ? (
                        <span className="text-green-600 font-medium">✓ On</span>
                      ) : (
                        <span className="text-gray-400">Off</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <RestaurantStatusActions
                        id={r.id}
                        status={r.approvalStatus as "APPROVED" | "SUSPENDED" | "DRAFT"}
                        featured={r.featuredInHome}
                        labels={actionLabels}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
