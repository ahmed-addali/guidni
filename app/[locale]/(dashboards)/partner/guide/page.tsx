import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMyGuideProfile, getMyGuidePlans } from "@/lib/actions/partner-guides";
import { getReviews } from "@/lib/actions/reviews";
import { getGuideEarnings } from "@/lib/actions/plan-purchases";
import { getGuidePendingRequestCount } from "@/lib/actions/plan-requests";
import { getGuideUnreadCount } from "@/lib/actions/guide-messages";
import { getDestinations } from "@/lib/actions/destinations";
import { NewPlanButton } from "./_components/NewPlanButton";
import { RelationType } from "@prisma/client";
import {
  FiArrowRight, FiStar, FiTrendingUp, FiInbox,
  FiMessageCircle, FiExternalLink, FiEdit2, FiMapPin,
  FiEye, FiBookOpen,
} from "react-icons/fi";
import { FaCompass } from "react-icons/fa6";

type Params = Promise<{ locale: string }>;

export const metadata = { title: "Guide Dashboard — Guidni" };

/* ── Specialization display labels ──────────────────────────────── */

const SPEC_LABELS: Record<string, string> = {
  culture:         "Culture",
  food_drink:      "Food & Drink",
  adventures:      "Adventures",
  water_sports:    "Water Sports",
  nature_wildlife: "Nature",
  sightseeing:     "Sightseeing",
  shopping:        "Shopping",
  wellness:        "Wellness",
  family_friendly: "Family-friendly",
};

/* ── Plan status pill ────────────────────────────────────────────── */

