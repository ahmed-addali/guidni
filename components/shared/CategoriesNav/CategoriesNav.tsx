"use client";

import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { MaxWidthWrapper } from "@/components/shared/MaxWidthWrapper";
import { CategoryBox } from "./CategoryBox";
import { HiViewGrid } from "react-icons/hi";
import { BiSolidBuildingHouse } from "react-icons/bi";
import { IoRestaurant } from "react-icons/io5";
import { FaCartShopping, FaMapLocationDot, FaTicket } from "react-icons/fa6";
import { MdAutoAwesome } from "react-icons/md";
import { FaCarSide } from "react-icons/fa";
import { GuidniIcon } from "./GuidniIcon";
import { cn } from "@/lib/utils";

export function CategoriesNav() {
  const t = useTranslations("CategoriesNav");
  const pathname = usePathname();
  const locale = useLocale();

  // ── Only show on listing/index pages ────────────────────────────────────
  const listingPaths = new Set([
    `/${locale}`,
    `/${locale}/activities`,
    `/${locale}/stays`,
    `/${locale}/restaurants`,
    `/${locale}/passes`,
    `/${locale}/transport`,
    `/${locale}/transport/transfers`,
    `/${locale}/transport/rentals`,
    `/${locale}/destinations`,
    `/${locale}/planner`,
    `/${locale}/my-plans`,
    `/${locale}/planner/guides`,
    `/${locale}/planner/plans`,
    `/${locale}/shops`,
  ]);
  const isListingPage = listingPaths.has(pathname);


  // ── Categories ───────────────────────────────────────────────────────────
  const categories = [
    { icon: GuidniIcon,         label: t("home"),         route: `/${locale}`,              color: "text-blue-600", exactMatch: true },
    { icon: HiViewGrid,         label: t("activities"),   route: `/${locale}/activities`,   color: "text-blue-600" },
    { icon: BiSolidBuildingHouse, label: t("stays"),      route: `/${locale}/stays`,        color: "text-blue-600" },
    { icon: IoRestaurant,       label: t("restaurants"),  route: `/${locale}/restaurants`,  color: "text-blue-600" },
    { icon: FaTicket,           label: t("passes"),       route: `/${locale}/passes`,       color: "text-blue-600" },
    { icon: FaCarSide,          label: t("transport"),    route: `/${locale}/transport`,    color: "text-blue-600" },
    { icon: FaMapLocationDot,   label: t("destinations"), route: `/${locale}/destinations`, color: "text-blue-600" },
    { icon: MdAutoAwesome,      label: t("planner"),      route: `/${locale}/planner`,      color: "text-blue-600" },
    { icon: FaCartShopping,     label: t("shops"),        route: `/${locale}/shops`,        color: "text-blue-600" },
  ];

  const isSelected = (route: string, exactMatch?: boolean) => {
    if (exactMatch) return pathname === route;
    return pathname === route || pathname.startsWith(route + "/");
  };

  return (
    <>
      {/* ── Desktop: scroll-aware top bar ───────────────────────────────── */}
      <div
        className={cn(
          "hidden sm:block overflow-hidden",
          isListingPage ? "max-h-[80px]" : "max-h-0"
        )}
      >
        <div className="bg-white border-b border-gray-100 shadow-sm">
          <MaxWidthWrapper>
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex items-center justify-center w-fit mx-auto">
                {categories.map((cat) => (
                  <CategoryBox
                    key={cat.route}
                    icon={cat.icon}
                    label={cat.label}
                    route={cat.route}
                    color={cat.color}
                    variant="desktop"
                    selected={isSelected(cat.route, cat.exactMatch)}
                  />
                ))}
              </div>
            </div>
          </MaxWidthWrapper>
        </div>
      </div>

      {/* ── Mobile: fixed bottom tab bar (listing pages only) ──────────── */}
      {isListingPage && (
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex items-center w-fit mx-auto px-1">
            {categories.map((cat) => (
              <CategoryBox
                key={cat.route}
                icon={cat.icon}
                label={cat.label}
                route={cat.route}
                color={cat.color}
                variant="mobile"
                selected={isSelected(cat.route, cat.exactMatch)}
              />
            ))}
          </div>
        </div>
      </div>
      )}
    </>
  );
}
