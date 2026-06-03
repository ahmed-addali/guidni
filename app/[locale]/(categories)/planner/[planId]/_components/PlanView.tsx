"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  MapPin, Clock, Users, Globe, Globe2,
  Share2, Trash2, Edit2, Loader2, ChevronLeft, ChevronRight,
  Tag, Star,
} from "lucide-react";
import { FaCheckCircle } from "react-icons/fa";
import { ItineraryBoard } from "../../_components/itinerary/ItineraryBoard";
import { BudgetBar } from "../../_components/itinerary/BudgetBar";
import { ReviewsSection } from "@/components/activities/ReviewsSection";
import { computeBudget } from "@/lib/planner/budget";
import { updatePlan, deletePlan } from "@/lib/actions/planner";
import type { PlanDay, PlanItem, PlanBlock, UserPreferences } from "@/lib/planner/types";
import { parsePlanItinerary } from "@/lib/planner/types";

type GuideInfo = {
  slug: string;
  displayName: string;
  avatarUrl?: string | null;
  isVerified: boolean;
};

type ReviewItem = {
  id: string;
  userName: string;
  title?: string | null;
  rating: number;
  comment?: string | null;
  response?: string | null;
  responseDate?: string | null;
  createdAt: Date;
  user: { id: string; name: string | null; image: string | null };
};

type PlanRecord = {
  id: string;
  title: string | null;
  duration: number;
  isPublic: boolean;
  preferences: unknown;
  itinerary: unknown;
  destination: { id: string; city: string; country: string; slug: string } | null;
  guide?: GuideInfo | null;
  summary?: string | null;
  tags?: string[];
  difficulty?: string | null;
  suitableFor?: string[];
  season?: string | null;
};

type Props = {
  plan: PlanRecord;
  locale: string;
  isOwner: boolean;
  reviews?: ReviewItem[];
  canReview?: boolean;
  alreadyReviewed?: boolean;
  chatSlot?: React.ReactNode;
};

