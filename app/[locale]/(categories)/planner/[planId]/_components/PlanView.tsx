"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  MapPin, Clock, Users, Globe, Globe2,
  Share2, Trash2, Edit2, Check, X, Loader2, ChevronLeft,
  Tag, Star,
} from "lucide-react";
import { FaCheckCircle } from "react-icons/fa";
import { ItineraryBoard } from "../../_components/itinerary/ItineraryBoard";
import { ReviewsSection } from "@/components/activities/ReviewsSection";
import { updatePlan, deletePlan } from "@/lib/actions/planner";
import type { PlanDay, PlanItem, PlanSlot, UserPreferences } from "@/lib/planner/types";

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
};

export function PlanView({ plan, locale, isOwner, reviews = [], canReview, alreadyReviewed }: Props) {
  const t = useTranslations("PlanView");
  const router = useRouter();
  const preferences = plan.preferences as UserPreferences;
  const [days, setDays] = useState<PlanDay[]>(plan.itinerary as PlanDay[]);
  const [title, setTitle] = useState(plan.title ?? "");
  const [editingTitle, setEditingTitle] = useState(false);
  const [isPublic, setIsPublic] = useState(plan.isPublic);
  const [swapSlot, setSwapSlot] = useState<PlanSlot | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        await updatePlan(plan.id, { itinerary: newDays });
      }, 1500);
    },
    [plan.id, isOwner]
  );

  const handleSwapSelect = useCallback(
    (slot: PlanSlot, replacement: PlanItem) => {
      const newDays = days.map((day) => ({
        ...day,
        slots: day.slots.map((s) =>
          s.id === slot.id ? { ...s, item: replacement } : s
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

  const handleTitleSave = useCallback(async () => {
    setIsSavingTitle(true);
    const result = await updatePlan(plan.id, { title: title.trim() || undefined });
    setIsSavingTitle(false);
    if (result.success) {
      setEditingTitle(false);
    } else {
      toast.error(t("errorSaveTitle"));
    }
  }, [plan.id, title, t]);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    toast.success(t("linkCopied"));
  }, [t]);

  const handleDelete = useCallback(async () => {
    if (!confirm(t("confirmDelete"))) return;
    setIsDeleting(true);
    const result = await deletePlan(plan.id);
    if (result.success) {
      router.push(`/${locale}/planner`);
    } else {
      setIsDeleting(false);
      toast.error(result.error ?? t("errorDelete"));
    }
  }, [plan.id, locale, router, t]);

  const defaultTitle = t("defaultTitle", { days: plan.duration, city });

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-8">

      {/* Back */}
      <Link
        href={`/${locale}/planner`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("backLink")}
      </Link>

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

      {/* Plan header card */}
      <div className="bg-white border border-gray-100 rounded-2xl px-6 py-5 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {/* Editable title */}
            {editingTitle ? (
              <div className="flex items-center gap-2 mb-2">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xl font-bold text-gray-900 border-b-2 border-primary outline-none flex-1 min-w-0 bg-transparent"
                  placeholder={t("titlePlaceholder")}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleTitleSave();
                    if (e.key === "Escape") setEditingTitle(false);
                  }}
                />
                <button type="button" onClick={handleTitleSave} disabled={isSavingTitle} className="p-1 text-primary hover:opacity-70">
                  {isSavingTitle ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </button>
                <button type="button" onClick={() => setEditingTitle(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-xl font-bold text-gray-900 truncate">
                  {title || defaultTitle}
                </h1>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setEditingTitle(true)}
                    className="p-1 text-gray-300 hover:text-gray-500 transition-colors shrink-0"
                    title={t("editTitle")}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}

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

      {/* Itinerary board */}
      <ItineraryBoard
        days={days}
        preferences={preferences}
        locale={locale}
        isOwner={isOwner}
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
