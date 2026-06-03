import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FiStar, FiTag } from "react-icons/fi";
import { getPassesByDestination } from "@/lib/actions/passes";
import { getDestinationSlug } from "@/lib/actions/destination-cookie";
import { CategoryPageHero } from "@/components/shared/CategoryPageHero";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PassesPage" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function PassesPage({ params }: { params: Params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PassesPage" });

  const destination = await getDestinationSlug();
  const passes = await getPassesByDestination(destination ?? undefined);

  const destinationCity = passes[0]?.destination?.city ?? null;

  return (
    <div className="pb-8 space-y-8">
      <CategoryPageHero
        title={t("titlePrefix")}
        accent={destinationCity ?? t("titleFallback")}
        subtitle={t("subtitle")}
      />

      {/* Pass grid */}
      {passes.length === 0 ? (
        <div className="text-center py-24 text-gray-400">{t("empty")}</div>
      ) : (
        <div className="max-w-screen-xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {passes.map((pass) => {
            const discountedPrice =
              pass.discount > 0
                ? Math.round(pass.price * (1 - pass.discount / 100))
                : null;

            return (
              <Link
                key={pass.id}
                href={`/${locale}/passes/${pass.passKey}`}
                className="group bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-shadow flex flex-col gap-4"
              >
                {/* Badge row */}
                <div className="flex items-center justify-between">
                  {pass.popular && (
                    <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-100 rounded-full px-2.5 py-0.5">
                      <FiStar className="h-3 w-3" />
                      {t("popular")}
                    </span>
                  )}
                  {pass.discount > 0 && (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-100 rounded-full px-2.5 py-0.5 ml-auto">
                      <FiTag className="h-3 w-3" />
                      -{pass.discount}%
                    </span>
                  )}
                </div>

                {/* Title */}
                <div>
                  <h2 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">
                    {pass.name}
                  </h2>
                  {pass.description && (
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{pass.description}</p>
                  )}
                </div>

                {/* Activities summary */}
                <div className="text-sm text-gray-600 space-y-2">
                  <p>
                    <span className="font-medium">{pass.fixedActivities.length}</span>{" "}
                    {t("fixedActivities")}
                    {pass.optionalActivities.length > 0 && (
                      <>
                        {" · "}
                        <span className="font-medium">{pass.optionalCount}</span>{" "}
                        {t("choiceFrom")}{" "}
                        <span className="font-medium">{pass.optionalActivities.length}</span>{" "}
                        {t("optionalActivities")}
                      </>
                    )}
                  </p>
                  {/* Activity name previews */}
                  {pass.fixedActivities.length > 0 && (
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {pass.fixedActivities
                        .slice(0, 3)
                        .map((a) => a.title)
                        .join(" · ")}
                      {pass.fixedActivities.length > 3 && (
                        <span> +{pass.fixedActivities.length - 3} {t("more")}</span>
                      )}
                    </p>
                  )}
                </div>

                {/* Price */}
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-end justify-between">
                  <div>
                    {discountedPrice !== null ? (
                      <>
                        <span className="text-xl font-bold text-gray-900">
                          {discountedPrice} TND
                        </span>
                        <span className="ml-2 text-sm text-gray-400 line-through">
                          {pass.price} TND
                        </span>
                      </>
                    ) : (
                      <span className="text-xl font-bold text-gray-900">{pass.price} TND</span>
                    )}
                    <p className="text-xs text-gray-400">{t("perPerson")}</p>
                  </div>
                  <span className="text-sm font-semibold bg-primary text-white rounded-xl px-4 py-1.5 group-hover:bg-primary/90 transition-colors">
                    {t("bookNow")}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
