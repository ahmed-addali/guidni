import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getLocale } from "next-intl/server";
import { UtensilsCrossed } from "lucide-react";

export default async function RestaurantNotFound() {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("RestaurantPage.notFound"),
  ]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-6">
        <UtensilsCrossed className="w-8 h-8 text-gray-400" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("title")}</h1>
      <p className="text-muted-foreground mb-8 max-w-sm">{t("description")}</p>
      <Link
        href={`/${locale}/restaurants`}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
      >
        {t("cta")}
      </Link>
    </div>
  );
}
