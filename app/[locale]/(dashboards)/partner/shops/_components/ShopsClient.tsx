"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { FiPlus, FiStar, FiExternalLink, FiSearch, FiPackage } from "react-icons/fi";
import { FaStore } from "react-icons/fa6";
import { BookOpen } from "lucide-react";
import { RequestReviewDialog } from "@/components/partner/RequestReviewDialog";

type Shop = {
  id:                  string;
  slug:                string;
  name:                string;
  category:            string;
  status:              string;
  isOpen:              boolean;
  coverPhoto:          string | null;
  nbReviews:           number;
  isReviewedByGuidni:  boolean;
  destination:         { city: string; country: string } | null;
  images:              { id: string; url: string }[];
  _count:              { products: number; orders: number };
};

export function ShopsClient({ shops, total }: { shops: Shop[]; total: number }) {
  const params = useParams();
  const locale = params.locale as string;
  const base   = `/${locale}/partner/shops`;
  const t      = useTranslations("PartnerDashboard.shops");
  const tDialog = useTranslations("Components.requestReviewDialog");

  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? shops.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    : shops;

  const unreviewedCount = shops.filter((s) => !s.isReviewedByGuidni).length;

  return (
    <>
      {/* Guidni Review banner */}
      {shops.length > 0 && unreviewedCount > 0 && (
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
            listingId={shops.find((s) => !s.isReviewedByGuidni)!.id}
            relationType="SHOP"
            offerHint={tDialog("shopOfferHint")}
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
          {t("newShop")}
        </Link>
      </div>

      {/* Empty state */}
      {shops.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl px-6 py-16 text-center space-y-3">
          <FaStore className="h-10 w-10 text-gray-300 mx-auto" />
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
          {filtered.map((s) => {
            const imageUrl = s.coverPhoto ?? s.images[0]?.url ?? null;
            const location = s.destination
              ? `${s.destination.city}, ${s.destination.country}`
              : null;

            return (
              <div
                key={s.id}
                className="relative bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow group"
              >
                {/* Stretched link covers the whole card */}
                <Link
                  href={`${base}/${s.slug}`}
                  className="absolute inset-0 z-10 rounded-2xl"
                  aria-label={t("card.editLabel", { name: s.name })}
                />

                {/* Image */}
                <div className="relative h-44 bg-gray-100">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={s.name}
                      fill
                      className="object-cover group-hover:brightness-95 transition-[filter]"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-2">
                      <FaStore className="h-8 w-8 text-gray-300" />
                      <span className="text-xs text-gray-400">{t("card.noPhotos")}</span>
                    </div>
                  )}

                  {/* Open/closed chip */}
                  <span className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    s.isOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                  }`}>
                    {s.isOpen ? t("card.open") : t("card.closed")}
                  </span>

                  {/* Approval status badge (only when not ACTIVE) */}
                  {s.status !== "ACTIVE" && (
                    <div className={`absolute bottom-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-lg ${
                      s.status === "DRAFT"
                        ? "bg-gray-800/70 text-white"
                        : "bg-orange-500/80 text-white"
                    }`}>
                      {t(`status.${s.status.toLowerCase()}`)}
                    </div>
                  )}

                  {/* View public page — z-20 so it sits above the stretched card link */}
                  <a
                    href={`/${locale}/shops/${s.slug}`}
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
                  <h3 className="font-semibold text-gray-800 truncate">{s.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                    <span className="bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">{s.category}</span>
                    {location && <span>{location}</span>}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
                    <span className="flex items-center gap-1">
                      <FiPackage className="h-3 w-3" />
                      {t("card.products", { count: s._count.products })}
                    </span>
                    <span>{t("card.orders", { count: s._count.orders })}</span>
                    <span className="flex items-center gap-1">
                      <FiStar className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {s.nbReviews > 0 ? s.nbReviews : "—"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
