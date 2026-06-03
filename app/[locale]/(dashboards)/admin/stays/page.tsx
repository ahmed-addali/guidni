import { getTranslations } from "next-intl/server";
import { getAdminStays } from "@/lib/actions/admin";
import { StayStatusActions } from "./_components/StayStatusActions";
import { CURRENCY } from "@/lib/constants/payments";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin.stays" });
  return { title: t("metaTitle") };
}

export default async function AdminStaysPage({ params }: { params: Params }) {
  const { locale } = await params;

  const [stays, t] = await Promise.all([
    getAdminStays(),
    getTranslations({ locale, namespace: "Admin.stays" }),
  ]);

  const counts = stays.reduce(
    (acc, s) => {
      const key = s.approvalStatus as keyof typeof acc;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    { APPROVED: 0, DRAFT: 0, SUSPENDED: 0 } as Record<string, number>
  );

  const actionLabels = {
    approveLabel:    t("actionApprove"),
    suspendLabel:    t("actionSuspend"),
    featureLabel:    t("actionFeature"),
    unfeatureLabel:  t("actionUnfeature"),
    approvedLabel:   t("statusApproved"),
    suspendedLabel:  t("statusSuspended"),
    draftLabel:      t("statusDraft"),
    toastApproved:   t("toastApproved"),
    toastSuspended:  t("toastSuspended"),
    toastDraft:      t("toastDraft"),
    toastStatusFailed:  t("toastStatusFailed"),
    toastFeatureFailed: t("toastFeatureFailed"),
  };

  return (
    <div className="space-y-6 max-w-screen-xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("heading")}</h1>
        <p className="text-sm text-gray-400 mt-1">
          {t("summary", {
            total:     stays.length,
            approved:  counts.APPROVED,
            draft:     counts.DRAFT,
            suspended: counts.SUSPENDED,
          })}
        </p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {stays.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">{t("empty")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                  <th className="text-left px-6 py-3 font-medium">{t("colTitle")}</th>
                  <th className="text-left px-6 py-3 font-medium">{t("colType")}</th>
                  <th className="text-left px-6 py-3 font-medium">{t("colDestination")}</th>
                  <th className="text-left px-6 py-3 font-medium">{t("colPartner")}</th>
                  <th className="text-right px-6 py-3 font-medium">{t("colPrice")}</th>
                  <th className="text-left px-6 py-3 font-medium">{t("colActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stays.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-gray-800 max-w-[220px]">
                      <span className="block truncate">{s.title}</span>
                      <span className="text-xs text-gray-400 font-normal">{s.slug}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        {s.propertyType}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-gray-600">
                      {s.destination?.city ?? "—"}
                    </td>
                    <td className="px-6 py-3.5 text-gray-500 text-xs">
                      {s.businessProfile.name}
                    </td>
                    <td className="px-6 py-3.5 text-right font-medium text-gray-700">
                      {s.price} {CURRENCY}
                    </td>
                    <td className="px-6 py-3.5">
                      <StayStatusActions
                        id={s.id}
                        status={s.approvalStatus as "APPROVED" | "SUSPENDED" | "DRAFT"}
                        featured={s.featuredInHome}
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
