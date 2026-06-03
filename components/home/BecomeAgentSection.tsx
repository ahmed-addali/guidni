import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { MapPin, TrendingUp, Award, ArrowRight } from "lucide-react";

interface Props {
  locale: string;
}

export async function BecomeAgentSection({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: "HomePage.agent" });

  const PERKS = [
    { icon: TrendingUp, text: t("perk1") },
    { icon: Award,      text: t("perk2") },
    { icon: MapPin,     text: t("perk3") },
  ];

  const STATS = [
    { value: t("stat1Value"), label: t("stat1Label") },
    { value: t("stat2Value"), label: t("stat2Label") },
    { value: t("stat3Value"), label: t("stat3Label") },
    { value: t("stat4Value"), label: t("stat4Label") },
  ];

  return (
    <section className="py-12 w-full">
      <div className="bg-gradient-to-br from-primary/4 via-white to-blue-50 border border-primary/10 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">

          {/* Left — copy */}
          <div className="p-8 sm:p-10 space-y-6">
            <div>
              <span className="text-xs font-semibold text-primary uppercase tracking-widest">
                {t("eyebrow")}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2 leading-tight">
                {t("headline")}{" "}
                <span className="text-blue-600">{t("headlineAccent")}</span>
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed mt-3">{t("subtitle")}</p>
            </div>

            <ul className="space-y-3">
              {PERKS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <span className="mt-0.5 w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </span>
                  <p className="text-sm text-gray-700">{text}</p>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href={`/${locale}/become-agent`}
                className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                {t("cta")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/${locale}/agents/leaderboard`}
                className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                {t("leaderboard")}
              </Link>
            </div>
          </div>

          {/* Right — stat tiles */}
          <div className="border-t lg:border-t-0 lg:border-l border-primary/8 p-8 sm:p-10 flex items-center">
            <div className="grid grid-cols-2 gap-3 w-full">
              {STATS.map(({ value, label }) => (
                <div key={label} className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
                  <p className="text-xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
