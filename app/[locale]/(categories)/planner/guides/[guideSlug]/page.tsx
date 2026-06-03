import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/lib/auth";
import { getGuideBySlug, getRelatedGuides } from "@/lib/actions/guides";
import { getReviews, hasReviewed, hasCompletedBooking } from "@/lib/actions/reviews";
import { ReviewsSection } from "@/components/activities/ReviewsSection";
import { RatingSummary } from "@/components/shared/RatingSummary";
import { DescriptionWithToggle } from "@/components/shared/DescriptionWithToggle";
import { ShareButton } from "@/app/[locale]/(categories)/stays/[staySlug]/_components/ShareButton";
import { GuideAnchorNav } from "./_components/GuideAnchorNav";
import { GuideMobileCTA } from "./_components/GuideMobileCTA";
import {
  FiStar, FiMapPin, FiGlobe, FiInstagram, FiBookOpen,
  FiEye, FiAward,
} from "react-icons/fi";
import { FaCircleCheck, FaFacebook, FaTiktok, FaCompass } from "react-icons/fa6";
import { RelationType } from "@prisma/client";

/* ── Spec labels ─────────────────────────────────────────────────────────── */

const SPEC_LABELS: Record<string, string> = {
  culture:         "Culture & History",
  food_drink:      "Food & Drink",
  adventures:      "Adventures",
  water_sports:    "Water Sports",
  nature_wildlife: "Nature",
  sightseeing:     "Sightseeing",
  shopping:        "Shopping",
  wellness:        "Wellness",
  family_friendly: "Family-friendly",
  workshops:       "Workshops",
};

/* ── Types ───────────────────────────────────────────────────────────────── */

type Props = { params: Promise<{ locale: string; guideSlug: string }> };

