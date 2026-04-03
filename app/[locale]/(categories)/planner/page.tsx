import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getDestinationSlug } from "@/lib/actions/destination-cookie";
import { getDestinations } from "@/lib/actions/destinations";
import {
  Sparkles,
  MapPin,
  Clock,
  Sliders,
  Star,
  Users,
  MessageCircle,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { FaRobot, FaCompass } from "react-icons/fa6";

export const metadata: Metadata = {
  title: "Trip Planner — Guidni",
  description: "Get a personalized day-by-day itinerary — built by AI or by local experts.",
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function PlannerLandingPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PlannerLanding" });

  const [destinations, destinationSlug] = await Promise.all([
    getDestinations(),
    getDestinationSlug(),
  ]);

  const currentDest =
    destinations.find((d) => d.slug === destinationSlug) ?? destinations[0];
  const city = currentDest?.city ?? t("defaultCity");

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-14">

      {/* ── Hero ── */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-xs font-semibold text-primary mb-5">
          <Sparkles className="h-3.5 w-3.5" />
          {t("badge")}
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight tracking-tight">
          {t("heroPrefix")}{" "}
          <span className="text-blue-600">{city}</span>{" "}
          {t("heroSuffix")}
        </h1>
        <p className="mt-4 text-base text-gray-500 max-w-xl mx-auto leading-relaxed">
          {t("heroSubtitle")}
        </p>
      </div>

      {/* ── Two-column choice ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* AI Planner card */}
        <Link
          href={`/${locale}/planner/ai`}
          className="group relative flex flex-col rounded-3xl border-2 border-gray-100 bg-white p-8 hover:border-primary/40 hover:shadow-xl transition-all duration-300 overflow-hidden"
        >
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-6 shrink-0 group-hover:scale-105 transition-transform duration-300">
            <FaRobot className="h-7 w-7 text-white" />
          </div>

          {/* Copy */}
          <div className="mb-6 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-bold text-gray-900">{t("aiTitle")}</h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {t("aiPopular")}
              </span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">{t("aiSubtitle")}</p>
          </div>

          {/* Feature list */}
          <ul className="space-y-2.5 mb-8">
            {([
              { icon: <Clock className="h-4 w-4" />,   text: t("aiFeature1") },
              { icon: <Sliders className="h-4 w-4" />, text: t("aiFeature2") },
              { icon: <MapPin className="h-4 w-4" />,  text: t("aiFeature3") },
              { icon: <Star className="h-4 w-4" />,    text: t("aiFeature4") },
            ] as const).map(({ icon, text }) => (
              <li key={text} className="flex items-center gap-2.5 text-sm text-gray-600">
                <span className="text-primary shrink-0">{icon}</span>
                {text}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all duration-200">
            {t("aiCta")}
            <ArrowRight className="h-4 w-4" />
          </div>
        </Link>

        {/* Local Guides card */}
        <Link
          href={`/${locale}/planner/guides`}
          className="group relative flex flex-col rounded-3xl border-2 border-gray-100 bg-white p-8 hover:border-blue-400/40 hover:shadow-xl transition-all duration-300 overflow-hidden"
        >
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mb-6 shrink-0 group-hover:scale-105 transition-transform duration-300">
            <FaCompass className="h-7 w-7 text-white" />
          </div>

          {/* Copy */}
          <div className="mb-6 flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t("guidesTitle")}</h2>
            <p className="text-sm text-gray-500 leading-relaxed">{t("guidesSubtitle")}</p>
          </div>

          {/* Feature list */}
          <ul className="space-y-2.5 mb-8">
            {([
              { icon: <Users className="h-4 w-4" />,         text: t("guidesFeature1") },
              { icon: <CheckCircle2 className="h-4 w-4" />,  text: t("guidesFeature2") },
              { icon: <MessageCircle className="h-4 w-4" />, text: t("guidesFeature3") },
              { icon: <Star className="h-4 w-4" />,          text: t("guidesFeature4") },
            ] as const).map(({ icon, text }) => (
              <li key={text} className="flex items-center gap-2.5 text-sm text-gray-600">
                <span className="text-blue-600 shrink-0">{icon}</span>
                {text}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 group-hover:gap-3 transition-all duration-200">
            {t("guidesCta")}
            <ArrowRight className="h-4 w-4" />
          </div>
        </Link>

      </div>

      {/* ── Bottom trust note ── */}
      <p className="text-center text-xs text-gray-400 mt-10">
        {t("trustNote")}
      </p>

    </div>
  );
}
