import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "TermsPage" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "TermsPage" });

  const sections = t.raw("sections") as Array<{ title: string; body: string }>;

  return (
    <div className="max-w-screen-md mx-auto px-4 py-12">

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{t("title")}</h1>
        <p className="text-gray-500">{t("subtitle")}</p>
        <p className="text-xs text-gray-400 mt-2">{t("lastUpdated")}</p>
      </div>

      {/* Sections */}
      <div className="space-y-4 mb-12">
        {sections.map((section, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6">
            <h2 className="font-semibold text-gray-900 mb-3">{section.title}</h2>
            <p className="text-sm text-gray-500 leading-relaxed">{section.body}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center">
        <p className="font-semibold text-gray-900 mb-1">{t("questions.title")}</p>
        <p className="text-sm text-gray-500 mb-4">{t("questions.body")}</p>
        <Link
          href={`/${locale}/contact`}
          className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          {t("questions.button")} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

    </div>
  );
}
