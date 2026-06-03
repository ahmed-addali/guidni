import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FaCompass } from "react-icons/fa6";
import { getLocale } from "next-intl/server";

export default async function GuideNotFound() {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("GuideProfile"),
  ]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <FaCompass className="h-12 w-12 text-gray-200 mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("notFoundTitle")}</h1>
      <p className="text-gray-400 text-sm mb-6 max-w-sm">{t("notFoundDesc")}</p>
      <Link
        href={`/${locale}/planner/guides`}
        className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        {t("notFoundCta")}
      </Link>
    </div>
  );
}