export function PlanView({ plan, locale, isOwner, reviews = [], canReview, alreadyReviewed, chatSlot }: Props) {
  const t = useTranslations("PlanView");
  const router = useRouter();
  const preferences = plan.preferences as UserPreferences;
  const parsed = parsePlanItinerary(plan.itinerary);
  const [days, setDays] = useState<PlanDay[]>(parsed.days);
  const stays   = parsed.stays;
  const rentals = parsed.rentals;
  const [title] = useState(plan.title ?? "");
  const [isPublic, setIsPublic] = useState(plan.isPublic);
  const [swapSlot, setSwapSlot] = useState<PlanBlock | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const budget = useMemo(
    () => computeBudget({ days, stays, rentals }, preferences),
    [days, stays, rentals, preferences]
  );

  const isGuidePlan = !!plan.guide;
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;

  const city = plan.destination?.city ?? preferences.destinationCity ?? t("unknownCity");
  const country = plan.destination?.country ?? "";

  const groupLabels: Record<string, string> = {
    solo:    t("groupSolo"),
    couple:  t("groupCouple"),
    family:  t("groupFamily"),
    friends: t("groupFriends"),
  };

  const budgetLabels: Record<number, string> = {
    1: t("budgetBudget"),
    2: t("budgetMidrange"),
    3: t("budgetLuxury"),
  };

  const handleDaysChange = useCallback(
    (newDays: PlanDay[]) => {
      setDays(newDays);
      if (!isOwner) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        await updatePlan(plan.id, { itinerary: { days: newDays, stays, rentals } });
      }, 1500);
    },
    [plan.id, isOwner, stays, rentals]
  );

  const handleSwapSelect = useCallback(
    (block: PlanBlock, replacement: PlanItem) => {
      const newDays = days.map((day) => ({
        ...day,
        blocks: day.blocks.map((b) =>
          b.id === block.id ? { ...b, item: replacement } : b
        ),
      }));
      handleDaysChange(newDays);
      setSwapSlot(null);
    },
    [days, handleDaysChange]
  );

  const handlePublicToggle = useCallback(async () => {
    const next = !isPublic;
    setIsPublic(next);
    const result = await updatePlan(plan.id, { isPublic: next });
    if (!result.success) {
      setIsPublic(!next);
      toast.error(t("errorUpdate"));
    } else {
      toast.success(next ? t("madePublic") : t("madePrivate"));
    }
  }, [isPublic, plan.id, t]);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    toast.success(t("linkCopied"));
  }, [t]);

  const handleDelete = useCallback(async () => {
    if (!confirm(t("confirmDelete"))) return;
    setIsDeleting(true);
    const result = await deletePlan(plan.id);
    if (result.success) {
      router.push(isOwner && !isGuidePlan ? `/${locale}/my-plans` : `/${locale}/planner`);
    } else {
      setIsDeleting(false);
      toast.error(result.error ?? t("errorDelete"));
    }
  }, [plan.id, locale, router, t]);

  const defaultTitle = t("defaultTitle", { days: plan.duration, city });

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-8">

      {/* Back */}
      {isGuidePlan && plan.guide ? (
        <Link
          href={`/${locale}/planner/guides/${plan.guide.slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("backLink")}
        </Link>
      ) : (
        <div className="flex items-center justify-between mb-6">
          <Link
            href={`/${locale}/planner`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            {t("backToPlanner")}
          </Link>
          {isOwner && (
            <Link
              href={`/${locale}/my-plans`}
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              {t("backToMyPlans")}
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}

      {/* Guide attribution card */}
      {isGuidePlan && plan.guide && (
        <div className="bg-white border border-gray-100 rounded-2xl px-6 py-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href={`/${locale}/planner/guides/${plan.guide.slug}`}
              className="relative h-10 w-10 rounded-full overflow-hidden bg-gray-100 shrink-0 hover:opacity-90 transition-opacity"
            >
              {plan.guide.avatarUrl ? (
                <Image
                  src={plan.guide.avatarUrl}
                  alt={plan.guide.displayName}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              ) : (
                <span className="h-full w-full flex items-center justify-center text-sm font-bold text-gray-500">
                  {plan.guide.displayName.charAt(0)}
                </span>
              )}
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/${locale}/planner/guides/${plan.guide.slug}`}
                  className="text-sm font-semibold text-gray-900 hover:text-primary transition-colors"
                >
                  {plan.guide.displayName}
                </Link>
                {plan.guide.isVerified && (
                  <FaCheckCircle className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                )}
              </div>
              <p className="text-xs text-gray-400">{t("localGuide")}</p>
            </div>
          </div>

          {plan.summary && (
            <p className="text-sm text-gray-600 leading-relaxed mb-4">{plan.summary}</p>
          )}

          {(plan.difficulty || plan.suitableFor?.length || plan.season || plan.tags?.length) && (
            <div className="flex flex-wrap gap-1.5">
              {plan.difficulty && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium capitalize">
                  {plan.difficulty}
                </span>
              )}
              {plan.suitableFor?.map((s) => (
                <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium capitalize">
                  {s}
                </span>
              ))}
              {plan.season && plan.season !== "Any" && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
                  {plan.season}
                </span>
              )}
              {plan.tags?.slice(0, 3).map((tag) => (
                <span key={tag} className="flex items-center gap-0.5 text-[11px] px-2 py-0.5 rounded-full bg-primary/5 text-primary font-medium">
                  <Tag className="h-2.5 w-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {avgRating !== null && (
            <a
              href="#plan-reviews"
              className="inline-flex items-center gap-1.5 mt-3 text-xs hover:opacity-75 transition-opacity"
            >
              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              <span className="font-semibold text-gray-700">{avgRating.toFixed(1)}</span>
              <span className="text-gray-400 underline underline-offset-2">
                {t("reviewCount", { count: reviews.length })}
              </span>
            </a>
          )}
        </div>
      )}

      {/* Chat with guide — shown below guide card when user has access */}
      {chatSlot && <div className="mb-4">{chatSlot}</div>}

      {/* Plan header card */}
      <div className="bg-white border border-gray-100 rounded-2xl px-6 py-5 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {/* Title */}
            <h1 className="text-xl font-bold text-gray-900 truncate mb-2">
              {title || defaultTitle}
            </h1>

            {/* Meta chips */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {city}{country ? `, ${country}` : ""}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {t("dayCount", { count: plan.duration })}
              </span>
              {preferences.groupType && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {groupLabels[preferences.groupType] ?? preferences.groupType}
                </span>
              )}
              {preferences.budget && (
                <span>{budgetLabels[preferences.budget] ?? ""}</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isOwner && (
              <Link
                href={`/${locale}/planner/${plan.id}/edit`}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5" />
                {t("editPlan")}
              </Link>
            )}
            {isOwner && !isGuidePlan && (
              <button
                type="button"
                onClick={handlePublicToggle}
                title={isPublic ? t("makePrivate") : t("makePublic")}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                  isPublic
                    ? "border-green-200 text-green-700 bg-green-50 hover:bg-green-100"
                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                {isPublic ? (
                  <><Globe className="h-3.5 w-3.5" />{t("public")}</>
                ) : (
                  <><Globe2 className="h-3.5 w-3.5" />{t("private")}</>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={handleShare}
              title={t("copyLink")}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Share2 className="h-4 w-4" />
            </button>
            {isOwner && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                title={t("deletePlan")}
                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Budget bar */}
      <BudgetBar
        budget={budget}
        duration={plan.duration}
        budgetLevel={preferences.budget as 1 | 2 | 3 | undefined}
        groupType={preferences.groupType}
      />

      {/* Accommodation */}
      {stays.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {t("staysTitle")}
          </p>
          <div className="space-y-3">
            {stays.map((block) => {
              const rangeLabel =
                block.fromDay === 1 && block.toDay === plan.duration
                  ? t("allDays", { count: plan.duration })
                  : block.fromDay === block.toDay
                  ? t("dayRangeSingle", { day: block.fromDay })
                  : t("dayRangeMulti", { from: block.fromDay, to: block.toDay });
              return (
                <div key={block.id} className="flex items-center gap-3">
                  {/* Image or fallback */}
                  <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    {block.item.imageUrl ? (
                      <Image
                        src={block.item.imageUrl}
                        alt={block.item.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-xl">🏨</div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{block.item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {block.item.location && (
                        <span className="text-xs text-gray-400 truncate">{block.item.location}</span>
                      )}
                      {block.item.price > 0 && (
                        <span className="text-xs text-gray-500 font-medium">
                          TND {block.item.price}{t("perNight")}
                        </span>
                      )}
                    </div>
                    {block.note && <p className="text-xs text-gray-400 mt-0.5 truncate">{block.note}</p>}
                  </div>
                  {/* Day range badge */}
                  <span className="text-[11px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full shrink-0 whitespace-nowrap">
                    {rangeLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rentals */}
      {rentals.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {t("rentalsTitle")}
          </p>
          <div className="space-y-3">
            {rentals.map((block) => {
              const rentalDays = block.toDay - block.fromDay + 1;
              const rangeLabel =
                block.fromDay === 1 && block.toDay === plan.duration
                  ? t("allDays", { count: plan.duration })
                  : block.fromDay === block.toDay
                  ? t("dayRangeSingle", { day: block.fromDay })
                  : t("dayRangeMulti", { from: block.fromDay, to: block.toDay });
              return (
                <div key={block.id} className="flex items-center gap-3">
                  <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    {block.item.imageUrl ? (
                      <Image
                        src={block.item.imageUrl}
                        alt={block.item.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-xl">🚗</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{block.item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {block.item.location && (
                        <span className="text-xs text-gray-400 truncate">{block.item.location}</span>
                      )}
                      {block.item.price > 0 && (
                        <span className="text-xs text-gray-500 font-medium">
                          TND {block.item.price}{t("rentalPerDay")}
                        </span>
                      )}
                    </div>
                    {block.note && <p className="text-xs text-gray-400 mt-0.5 truncate">{block.note}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[11px] font-semibold px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full whitespace-nowrap">
                      {rangeLabel}
                    </span>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap">
                      {t("rentalNights", { count: rentalDays })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Itinerary board */}
      <ItineraryBoard
        days={days}
        preferences={preferences}
        locale={locale}
        isOwner={isOwner}
        hideBudgetBar
        swapSlot={swapSlot}
        onDaysChange={handleDaysChange}
        onSwapOpen={setSwapSlot}
        onSwapClose={() => setSwapSlot(null)}
        onSwapSelect={handleSwapSelect}
      />

      {/* Reviews */}
      {isGuidePlan && (
        <div id="plan-reviews" className="mt-10 bg-white border border-gray-100 rounded-2xl px-6 py-6 scroll-mt-24">
          <h2 className="text-base font-semibold text-gray-900 mb-6">{t("reviewsTitle")}</h2>
          <ReviewsSection
            reviews={reviews}
            noReviewsLabel={t("noReviews")}
            canReview={canReview && !alreadyReviewed}
            listingId={plan.id}
            relationType="PLAN"
            listingTitle={plan.title ?? `${plan.duration}-Day Trip`}
            reviewFormLabels={{
              buttonLabel:        t("reviewButtonLabel"),
              dialogTitle:        t("reviewDialogTitle"),
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
      )}
    </div>
  );
}
