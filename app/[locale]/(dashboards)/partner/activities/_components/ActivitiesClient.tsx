"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { FiPlus, FiActivity, FiStar, FiExternalLink, FiSearch } from "react-icons/fi";
import { BookOpen } from "lucide-react";
import { RequestReviewDialog } from "@/components/partner/RequestReviewDialog";

type Activity = {
  id: string;
  slug: string;
  title: string;
  categories: string[];
  price: number;
  capacity: number;
  region: string;
  duration: string | null;
  status: string;
  nbReviews: number;
  note: string | null;
  images: { id: string; url: string }[];
  badges: { badgeKey: string }[];
  _count: { reservations: number };
};

export function ActivitiesClient({ activities, total }: { activities: Activity[]; total: number }) {
  const params = useParams();
  const locale = params.locale as string;
  const base   = `/${locale}/partner/activities`;
  const t      = useTranslations("PartnerDashboard.activities");
  const tDialog = useTranslations("Components.requestReviewDialog");

  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? activities.filter((a) => a.title.toLowerCase().includes(search.toLowerCase()))
    : activities;

  // Activities that don't yet have a REVIEWED_BY_GUIDNI badge
  const unreviewedCount = activities.filter(
    (a) => !a.badges.some((b) => b.badgeKey === "REVIEWED_BY_GUIDNI")
  ).length;

  return (
    <>
      {/* Guidni Review banner — shown when ≥1 activity has no review badge */}
      {activities.length > 0 && unreviewedCount > 0 && (
        <div className="flex items-center justify-between gap-4 bg-primary/5 border border-primary/15 rounded-2xl px-5 py-4">
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-800">
                {t("reviewBanner.title")}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {unreviewedCount === 1
                  ? t("reviewBanner.oneUnreviewed")
                  : t("reviewBanner.manyUnreviewed", { count: unreviewedCount })}{" "}
                {t("reviewBanner.hint")}
              </p>
            </div>
          </div>
          <RequestReviewDialog
            listingId={activities.find((a) => !a.badges.some((b) => b.badgeKey === "REVIEWED_BY_GUIDNI"))!.id}
            relationType="ACTIVITY"
            offerHint={tDialog("activityOfferHint")}
          />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <p className="text-sm text-gray-400 shrink-0">
          {filtered.length} / {total} {t(total === 1 ? "countSingle" : "countPlural")}
        </p>
        <Link
          href={`${base}/new`}
          className="flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors shrink-0"
        >
          <FiPlus className="h-4 w-4" />
          {t("newActivity")}
        </Link>
      </div>

      {/* Empty state */}
      {activities.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl px-6 py-16 text-center space-y-3">
          <FiActivity className="h-10 w-10 text-gray-300 mx-auto" />
          <p className="text-sm font-medium text-gray-500">{t("empty.title")}</p>
          <p className="text-xs text-gray-400">{t("empty.hint")}</p>
          <Link
            href={`${base}/new`}
            className="inline-flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors mt-2"
          >
            <FiPlus className="h-4 w-4" />
            {t("empty.cta")}
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl px-6 py-12 text-center space-y-2">
          <FiSearch className="h-8 w-8 text-gray-300 mx-auto" />
          <p className="text-sm font-medium text-gray-500">{t("searchEmpty.title", { search })}</p>
          <button onClick={() => setSearch("")} className="text-xs text-blue-600 hover:underline">
            {t("searchEmpty.clear")}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((a) => (
            <div
              key={a.id}
              className="relative bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow group"
            >
              {/*
                Stretched link pattern: the Link covers the whole card (z-10).
                The external link is a sibling <a> — NOT nested inside it — so no <a> inside <a>.
                The external link uses z-20 to sit above the stretched link.
              */}
              <Link
                href={`${base}/${a.slug}`}
                className="absolute inset-0 z-10 rounded-2xl"
                aria-label={t("card.editLabel", { title: a.title })}
              />

              {/* Image */}
              <div className="relative h-44 bg-gray-100">
                {a.images[0] ? (
                  <Image
                    src={a.images[0].url}
                    alt={a.title}
                    fill
                    className="object-cover group-hover:brightness-95 transition-[filter]"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-2">
                    <FiActivity className="h-8 w-8 text-gray-300" />
                    <span className="text-xs text-gray-400">{t("card.noPhotos")}</span>
                  </div>
                )}
                {/* Price chip */}
                <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-xs font-semibold px-2 py-1 rounded-lg text-gray-700">
                  {a.price.toLocaleString()} TND
                </div>
                {/* Status badge */}
                {a.status !== "ACTIVE" && (
                  <div className={`absolute bottom-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-lg ${
                    a.status === "DRAFT"
                      ? "bg-gray-800/70 text-white"
                      : "bg-orange-500/80 text-white"
                  }`}>
                    {t(`status.${a.status.toLowerCase()}`)}
                  </div>
                )}
                {/* View public page — z-20 so it sits above the stretched card link */}
                <a
                  href={`/${locale}/activities/${a.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={t("card.viewPublic")}
                  className="absolute top-2 right-2 z-20 bg-white/90 backdrop-blur-sm p-1.5 rounded-lg text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <FiExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              {/* Body */}
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-gray-800 truncate">{a.title}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                  {a.categories.slice(0, 2).map((cat) => (
                    <span key={cat} className="bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">{cat}</span>
                  ))}
                  {a.categories.length > 2 && (
                    <span className="bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">+{a.categories.length - 2}</span>
                  )}
                  <span>{a.region}</span>
                  {a.duration && <span>{a.duration}</span>}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
                  <span>{t("card.bookings", { count: a._count.reservations })}</span>
                  <span className="flex items-center gap-1">
                    <FiStar className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {a.note ?? "—"} ({a.nbReviews})
                  </span>
                  <span>Cap: {a.capacity}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
