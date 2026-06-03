"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";

export default function StayNotFound() {
  const t      = useTranslations("StayPage.notFound");
  const locale = useLocale();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-4">
      <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
      <p className="text-muted-foreground max-w-sm">{t("description")}</p>
      <Link
        href={`/${locale}/stays`}
        className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
      >
        {t("browseAll")}
      </Link>
    </div>
  );
}
