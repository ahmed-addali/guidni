import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAdminTransfers, getAdminRentals, adminUpdateTransferStatus, adminToggleTransferFeatured, adminUpdateRentalStatus, adminToggleRentalFeatured } from "@/lib/actions/admin-transport";
import { TransportStatusActions } from "./_components/TransportStatusActions";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin.transport" });
  return { title: t("pageTitle") };
}

export default async function AdminTransportPage({ params }: { params: Params }) {
  const { locale } = await params;

  const [transfers, rentals, t] = await Promise.all([
    getAdminTransfers(),
    getAdminRentals(),
    getTranslations({ locale, namespace: "Admin.transport" }),
  ]);

  const activeTransfers = transfers.filter((x) => x.status === "ACTIVE").length;
  const draftTransfers  = transfers.filter((x) => x.status === "DRAFT").length;
  const activeRentals   = rentals.filter((x) => x.status === "ACTIVE").length;
  const draftRentals    = rentals.filter((x) => x.status === "DRAFT").length;

  const labels = {
    approveLabel:       t("actionApprove"),
    suspendLabel:       t("actionSuspend"),
    featureLabel:       t("actionFeature"),
    unfeatureLabel:     t("actionUnfeature"),
    activeLabel:        t("statusActive"),
    suspendedLabel:     t("statusSuspended"),
    draftLabel:         t("statusDraft"),
    toastApproved:      t("toastApproved"),
    toastSuspended:     t("toastSuspended"),
    toastDraft:         t("toastDraft"),
    toastStatusFailed:  t("toastStatusFailed"),
    toastFeatureFailed: t("toastFeatureFailed"),
  };

  const TRANSFER_TYPE_LABEL: Record<string, string> = {
    AIRPORT_TRANSFER: "Airport",
    SHUTTLE:          "Shuttle",
    CHAUFFEUR:        "Chauffeur",
    TAXI:             "Taxi",
  };
  const RENTAL_TYPE_LABEL: Record<string, string> = {
    CAR:       "Car",
    MOTORBIKE: "Motorbike",
    SCOOTER:   "Scooter",
    BICYCLE:   "Bicycle",
    BOAT:      "Boat",
    QUAD:      "Quad",
    BUGGY:     "Buggy",
    JET_SKI:   "Jet Ski",
    OTHER:     "Other",
  };

  return (
    <div className="space-y-6 max-w-screen-xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("pageTitle")}</h1>
      </div>

      <Tabs defaultValue="transfers">
        <TabsList className="bg-gray-100 mb-4">
          <TabsTrigger value="transfers">
            {t("tabTransfers")} ({transfers.length})
          </TabsTrigger>
          <TabsTrigger value="rentals">
            {t("tabRentals")} ({rentals.length})
          </TabsTrigger>
        </TabsList>

        {/* ── Transfers ─────────────────────────────────────────────── */}
        <TabsContent value="transfers">
          <p className="text-sm text-gray-400 mb-3">
            {t("summaryTransfers", { total: transfers.length, active: activeTransfers, draft: draftTransfers })}
          </p>
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            {transfers.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">{t("noTransfers")}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                      <th className="text-left px-6 py-3 font-medium">{t("colTitle")}</th>
                      <th className="text-left px-6 py-3 font-medium">{t("colType")}</th>
                      <th className="text-left px-6 py-3 font-medium">{t("colDestination")}</th>
                      <th className="text-left px-6 py-3 font-medium">{t("colPartner")}</th>
                      <th className="text-right px-6 py-3 font-medium">{t("colBookings")}</th>
                      <th className="text-center px-6 py-3 font-medium">{t("colStatus")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transfers.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3.5">
                          <Link
                            href={`/${locale}/transport/transfers/${item.slug}`}
                            target="_blank"
                            className="font-medium text-gray-800 hover:text-primary transition-colors"
                          >
                            {item.title}
                          </Link>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            {TRANSFER_TYPE_LABEL[item.type] ?? item.type}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-gray-600 text-xs">
                          {item.destination?.city ?? "—"}
                        </td>
                        <td className="px-6 py-3.5 text-gray-500 text-xs">
                          <div className="flex items-center gap-1">
                            {item.businessProfile.name}
                            {item.businessProfile.isVerified && (
                              <span className="text-green-600" title="Verified">✓</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-right text-gray-600">
                          {item._count.reservations}
                        </td>
                        <td className="px-6 py-3.5">
                          <TransportStatusActions
                            id={item.id}
                            status={item.status as "DRAFT" | "ACTIVE" | "SUSPENDED"}
                            featured={item.featuredInHome}
                            labels={labels}
                            onStatus={adminUpdateTransferStatus}
                            onFeature={adminToggleTransferFeatured}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Rentals ───────────────────────────────────────────────── */}
        <TabsContent value="rentals">
          <p className="text-sm text-gray-400 mb-3">
            {t("summaryRentals", { total: rentals.length, active: activeRentals, draft: draftRentals })}
          </p>
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            {rentals.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">{t("noRentals")}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                      <th className="text-left px-6 py-3 font-medium">{t("colTitle")}</th>
                      <th className="text-left px-6 py-3 font-medium">{t("colType")}</th>
                      <th className="text-left px-6 py-3 font-medium">{t("colDestination")}</th>
                      <th className="text-left px-6 py-3 font-medium">{t("colPartner")}</th>
                      <th className="text-right px-6 py-3 font-medium">{t("colBookings")}</th>
                      <th className="text-center px-6 py-3 font-medium">{t("colStatus")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rentals.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3.5">
                          <Link
                            href={`/${locale}/transport/rentals/${item.slug}`}
                            target="_blank"
                            className="font-medium text-gray-800 hover:text-primary transition-colors"
                          >
                            {item.title}
                          </Link>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                            {RENTAL_TYPE_LABEL[item.type] ?? item.type}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-gray-600 text-xs">
                          {item.destination?.city ?? "—"}
                        </td>
                        <td className="px-6 py-3.5 text-gray-500 text-xs">
                          <div className="flex items-center gap-1">
                            {item.businessProfile.name}
                            {item.businessProfile.isVerified && (
                              <span className="text-green-600" title="Verified">✓</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-right text-gray-600">
                          {item._count.reservations}
                        </td>
                        <td className="px-6 py-3.5">
                          <TransportStatusActions
                            id={item.id}
                            status={item.status as "DRAFT" | "ACTIVE" | "SUSPENDED"}
                            featured={item.featuredInHome}
                            labels={labels}
                            onStatus={adminUpdateRentalStatus}
                            onFeature={adminToggleRentalFeatured}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