/* ── Metadata ────────────────────────────────────────────────────────────── */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { guideSlug, locale } = await params;
  const guide = await getGuideBySlug(guideSlug);
  if (!guide) return { title: "Guide not found" };
  const t = await getTranslations({ locale, namespace: "GuideProfile" });
  return {
    title: `${guide.displayName} — ${t("guideInfoHeading")} · Guidni`,
    description: guide.tagline ?? guide.bio.slice(0, 160),
    openGraph: {
      ...(guide.coverUrl ? { images: [{ url: guide.coverUrl, width: 1200, height: 630 }] } : {}),
    },
  };
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default async function GuideProfilePage({ params }: Props) {
  const { locale, guideSlug } = await params;

  const [guide, session, t] = await Promise.all([
    getGuideBySlug(guideSlug),
    auth.api.getSession({ headers: await headers() }),
    getTranslations({ locale, namespace: "GuideProfile" }),
  ]);
  if (!guide) notFound();

  const [reviews, alreadyReviewed, canLeaveReview, relatedGuides] = await Promise.all([
    getReviews(guide.id, RelationType.GUIDE),
    session?.user ? hasReviewed(guide.id, "GUIDE")           : Promise.resolve(false),
    session?.user ? hasCompletedBooking(guide.id, "GUIDE")   : Promise.resolve(false),
    guide.destination?.id
      ? getRelatedGuides(guide.destination.id, guide.id)
      : Promise.resolve([]),
  ]);

  const avgRating     = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;
  const reviewCount   = reviews.length;
  const firstName     = guide.displayName.split(" ")[0];
  const requestHref   = `/${locale}/planner/guides/${guide.slug}/request`;

  const PLAN_TYPE_LABELS: Record<string, string> = {
    GUIDE_FREE: t("planTypeFree"),
    GUIDE_PAID: t("planTypePaid"),
  };

  return (
    <>
    <div className="max-w-screen-xl mx-auto px-4 md:px-20 py-8 pb-24 lg:pb-10">

      {/* ── Breadcrumb ──────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-5 flex-wrap">
        <Link href={`/${locale}/planner`} className="hover:text-gray-700 transition-colors">
          {t("breadcrumbPlanner")}
        </Link>
        <span>/</span>
        <Link href={`/${locale}/planner/guides`} className="hover:text-gray-700 transition-colors">
          {t("breadcrumbGuides")}
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium truncate max-w-xs">{guide.displayName}</span>
      </nav>

      {/* ── Name + meta + actions ───────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap mb-1">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
              {guide.displayName}
            </h1>
            {guide.isVerified && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 shrink-0">
                <FaCircleCheck className="h-3 w-3" /> {t("verified")}
              </span>
            )}
          </div>
          {guide.tagline && (
            <p className="text-gray-500 text-base mt-1 leading-relaxed">{guide.tagline}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 mt-2.5 text-sm text-gray-500">
            {guide.destination && (
              <span className="flex items-center gap-1">
                <FiMapPin className="h-3.5 w-3.5 shrink-0" />
                {guide.destination.city}
                {guide.destination.country ? `, ${guide.destination.country}` : ""}
              </span>
            )}
            {avgRating !== null && (
              <a href="#reviews" className="flex items-center gap-1 hover:opacity-75 transition-opacity">
                <FiStar className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                <span className="font-semibold text-gray-800">{avgRating.toFixed(1)}</span>
                <span className="text-gray-400 underline underline-offset-2">
                  {t("reviewCount", { count: reviewCount })}
                </span>
              </a>
            )}
            <span className="flex items-center gap-1">
              <FiBookOpen className="h-3.5 w-3.5" />
              {t("planCountLabel", { count: guide.planCount })}
            </span>
            {guide.experienceYears && guide.experienceYears > 0 && (
              <span className="flex items-center gap-1">
                <FiAward className="h-3.5 w-3.5" />
                {t("experienceYears", { years: guide.experienceYears })}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <ShareButton
            title={guide.displayName}
            shareLabel={t("share")}
            copiedLabel={t("shareCopied")}
            className="h-9 w-9 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors"
          />
        </div>
      </div>

      {/* ── Cover ───────────────────────────────────────────────── */}
      <div className="relative w-full h-52 sm:h-72 rounded-2xl overflow-hidden bg-slate-100">
        {guide.coverUrl ? (
          <Image
            src={guide.coverUrl}
            alt={guide.displayName}
            fill
            className="object-cover"
            sizes="(max-width: 1280px) 100vw, 1280px"
            priority
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-slate-100" />
            <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="gp-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.5" fill="#1e3a8a" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#gp-dots)" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <FaCompass className="h-16 w-16 text-slate-300" />
            </div>
          </>
        )}
      </div>

      {/* Avatar — outside cover div so overflow-hidden doesn't clip it */}
      <div className="-mt-10 pl-6 relative z-10 mb-4">
        <div className="h-20 w-20 rounded-full ring-4 ring-white shadow-md bg-white overflow-hidden">
          {guide.avatarUrl ? (
            <Image
              src={guide.avatarUrl}
              alt={guide.displayName}
              width={80}
              height={80}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full bg-primary/5 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary select-none">
                {guide.displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Anchor nav ──────────────────────────────────────────── */}
      <GuideAnchorNav
        labels={{
          navAbout:   t("navAbout"),
          navPlans:   t("navPlans"),
          navReviews: t("navReviews"),
        }}
      />

      {/* ── Two-column layout ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 mt-10">

        {/* ── Left: main content ──────────────────────────────── */}
        <div className="space-y-8 min-w-0">

          {/* About */}
          <section id="about" className="scroll-mt-32">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t("aboutHeading", { firstName })}
            </h2>
            <DescriptionWithToggle
              text={guide.bio}
              showMoreLabel="Show more"
              showLessLabel="Show less"
            />

            {/* Specializations */}
            {guide.specializations.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  {t("specializationsHeading")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {guide.specializations.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1.5 bg-primary/8 text-primary text-xs font-medium rounded-full"
                    >
                      {SPEC_LABELS[s] ?? s.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          <Separator />

          {/* Plans */}
          <section id="plans" className="scroll-mt-32">
            <div className="flex items-baseline gap-2 mb-5">
              <h2 className="text-xl font-semibold text-gray-900">
                {t("plansHeading", { firstName })}
              </h2>
              <span className="text-sm text-gray-400">
                {t("plansCount", { count: guide.plans.length })}
              </span>
            </div>

            {guide.plans.length === 0 ? (
              <p className="text-gray-400 text-sm">{t("noPlans")}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {guide.plans.map((plan) => (
                  <Link
                    key={plan.id}
                    href={`/${locale}/planner/${plan.id}`}
                    className="group bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-gray-200 transition-all flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        {t("planDuration", { count: plan.duration })}
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        plan.planType === "GUIDE_FREE"
                          ? "bg-green-50 text-green-700"
                          : "bg-primary/10 text-primary"
                      }`}>
                        {PLAN_TYPE_LABELS[plan.planType] ?? plan.planType}
                        {plan.planType === "GUIDE_PAID" && plan.price ? ` · TND ${plan.price}` : ""}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {plan.title ?? `${t("planDuration", { count: plan.duration })} ${plan.destination?.city ?? ""} Trip`}
                    </p>
                    {plan.summary && (
                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{plan.summary}</p>
                    )}
                    {(plan.suitableFor.length > 0 || plan.difficulty) && (
                      <div className="flex flex-wrap gap-1.5">
                        {plan.suitableFor.slice(0, 2).map((s) => (
                          <span key={s} className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full capitalize">
                            {s}
                          </span>
                        ))}
                        {plan.difficulty && (
                          <span className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full capitalize">
                            {plan.difficulty}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-400 border-t border-gray-100 pt-3 mt-auto">
                      {plan.purchaseCount > 0 && (
                        <span className="flex items-center gap-1">
                          <FaCompass className="h-3 w-3" />
                          {t("tripsPlanned", { count: plan.purchaseCount })}
                        </span>
                      )}
                      {plan.viewCount > 0 && (
                        <span className="flex items-center gap-1">
                          <FiEye className="h-3 w-3" />
                          {t("planViews", { count: plan.viewCount })}
                        </span>
                      )}
                      <span className="ml-auto text-primary font-medium group-hover:underline">
                        {t("planCardView")} →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <Separator />

          {/* Custom plan request banner */}
          <div className="bg-primary/5 border border-primary/15 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 text-base mb-1">
                  {t("customPlanBannerTitle")}
                </h3>
                <p className="text-sm text-gray-500 max-w-md leading-relaxed">
                  {t("customPlanBannerDesc", { firstName })}
                </p>
              </div>
              <Link
                href={requestHref}
                className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                {t("requestCta")}
              </Link>
            </div>
          </div>
        </div>

        {/* ── Right: sticky info card ───────────────────────────── */}
        <div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-5 sticky top-28">

            {/* Request CTA */}
            <div className="space-y-2">
              <Link
                href={requestHref}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                {t("requestCta")}
              </Link>
              <p className="text-xs text-gray-400 text-center">{t("requestCtaSubtitle")}</p>
            </div>

            <Separator />

            {/* Guide info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm">{t("guideInfoHeading")}</h3>

              {guide.languages.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t("languagesLabel")}</p>
                  <p className="text-sm text-gray-700 font-medium">{guide.languages.join(" · ")}</p>
                </div>
              )}

              {guide.experienceYears != null && guide.experienceYears > 0 && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t("experienceLabel")}</p>
                  <p className="text-sm text-gray-700 font-medium">
                    {t("experienceYears", { years: guide.experienceYears })}
                  </p>
                </div>
              )}

              {guide.country && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t("basedInLabel")}</p>
                  <p className="text-sm text-gray-700 font-medium">{guide.country}</p>
                </div>
              )}

              {guide.totalSales > 0 && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t("tripsPlanned", { count: guide.totalSales })}</p>
                </div>
              )}
            </div>

            {/* Social links */}
            {(guide.website || guide.instagram || guide.facebook || guide.tiktok) && (
              <>
                <Separator />
                <div className="flex gap-3">
                  {guide.website && (
                    <a href={guide.website} target="_blank" rel="noopener noreferrer"
                      className="h-9 w-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary/30 transition-colors"
                      aria-label="Website">
                      <FiGlobe className="h-4 w-4" />
                    </a>
                  )}
                  {guide.instagram && (
                    <a href={`https://instagram.com/${guide.instagram}`} target="_blank" rel="noopener noreferrer"
                      className="h-9 w-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary/30 transition-colors"
                      aria-label="Instagram">
                      <FiInstagram className="h-4 w-4" />
                    </a>
                  )}
                  {guide.facebook && (
                    <a href={guide.facebook} target="_blank" rel="noopener noreferrer"
                      className="h-9 w-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary/30 transition-colors"
                      aria-label="Facebook">
                      <FaFacebook className="h-4 w-4" />
                    </a>
                  )}
                  {guide.tiktok && (
                    <a href={`https://tiktok.com/@${guide.tiktok}`} target="_blank" rel="noopener noreferrer"
                      className="h-9 w-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary/30 transition-colors"
                      aria-label="TikTok">
                      <FaTiktok className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Reviews — full width below the two-column grid ─────── */}
      <Separator className="my-10" />

      <div id="reviews" className="space-y-8 scroll-mt-32">
        <h2 className="text-xl font-semibold text-gray-900">
          {t("navReviews")} ({reviewCount})
        </h2>

        {avgRating && reviewCount >= 2 && (
          <>
            <RatingSummary
              averageRating={avgRating}
              nbReviews={reviewCount}
              reviews={reviews}
              labels={{ reviews: t("navReviews"), outOf: "/ 5" }}
            />
            <Separator />
          </>
        )}

        <ReviewsSection
          reviews={reviews.map((r) => ({
            id:           r.id,
            userName:     r.user.name ?? "Anonymous",
            title:        r.title,
            rating:       r.rating,
            comment:      r.comment,
            response:     r.response,
            responseDate: r.responseDate ? String(r.responseDate) : null,
            createdAt:    r.createdAt,
            user:         r.user,
          }))}
          noReviewsLabel={t("noReviews")}
          canReview={canLeaveReview && !alreadyReviewed}
          listingId={guide.id}
          relationType="GUIDE"
          listingTitle={guide.displayName}
          reviewFormLabels={{
            buttonLabel:        t("reviewButtonLabel"),
            dialogTitle:        t("reviewDialogTitle", { name: guide.displayName }),
            ratingLabel:        t("reviewRatingLabel"),
            titleLabel:         t("reviewTitleLabel"),
            titlePlaceholder:   t("reviewTitlePlaceholder"),
            commentLabel:       t("reviewCommentLabel"),
            commentPlaceholder: t("reviewCommentPlaceholder"),
            submit:             t("reviewSubmit"),
            submitting:         t("reviewSubmitting"),
            cancel:             t("reviewCancel"),
            success:            t("reviewSuccess"),
          }}
        />
      </div>

      {/* ── Related guides — full width below reviews ───────────── */}
      {relatedGuides.length > 0 && (
        <>
          <Separator className="my-10" />
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-5">
              {t("otherGuidesTitle", { city: guide.destination?.city ?? "this destination" })}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedGuides.map((g) => (
                <Link
                  key={g.id}
                  href={`/${locale}/planner/guides/${g.slug}`}
                  className="group flex items-start gap-3.5 bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:border-gray-200 transition-all"
                >
                  <div className="relative h-12 w-12 rounded-full overflow-hidden bg-gray-100 shrink-0">
                    {g.avatarUrl ? (
                      <Image src={g.avatarUrl} alt={g.displayName} fill className="object-cover" sizes="48px" />
                    ) : (
                      <div className="w-full h-full bg-primary/5 flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">{g.displayName.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-sm text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {g.displayName}
                      </p>
                      {g.isVerified && <FaCircleCheck className="h-3 w-3 text-blue-600 shrink-0" />}
                    </div>
                    {g.tagline && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{g.tagline}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {t("planCountLabel", { count: g.planCount })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>

    {/* ── Mobile sticky CTA ──────────────────────────────────────── */}
    <GuideMobileCTA
      href={requestHref}
      label={t("requestCta")}
      subtitle={t("requestCtaSubtitle")}
    />
    </>
  );
}
