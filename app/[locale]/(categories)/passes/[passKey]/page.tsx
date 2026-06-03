import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FiCheckCircle, FiStar, FiTag, FiUsers } from "react-icons/fi";
import { ChevronLeft } from "lucide-react";
import { getPassByKey } from "@/lib/actions/passes";
import { PassBookingWidget } from "./_components/PassBookingWidget";

type Params = Promise<{ locale: string; passKey: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { passKey } = await params;
  const pass = await getPassByKey(passKey);
  return { title: pass?.name ?? "Pass" };
}

export default async function PassDetailPage({ params }: { params: Params }) {
  const { locale, passKey } = await params;
  const [pass, t] = await Promise.all([
    getPassByKey(passKey),
    getTranslations({ locale, namespace: "PassDetail" }),
  ]);

  if (!pass) notFound();

  const discountedPrice =
    pass.discount > 0 ? Math.round(pass.price * (1 - pass.discount / 100)) : null;

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8">
      {/* Back */}
      <Link
        href={`/${locale}/passes`}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("backToPasses")}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* ── Left: Pass info ───────────────────────────────── */}
        <div className="lg:col-span-2 space-y-8">
          {/* Title row */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {pass.popular && (
                <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-100 rounded-full px-2.5 py-0.5">
                  <FiStar className="h-3 w-3" />
                  {t("popular")}
                </span>
              )}
              {pass.discount > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-100 rounded-full px-2.5 py-0.5">
                  <FiTag className="h-3 w-3" />
                  -{pass.discount}% {t("off")}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{pass.name}</h1>
            {pass.arabicName && (
              <p className="text-lg text-gray-500" dir="rtl">{pass.arabicName}</p>
            )}
            {pass.description && (
              <p className="text-gray-600 leading-relaxed">{pass.description}</p>
            )}
          </div>

          {/* Fixed activities */}
          {pass.fixedActivities.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
              <h2 className="font-semibold text-gray-900 text-lg">{t("includedActivities")}</h2>
              <div className="space-y-3">
                {pass.fixedActivities.map((act) => (
                  <div key={act.id} className="flex items-center gap-3">
                    {act.images[0]?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={act.images[0].url}
                        alt={act.title}
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm truncate">{act.title}</p>
                      {act.city && <p className="text-xs text-gray-400">{act.city}</p>}
                    </div>
                    <FiCheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optional activities */}
          {pass.optionalActivities.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
              <div>
                <h2 className="font-semibold text-gray-900 text-lg">{t("optionalActivities")}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {t("chooseUpTo", { count: pass.optionalCount })}
                </p>
              </div>
              <div className="space-y-3">
                {pass.optionalActivities.map((act) => (
                  <div key={act.id} className="flex items-center gap-3">
                    {act.images[0]?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={act.images[0].url}
                        alt={act.title}
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm truncate">{act.title}</p>
                      {act.city && <p className="text-xs text-gray-400">{act.city}</p>}
                    </div>
                    <FiUsers className="h-4 w-4 text-blue-400 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Booking widget ─────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <PassBookingWidget
              pass={{
                id:                   pass.id,
                passKey:              pass.passKey,
                price:                pass.price,
                discount:             pass.discount,
                optionalCount:        pass.optionalCount,
                optionalActivities:   pass.optionalActivities.map((a) => ({
                  id: a.id,
                  title: a.title,
                })),
              }}
              locale={locale}
              labels={{
                price:          discountedPrice !== null ? `${discountedPrice} TND` : `${pass.price} TND`,
                originalPrice:  pass.discount > 0 ? `${pass.price} TND` : null,
                perPerson:      t("perPerson"),
                date:           t("date"),
                participants:   t("participants"),
                notes:          t("notes"),
                book:           t("book"),
                booking:        t("booking"),
                chooseOptional: t("chooseOptional"),
                upTo:           t("upTo", { count: pass.optionalCount }),
                loginRequired:  t("loginRequired"),
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
