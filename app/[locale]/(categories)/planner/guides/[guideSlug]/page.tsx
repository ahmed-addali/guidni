import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getGuideBySlug } from "@/lib/actions/guides";
import { getReviews, hasReviewed, hasCompletedBooking } from "@/lib/actions/reviews";
import { ReviewsSection } from "@/components/activities/ReviewsSection";
import { FiStar, FiBookOpen, FiMapPin, FiGlobe, FiInstagram } from "react-icons/fi";
import { FaCircleCheck, FaFacebook, FaTiktok } from "react-icons/fa6";
import { ArrowLeft } from "lucide-react";

type Props = {
  params: Promise<{ locale: string; guideSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { guideSlug, locale } = await params;
  const guide = await getGuideBySlug(guideSlug);
  if (!guide) return { title: "Guide not found" };
  const t = await getTranslations({ locale, namespace: "GuideProfile" });
  return {
    title: `${guide.displayName} — ${t("guideInfoHeading")} · Guidni`,
    description: guide.tagline ?? guide.bio.slice(0, 160),
  };
}

export default async function GuideProfilePage({ params }: Props) {
  const { locale, guideSlug } = await params;

  const [guide, session, t] = await Promise.all([
    getGuideBySlug(guideSlug),
    auth.api.getSession({ headers: await headers() }),
    getTranslations({ locale, namespace: "GuideProfile" }),
  ]);
  if (!guide) notFound();

  const [reviews, alreadyReviewed, canLeaveReview] = await Promise.all([
    getReviews(guide.id, "GUIDE"),
    session?.user ? hasReviewed(guide.id, "GUIDE") : Promise.resolve(false),
    session?.user ? hasCompletedBooking(guide.id, "GUIDE") : Promise.resolve(false),
  ]);

  const realRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;
  const realReviewCount = reviews.length;

  const firstName = guide.displayName.split(" ")[0];

  const PLAN_TYPE_LABELS: Record<string, string> = {
    GUIDE_FREE: t("planTypeFree"),
    GUIDE_PAID: t("planTypePaid"),
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-10">
      {/* Back link */}
      <Link
        href={`/${locale}/planner/guides`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("backLink")}
      </Link>

      {/* Cover */}
      <div className="relative w-full h-48 sm:h-64 rounded-2xl overflow-hidden bg-gray-100 mb-6">
        {guide.coverUrl ? (
          <Image src={guide.coverUrl} alt={guide.displayName} fill className="object-cover" sizes="100vw" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
        {/* Left: main content */}
        <div className="space-y-8">
          {/* Identity */}
          <div className="flex items-start gap-5">
            <div className="relative h-20 w-20 rounded-full overflow-hidden bg-gray-100 shrink-0 border-4 border-white shadow-md -mt-12">
              {guide.avatarUrl ? (
                <Image src={guide.avatarUrl} alt={guide.displayName} fill className="object-cover" sizes="80px" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-gray-400 text-2xl font-bold">
                  {guide.displayName.charAt(0)}
                </div>
              )}
            </div>
            <div className="pt-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{guide.displayName}</h1>
                {guide.isVerified && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                    <FaCircleCheck className="h-3 w-3" /> {t("verified")}
                  </span>
                )}
              </div>
              {guide.tagline && <p className="text-gray-500 text-sm mt-0.5">{guide.tagline}</p>}
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
                {guide.destination && (
                  <div className="flex items-center gap-1">
                    <FiMapPin className="h-3.5 w-3.5" />
                    <span>{guide.destination.city}</span>
                  </div>
                )}
                {realRating !== null && (
                  <a
                    href="#reviews"
                    className="flex items-center gap-1 hover:opacity-75 transition-opacity"
                  >
                    <FiStar className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                    <span className="font-medium text-gray-700">{realRating.toFixed(1)}</span>
                    {realReviewCount > 0 && (
                      <span className="text-gray-400 underline underline-offset-2">
                        {t("reviewCount", { count: realReviewCount })}
                      </span>
                    )}
                  </a>
                )}
                <div className="flex items-center gap-1">
                  <FiBookOpen className="h-3.5 w-3.5" />
                  <span>{t("planCountLabel", { count: guide.planCount })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h2 className="font-semibold text-gray-900 mb-3">{t("aboutHeading", { firstName })}</h2>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{guide.bio}</p>
          </div>

          {/* Specializations */}
          {guide.specializations.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-900 mb-3">{t("specializationsHeading")}</h2>
              <div className="flex flex-wrap gap-2">
                {guide.specializations.map((s) => (
                  <span key={s} className="px-3 py-1 bg-primary/8 text-primary text-sm rounded-full font-medium capitalize">
                    {s.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Plans */}
          <div id="plans">
            <h2 className="font-semibold text-gray-900 mb-4">
              {t("plansHeading", { firstName })}{" "}
              <span className="text-gray-400 font-normal">{t("plansCount", { count: guide.plans.length })}</span>
            </h2>
            {guide.plans.length === 0 ? (
              <p className="text-gray-400 text-sm">{t("noPlans")}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {guide.plans.map((plan) => (
                  <Link
                    key={plan.id}
                    href={`/${locale}/planner/${plan.id}`}
                    className="group bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        {t("planDuration", { count: plan.duration })}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        plan.planType === "GUIDE_FREE"
                          ? "bg-green-50 text-green-700"
                          : "bg-primary/10 text-primary"
                      }`}>
                        {PLAN_TYPE_LABELS[plan.planType] ?? plan.planType}
                        {plan.planType === "GUIDE_PAID" && plan.price ? ` · TND ${plan.price}` : ""}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {plan.title ?? `${t("planDuration", { count: plan.duration })} ${plan.destination?.city ?? ""} Trip`}
                    </p>
                    {plan.summary && (
                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{plan.summary}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {plan.suitableFor.slice(0, 2).map((s) => (
                        <span key={s} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full capitalize">
                          {s}
                        </span>
                      ))}
                      {plan.difficulty && (
                        <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full capitalize">
                          {plan.difficulty}
                        </span>
                      )}
                    </div>
                    {(plan.purchaseCount > 0 || plan.viewCount > 0) && (
                      <div className="flex items-center gap-3 mt-3 text-xs text-gray-400 border-t border-gray-100 pt-3">
                        {plan.purchaseCount > 0 && <span>{t("tripsPlanned", { count: plan.purchaseCount })}</span>}
                        {plan.viewCount > 0 && <span>{t("planViews", { count: plan.viewCount })}</span>}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Reviews */}
          <div id="reviews" className="scroll-mt-24">
            <ReviewsSection
              reviews={reviews.map((r) => ({
                id: r.id,
                userName: r.user.name ?? "Anonymous",
                title: r.title,
                rating: r.rating,
                comment: r.comment,
                response: r.response,
                responseDate: r.responseDate ? String(r.responseDate) : null,
                createdAt: r.createdAt,
                user: r.user,
              }))}
              noReviewsLabel={t("noReviews")}
              canReview={canLeaveReview && !alreadyReviewed}
              listingId={guide.id}
              relationType="GUIDE"
              listingTitle={guide.displayName}
              reviewFormLabels={{
                buttonLabel: t("reviewButtonLabel"),
                dialogTitle: t("reviewDialogTitle", { name: guide.displayName }),
                ratingLabel: t("reviewRatingLabel"),
                titleLabel: t("reviewTitleLabel"),
                titlePlaceholder: t("reviewTitlePlaceholder"),
                commentLabel: t("reviewCommentLabel"),
                commentPlaceholder: t("reviewCommentPlaceholder"),
                submit: t("reviewSubmit"),
                submitting: t("reviewSubmitting"),
                cancel: t("reviewCancel"),
                success: t("reviewSuccess"),
              }}
            />
          </div>
        </div>

        {/* Right: info card */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4 sticky top-24">
            <h3 className="font-semibold text-gray-900">{t("guideInfoHeading")}</h3>

            {guide.languages.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t("languagesLabel")}</p>
                <p className="text-sm text-gray-700">{guide.languages.join(" · ")}</p>
              </div>
            )}

            {guide.experienceYears !== null && guide.experienceYears !== undefined && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t("experienceLabel")}</p>
                <p className="text-sm text-gray-700">{t("experienceYears", { years: guide.experienceYears })}</p>
              </div>
            )}

            {guide.country && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t("basedInLabel")}</p>
                <p className="text-sm text-gray-700">{guide.country}</p>
              </div>
            )}

            {/* Social links */}
            {(guide.website || guide.instagram || guide.facebook || guide.tiktok) && (
              <div className="border-t border-gray-100 pt-4 flex gap-3">
                {guide.website && (
                  <a href={guide.website} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors" aria-label="Website">
                    <FiGlobe className="h-4 w-4" />
                  </a>
                )}
                {guide.instagram && (
                  <a href={`https://instagram.com/${guide.instagram}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors" aria-label="Instagram">
                    <FiInstagram className="h-4 w-4" />
                  </a>
                )}
                {guide.facebook && (
                  <a href={guide.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors" aria-label="Facebook">
                    <FaFacebook className="h-4 w-4" />
                  </a>
                )}
                {guide.tiktok && (
                  <a href={`https://tiktok.com/@${guide.tiktok}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors" aria-label="TikTok">
                    <FaTiktok className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
