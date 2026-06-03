import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getDestinationSlug } from "@/lib/actions/destination-cookie";
import { getDestinations } from "@/lib/actions/destinations";
import { getGuides, getGuidePlans } from "@/lib/actions/guides";
import { GuideCard } from "@/components/planner/GuideCard";
import { GuidePlanCard } from "@/components/planner/GuidePlanCard";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles, Clock, Sliders, MapPin, Star,
  ArrowRight, BookOpen, CheckCircle2,
} from "lucide-react";
import { FaRobot, FaCompass } from "react-icons/fa6";

export const metadata: Metadata = {
  title: "Trip Planner — Guidni",
  description: "Get a personalized day-by-day itinerary — built by AI or by local experts.",
};

type Props = { params: Promise<{ locale: string }> };

export default async function PlannerLandingPage({ params }: Props) {
  const { locale } = await params;

  const [t, destinations, destinationSlug, session] = await Promise.all([
    getTranslations({ locale, namespace: "PlannerLanding" }),
    getDestinations(),
    getDestinationSlug(),
    auth.api.getSession({ headers: await headers() }),
  ]);

  const currentDest = destinations.find((d) => d.slug === destinationSlug) ?? destinations[0];
  const city = currentDest?.city ?? t("defaultCity");

  const [featuredGuides, popularPlans] = await Promise.all([
    getGuides({ destinationId: currentDest?.id, isFeatured: true }),
    getGuidePlans({ destinationId: currentDest?.id, sort: "popular" }),
  ]);

  const guidesToShow  = featuredGuides.slice(0, 3);
  const plansToShow   = popularPlans.slice(0, 4);

  return (
    <div className="pb-20">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="pt-16 pb-12 text-center px-4">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight tracking-tight mb-4">
          {t("heroPrefix")}{" "}
          <span className="text-blue-600">{city}</span>{" "}
          {t("heroSuffix")}
        </h1>
        <p className="text-base sm:text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
          {t("heroSubtitle")}
        </p>
      </section>

      <div className="max-w-screen-xl mx-auto px-4 md:px-20">

        {/* ── Mode cards ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

          {/* AI Planner */}
          <Link
            href={`/${locale}/planner/ai`}
            className="group relative flex flex-col rounded-2xl border border-gray-100 bg-white p-7 hover:border-primary/30 hover:shadow-lg transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                <FaRobot className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="text-lg font-bold text-gray-900">{t("aiTitle")}</h2>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    {t("aiPopular")}
                  </span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{t("aiSubtitle")}</p>
              </div>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 mb-6 flex-1">
              {([
                { icon: <Clock className="h-3.5 w-3.5" />,   text: t("aiFeature1") },
                { icon: <Sliders className="h-3.5 w-3.5" />, text: t("aiFeature2") },
                { icon: <MapPin className="h-3.5 w-3.5" />,  text: t("aiFeature3") },
                { icon: <Star className="h-3.5 w-3.5" />,    text: t("aiFeature4") },
              ] as const).map(({ icon, text }) => (
                <li key={text} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-primary shrink-0">{icon}</span>
                  {text}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all duration-200 mt-auto">
              {t("aiCta")}
              <ArrowRight className="h-4 w-4" />
            </div>
          </Link>

          {/* Local Guides */}
          <Link
            href={`/${locale}/planner/guides`}
            className="group relative flex flex-col rounded-2xl border border-gray-100 bg-white p-7 hover:border-blue-300/50 hover:shadow-lg transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                <FaCompass className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-0.5">{t("guidesTitle")}</h2>
                <p className="text-sm text-gray-500 leading-relaxed">{t("guidesSubtitle")}</p>
              </div>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 mb-6 flex-1">
              {([
                t("guidesFeature1"),
                t("guidesFeature2"),
                t("guidesFeature3"),
                t("guidesFeature4"),
              ] as const).map((text) => (
                <li key={text} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 group-hover:gap-3 transition-all duration-200 mt-auto">
              {t("guidesCta")}
              <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        </div>

        {/* Browse Plans + My Plans — tertiary row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          <Link
            href={`/${locale}/planner/plans`}
            className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white px-6 py-4 hover:border-gray-200 hover:shadow-sm transition-all duration-300"
          >
            <div className="w-9 h-9 rounded-xl bg-gray-100 group-hover:bg-primary/8 flex items-center justify-center shrink-0 transition-colors">
              <BookOpen className="h-4 w-4 text-gray-500 group-hover:text-primary transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">{t("plansMarketplaceTitle")}</p>
              <p className="text-xs text-gray-400 truncate">{t("plansMarketplaceSubtitle")}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 shrink-0 group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            href={session?.user ? `/${locale}/my-plans` : `/${locale}/login`}
            className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white px-6 py-4 hover:border-gray-200 hover:shadow-sm transition-all duration-300"
          >
            <div className="w-9 h-9 rounded-xl bg-gray-100 group-hover:bg-primary/8 flex items-center justify-center shrink-0 transition-colors">
              <FaRobot className="h-4 w-4 text-gray-500 group-hover:text-primary transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">{t("myPlansSectionTitle")}</p>
              <p className="text-xs text-gray-400 truncate">
                {session?.user ? t("myPlansSectionSubtitle") : t("myPlansSignInSubtitle")}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 shrink-0 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>

        {/* ── Featured Guides ───────────────────────────────────────── */}
        {guidesToShow.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {t("featuredGuidesHeading")}{" "}
                <span className="text-blue-600">{city}</span>
              </h2>
              <Link
                href={`/${locale}/planner/guides`}
                className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
              >
                {t("seeAllGuides")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
              {guidesToShow.map((guide) => (
                <GuideCard
                  key={guide.id}
                  slug={guide.slug}
                  displayName={guide.displayName}
                  tagline={guide.tagline}
                  avatarUrl={guide.avatarUrl}
                  coverUrl={guide.coverUrl}
                  specializations={guide.specializations}
                  languages={guide.languages}
                  note={guide.note}
                  nbReviews={guide.nbReviews}
                  planCount={guide.planCount}
                  isVerified={guide.isVerified}
                  destination={guide.destination}
                  locale={locale}
                />
              ))}
            </div>

            <Separator className="mb-12" />
          </>
        )}

        {/* ── Popular Plans ─────────────────────────────────────────── */}
        {plansToShow.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {t("popularPlansHeading")}{" "}
                <span className="text-blue-600">{city}</span>
              </h2>
              <Link
                href={`/${locale}/planner/plans`}
                className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
              >
                {t("seeAllPlans")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
              {plansToShow.map((plan) => (
                <GuidePlanCard
                  key={plan.id}
                  plan={plan}
                  locale={locale}
                />
              ))}
            </div>

            <Separator className="mb-12" />
          </>
        )}

        {/* ── Become a guide CTA ───────────────────────────────────── */}
        <div className="bg-primary/5 border border-primary/10 rounded-2xl px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6 mb-12">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{t("becomeGuideTitle")}</h3>
            <p className="text-sm text-gray-500 max-w-md leading-relaxed">
              {t("becomeGuideSubtitle", { city })}
            </p>
          </div>
          <Link
            href={`/${locale}/become-partner`}
            className="shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          >
            <FaCompass className="h-4 w-4" />
            {t("becomeGuideCta")}
          </Link>
        </div>


      </div>
    </div>
  );
}
