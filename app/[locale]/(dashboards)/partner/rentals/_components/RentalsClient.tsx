"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { FiPlus, FiExternalLink, FiSearch } from "react-icons/fi";
import { TbCar } from "react-icons/tb";
import { PLATFORM_CURRENCY } from "@/lib/utils/constants";
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from "@/components/ui/select";

const RENTAL_TYPES = ["CAR", "MOTORBIKE", "SCOOTER", "BICYCLE", "BOAT", "QUAD", "BUGGY", "JET_SKI", "OTHER"] as const;

type Rental = {
  id:          string;
  slug:        string;
  title:       string;
  type:        string;
  status:      string;
  pricePerDay: number;
  brand:       string | null;
  model:       string | null;
  destination: { city: string } | null;
  images:      { url: string }[];
  _count:      { reservations: number };
};

export function RentalsClient({ rentals, total }: { rentals: Rental[]; total: number }) {
  const params  = useParams();
  const locale  = params.locale as string;
  const base    = `/${locale}/partner/rentals`;
  const t  = useTranslations("PartnerDashboard.rentals");
  const tw = useTranslations("PartnerRentals.wizard");

  const [search,     setSearch]     = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const filtered = rentals.filter((r) => {
    const matchesSearch = !search.trim() || r.title.toLowerCase().includes(search.toLowerCase());
    const matchesType   = !typeFilter || r.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <>
      {/* Toolbar */}
      <div className="space-y-2.5">
        {/* Row 1 — count + new button */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-gray-400">
            {filtered.length} / {total} {t(total === 1 ? "countSingle" : "countPlural")}
          </p>
          <Link
            href={`${base}/new`}
            className="flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors shrink-0"
          >
            <FiPlus className="h-4 w-4" />
            {t("newRental")}
          </Link>
        </div>
        {/* Row 2 — search + type filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "")}>
            <SelectTrigger className="w-[150px] shrink-0">
              <span className={typeFilter ? "text-gray-800" : "text-gray-400"}>
                {typeFilter ? tw(`type.types.${typeFilter as "CAR"}.label`) : t("filterAll")}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t("filterAll")}</SelectItem>
              {RENTAL_TYPES.map((v) => (
                <SelectItem key={v} value={v}>{tw(`type.types.${v}.label`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Empty state */}
      {rentals.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl px-6 py-16 text-center space-y-3">
          <TbCar className="h-10 w-10 text-gray-300 mx-auto" />
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
          {filtered.map((r) => (
            <div
              key={r.id}
              className="relative bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow group"
            >
              {/* Stretched link */}
              <Link
                href={`${base}/${r.slug}`}
                className="absolute inset-0 z-10 rounded-2xl"
                aria-label={t("card.editLabel", { name: r.title })}
              />

              {/* Image */}
              <div className="relative h-44 bg-gray-100">
                {r.images[0] ? (
                  <Image
                    src={r.images[0].url}
                    alt={r.title}
                    fill
                    className="object-cover group-hover:brightness-95 transition-[filter]"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-2">
                    <TbCar className="h-8 w-8 text-gray-300" />
                    <span className="text-xs text-gray-400">{t("card.noPhotos")}</span>
                  </div>
                )}

                {/* Status chip — only when not ACTIVE */}
                {r.status !== "ACTIVE" && (
                  <div className={`absolute bottom-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-lg ${
                    r.status === "DRAFT"
                      ? "bg-gray-800/70 text-white"
                      : "bg-orange-500/80 text-white"
                  }`}>
                    {t(`status.${r.status.toLowerCase()}`)}
                  </div>
                )}

                {/* External link — z-20 sits above stretched link */}
                <a
                  href={`/${locale}/transport/rentals/${r.slug}`}
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
                <h3 className="font-semibold text-gray-800 truncate">{r.title}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                  <span className="bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                    {tw(`type.types.${r.type}.label`)}
                  </span>
                  {(r.brand || r.model) && (
                    <span>{[r.brand, r.model].filter(Boolean).join(" · ")}</span>
                  )}
                  {r.destination && <span>{r.destination.city}</span>}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                  <span className="font-semibold text-gray-900 text-sm">{r.pricePerDay} {PLATFORM_CURRENCY}/day</span>
                  <span>{t("card.bookings", { count: r._count.reservations })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
