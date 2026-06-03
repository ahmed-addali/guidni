import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Sparkles, MapPin } from "lucide-react";

interface Props {
  locale: string;
}

export async function HeroSection({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: "HomePage.hero" });

  return (
    <section className="pt-14 pb-8 mx-auto text-center flex flex-col items-center max-w-3xl">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl leading-[1.1]">
        {t("headline")}{" "}
        <span className="text-blue-600">{t("brand")}</span>
      </h1>
      <p className="mt-5 text-lg text-gray-500 max-w-xl leading-relaxed">
        {t("subtitle")}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
        <Link
          href={`/${locale}/planner`}
          className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          {t("ctaPlanner")}
        </Link>
        <Link
          href={`/${locale}/destinations`}
          className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 bg-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
        >
          <MapPin className="h-4 w-4 text-gray-400" />
          {t("ctaExplore")}
        </Link>
      </div>
    </section>
  );
}