function PlanStatusPill({ isPublic, status }: { isPublic: boolean; status: string }) {
  if (isPublic) {
    return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-50 text-green-700">Published</span>;
  }
  const map: Record<string, { label: string; cls: string }> = {
    PENDING:           { label: "Under review",   cls: "bg-amber-50 text-amber-700"  },
    APPROVED:          { label: "Approved",        cls: "bg-green-50 text-green-700"  },
    REJECTED:          { label: "Rejected",        cls: "bg-red-50 text-red-600"      },
    CHANGES_REQUESTED: { label: "Changes needed",  cls: "bg-orange-50 text-orange-700"},
  };
  const cfg = map[status] ?? { label: "Draft", cls: "bg-gray-100 text-gray-500" };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.cls}`}>{cfg.label}</span>;
}

/* ── Page ────────────────────────────────────────────────────────── */

export default async function GuideOverviewPage({ params }: { params: Params }) {
  const { locale } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect(`/${locale}/login`);

  const [profile, plans, destinations] = await Promise.all([
    getMyGuideProfile(),
    getMyGuidePlans(),
    getDestinations(),
  ]);

  const [reviews, earnings, pendingRequests, unreadMessages] = await Promise.all([
    profile ? getReviews(profile.id, RelationType.GUIDE) : Promise.resolve([]),
    profile ? getGuideEarnings()                          : Promise.resolve(null),
    profile ? getGuidePendingRequestCount()               : Promise.resolve(0),
    profile ? getGuideUnreadCount()                       : Promise.resolve(0),
  ]);

  const base       = `/${locale}/partner/guide`;
  const publicBase = `/${locale}/planner/guides`;

  /* ── No profile ──────────────────────────────────────────────── */

  if (!profile) {
    return (
      <div className="max-w-screen-sm mx-auto py-24 text-center space-y-5">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <FaCompass className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Set up your guide profile</h1>
        <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">
          Create your public guide profile to start publishing trip plans and reaching travelers.
        </p>
        <Link
          href={`${base}/profile`}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Create profile <FiArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  /* ── Derived values ──────────────────────────────────────────── */

  const publishedPlans = plans.filter((p) => p.isPublic);
  const totalViews     = plans.reduce((sum, p) => sum + p.viewCount, 0);
  const totalPurchases = plans.reduce((sum, p) => sum + p.purchaseCount, 0);
  const totalEarned    = earnings?.totalEarned ?? 0;
  const avgRating      = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const onboardingSteps = [
    {
      id:       "profile",
      label:    "Complete your profile",
      sublabel: "Add bio, specializations, and languages",
      done:     !!(profile.bio && profile.specializations.length > 0 && profile.languages.length > 0),
      href:     `${base}/profile`,
    },
    {
      id:       "photos",
      label:    "Add your photos",
      sublabel: "Profile photo and cover image",
      done:     !!(profile.avatarUrl && profile.coverUrl),
      href:     `${base}/profile`,
    },
    {
      id:       "plan",
      label:    "Publish your first plan",
      sublabel: "Let travelers discover your local expertise",
      done:     publishedPlans.length > 0,
      href:     `${base}/plans`,
    },
  ];
  const allOnboardingDone = onboardingSteps.every((s) => s.done);

  const recentReviews = reviews.slice(0, 4);

  /* ── Render ──────────────────────────────────────────────────── */

  return (
    <div className="space-y-6 max-w-screen-xl">

      {/* ── Profile card ─────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl">

        {/* Cover strip */}
        <div className="relative h-28 sm:h-36 bg-slate-100 rounded-t-2xl overflow-hidden">
          {profile.coverUrl ? (
            <Image
              src={profile.coverUrl}
              alt="Cover"
              fill
              className="object-cover"
              sizes="(max-width: 1280px) 100vw, 1280px"
              priority
            />
          ) : (
            /* Subtle geometric fallback — no branded color */
            <div className="absolute inset-0 bg-slate-100">
              <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1.5" fill="#1e3a8a" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#dots)" />
              </svg>
            </div>
          )}
        </div>

        {/* Card body */}
        <div className="px-6 pb-6">

          {/* Avatar + action buttons */}
          <div className="flex items-start justify-between gap-4 pt-3">
            {/* Avatar — overlaps cover */}
            <div className="-mt-14 shrink-0 relative z-10">
              <div className="h-20 w-20 rounded-full ring-4 ring-white shadow-sm bg-white overflow-hidden">
                {profile.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt={profile.displayName}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full bg-primary/5 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary select-none">
                      {profile.displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons — top right of white area */}
            <div className="flex items-center gap-2 mt-2 flex-wrap justify-end">
              <Link
                href={`${publicBase}/${profile.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 bg-white text-gray-600 rounded-xl text-xs font-medium hover:border-gray-300 hover:text-gray-800 transition-colors"
              >
                <FiExternalLink className="h-3.5 w-3.5" />
                View profile
              </Link>
              <Link
                href={`${base}/profile`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 bg-white text-gray-600 rounded-xl text-xs font-medium hover:border-gray-300 hover:text-gray-800 transition-colors"
              >
                <FiEdit2 className="h-3.5 w-3.5" />
                Edit profile
              </Link>
              <NewPlanButton
                locale={locale}
                destinations={destinations}
                defaultDestinationId={profile.destination?.id}
                label="+ New plan"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors"
              />
            </div>
          </div>

          {/* Identity */}
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900 leading-tight">{profile.displayName}</h1>
              {profile.isVerified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                  ✓ Verified
                </span>
              )}
            </div>
            {profile.tagline && (
              <p className="text-sm text-gray-500 leading-relaxed">{profile.tagline}</p>
            )}
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-4 flex-wrap mt-2.5 text-xs text-gray-400">
            {profile.destination && (
              <span className="flex items-center gap-1">
                <FiMapPin className="h-3 w-3 shrink-0" />
                {profile.destination.city}, {profile.destination.country}
              </span>
            )}
            {profile.languages.length > 0 && (
              <span>{profile.languages.join(" · ")}</span>
            )}
            {profile.experienceYears != null && profile.experienceYears > 0 && (
              <span>{profile.experienceYears} yrs experience</span>
            )}
          </div>

          {/* Specialization chips */}
          {profile.specializations.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {profile.specializations.map((s) => (
                <span
                  key={s}
                  className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full"
                >
                  {SPEC_LABELS[s] ?? s.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-5 flex-wrap mt-4 pt-4 border-t border-gray-100 text-sm">
            <div>
              <span className="font-bold text-gray-900">{publishedPlans.length}</span>
              <span className="text-gray-400 ml-1">plans</span>
            </div>
            <div>
              <span className="font-bold text-gray-900">{totalViews.toLocaleString()}</span>
              <span className="text-gray-400 ml-1">views</span>
            </div>
            <div>
              <span className="font-bold text-gray-900">{totalPurchases.toLocaleString()}</span>
              <span className="text-gray-400 ml-1">trips planned</span>
            </div>
            {avgRating && (
              <div className="flex items-center gap-1">
                <FiStar className="h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0" />
                <span className="font-bold text-gray-900">{avgRating}</span>
                <span className="text-gray-400">({reviews.length})</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Onboarding checklist ─────────────────────────────────── */}
      {!allOnboardingDone && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">Get ready to publish</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {onboardingSteps.filter((s) => s.done).length} of {onboardingSteps.length} steps complete
              </p>
            </div>
            {/* Progress bar */}
            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(onboardingSteps.filter((s) => s.done).length / onboardingSteps.length) * 100}%` }}
              />
            </div>
          </div>
          <div className="space-y-2">
            {onboardingSteps.map((step, i) => (
              <Link
                key={step.id}
                href={step.done ? "#" : step.href}
                className={`flex items-center gap-4 p-3.5 rounded-xl border transition-colors ${
                  step.done
                    ? "border-gray-100 bg-gray-50 cursor-default opacity-60 pointer-events-none"
                    : "border-gray-200 bg-white hover:border-primary/30 hover:bg-primary/2"
                }`}
              >
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  step.done ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"
                }`}>
                  {step.done ? "✓" : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${step.done ? "text-gray-400 line-through" : "text-gray-800"}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{step.sublabel}</p>
                </div>
                {!step.done && <FiArrowRight className="h-4 w-4 text-gray-300 shrink-0" />}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Activity tiles ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Custom Requests */}
        <Link
          href={`${base}/requests`}
          className={`group relative bg-white border rounded-2xl p-5 hover:shadow-md transition-all flex flex-col gap-4 ${
            pendingRequests > 0 ? "border-primary/25" : "border-gray-100"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <FiInbox className="h-5 w-5 text-indigo-600" />
            </div>
            {pendingRequests > 0 && (
              <span className="h-6 min-w-6 px-1.5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                {pendingRequests}
              </span>
            )}
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{pendingRequests}</p>
            <p className="text-sm font-medium text-gray-700 mt-0.5">Custom Requests</p>
            <p className={`text-xs mt-1 ${pendingRequests > 0 ? "text-primary font-medium" : "text-gray-400"}`}>
              {pendingRequests > 0 ? `${pendingRequests} awaiting your response` : "No pending requests"}
            </p>
          </div>
          <FiArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors self-end" />
        </Link>

        {/* Messages */}
        <Link
          href={`${base}/messages`}
          className={`group relative bg-white border rounded-2xl p-5 hover:shadow-md transition-all flex flex-col gap-4 ${
            unreadMessages > 0 ? "border-teal-200" : "border-gray-100"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center">
              <FiMessageCircle className="h-5 w-5 text-teal-600" />
            </div>
            {unreadMessages > 0 && (
              <span className="h-6 min-w-6 px-1.5 bg-teal-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadMessages}
              </span>
            )}
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{unreadMessages}</p>
            <p className="text-sm font-medium text-gray-700 mt-0.5">Messages</p>
            <p className={`text-xs mt-1 ${unreadMessages > 0 ? "text-teal-700 font-medium" : "text-gray-400"}`}>
              {unreadMessages > 0 ? `${unreadMessages} unread message${unreadMessages !== 1 ? "s" : ""}` : "No new messages"}
            </p>
          </div>
          <FiArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors self-end" />
        </Link>

        {/* Earnings */}
        <Link
          href={`${base}/earnings`}
          className="group bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col gap-4"
        >
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <FiTrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {totalEarned > 0 ? `${totalEarned.toLocaleString()}` : "—"}
              {totalEarned > 0 && <span className="text-base font-semibold text-gray-500 ml-1">TND</span>}
            </p>
            <p className="text-sm font-medium text-gray-700 mt-0.5">Earnings</p>
            <p className="text-xs text-gray-400 mt-1">
              {totalEarned > 0 ? "Total earned to date" : "No earnings yet"}
            </p>
          </div>
          <FiArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors self-end" />
        </Link>
      </div>

      {/* ── Bottom: Recent Plans + Recent Reviews ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Plans */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="font-semibold text-gray-800 text-sm">My Plans</h2>
              <p className="text-xs text-gray-400 mt-0.5">{plans.length} total</p>
            </div>
            <Link
              href={`${base}/plans`}
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              View all <FiArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {plans.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <FiBookOpen className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 font-medium">No plans yet</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">Create your first plan to start attracting travelers.</p>
              <NewPlanButton
                locale={locale}
                destinations={destinations}
                defaultDestinationId={profile.destination?.id}
                label="Create first plan"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors"
              />
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {plans.slice(0, 6).map((plan) => (
                <li key={plan.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  {/* Icon */}
                  <div className="h-8 w-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                    <FaCompass className="h-3.5 w-3.5 text-primary" />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate leading-tight">
                      {plan.title ?? `${plan.duration}-Day Plan`}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                      <span>{plan.duration}d</span>
                      <span className="text-gray-200">·</span>
                      <span>{plan.destination?.city ?? "—"}</span>
                      <span className="text-gray-200">·</span>
                      <span className="flex items-center gap-0.5">
                        <FiEye className="h-3 w-3" /> {plan.viewCount}
                      </span>
                    </p>
                  </div>

                  {/* Status + edit */}
                  <div className="flex items-center gap-2 shrink-0">
                    <PlanStatusPill isPublic={plan.isPublic} status={plan.moderationStatus} />
                    <Link
                      href={`/${locale}/planner/${plan.id}/edit`}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Edit
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Reviews */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="font-semibold text-gray-800 text-sm">Recent Reviews</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {reviews.length > 0 ? `${reviews.length} total${avgRating ? ` · ★ ${avgRating} avg` : ""}` : "No reviews yet"}
              </p>
            </div>
            {reviews.length > 0 && (
              <Link
                href={`${base}/reviews`}
                className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
              >
                View all <FiArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          {recentReviews.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-3">
                <FiStar className="h-4 w-4 text-amber-400" />
              </div>
              <p className="text-sm text-gray-500 font-medium">No reviews yet</p>
              <p className="text-xs text-gray-400 mt-1">Reviews will appear here once travelers use your plans.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentReviews.map((review) => (
                <li key={review.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <FiStar
                          key={i}
                          className={`h-3 w-3 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">{review.comment}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1.5">{review.user?.name ?? "Anonymous"}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
