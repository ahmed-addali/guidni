"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import {
  FiGrid, FiCalendar, FiStar, FiActivity, FiHome, FiUser,
  FiTrendingUp, FiLogOut, FiChevronLeft, FiChevronRight, FiMenu, FiX, FiAward,
  FiMessageCircle, FiInbox,
} from "react-icons/fi";
import { IoRestaurant } from "react-icons/io5";
import { TbCar, TbRoute } from "react-icons/tb";
import { FaStore, FaCompass } from "react-icons/fa6";
import { cn } from "@/lib/utils";

const MAIN_ITEMS = [
  { key: "overview",  icon: FiGrid,     path: "" },
  { key: "bookings",  icon: FiCalendar, path: "/bookings" },
] as const;

const BUSINESS_ITEMS = [
  { key: "activities",  icon: FiActivity,   path: "/activities",  category: "activities" },
  { key: "stays",       icon: FiHome,       path: "/stays",       category: "stays" },
  { key: "restaurants", icon: IoRestaurant, path: "/restaurants", category: "restaurant" },
  { key: "rentals",     icon: TbCar,        path: "/rentals",     category: "rentals" },
  { key: "transfers",   icon: TbRoute,      path: "/transfers",   category: "transfers" },
  { key: "shops",       icon: FaStore,      path: "/shops",       category: "shop" },
  { key: "guide",           icon: FaCompass,         path: "/guide",           category: "guide" },
  { key: "guide-requests",  icon: FiInbox,           path: "/guide/requests",  category: "guide" },
  { key: "guide-messages",  icon: FiMessageCircle,   path: "/guide/messages",  category: "guide" },
  { key: "guide-earnings",  icon: FiTrendingUp,      path: "/guide/earnings",  category: "guide" },
] as const;

const OTHER_ITEMS = [
  { key: "reviews",  icon: FiStar,       path: "/reviews" },
  { key: "badges",   icon: FiAward,      path: "/badges" },
  { key: "earnings", icon: FiTrendingUp, path: "/earnings" },
  { key: "profile",  icon: FiUser,       path: "/profile" },
] as const;

interface Props {
  businessName: string;
  categories: string[];
  profileImage?: string | null;
}

export function PartnerSidebar({ businessName, categories, profileImage }: Props) {
  const pathname = usePathname();
  const locale   = useLocale();
  const base     = `/${locale}/partner`;
  const t        = useTranslations("PartnerDashboard.sidebar");

  const [isCollapsed,  setIsCollapsed]  = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("partner-sidebar-collapsed");
    if (stored === "true") setIsCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("partner-sidebar-collapsed", String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  function isActive(path: string) {
    const href = `${base}${path}`;
    return path === "" ? pathname === href : pathname.startsWith(href);
  }

  const activeBusinessItems = BUSINESS_ITEMS.filter((item) =>
    categories.includes(item.category)
  );

  function renderItems(items: readonly { key: string; icon: React.ElementType; path: string }[], collapsed: boolean) {
    return items.map(({ key, icon: Icon, path }) => {
      const active = isActive(path);
      const label  = t(`links.${key}` as Parameters<typeof t>[0]);
      return (
        <Link
          key={key}
          href={`${base}${path}`}
          title={collapsed ? label : undefined}
          className={cn(
            "flex items-center rounded-xl text-sm font-medium transition-colors",
            collapsed ? "p-3 justify-center" : "px-3 py-2.5 gap-3",
            active
              ? "bg-primary/10 text-primary"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          )}
        >
          <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-gray-400")} />
          {!collapsed && <span>{label}</span>}
        </Link>
      );
    });
  }

  const navContent = (collapsed: boolean) => (
    <div className="flex-1 flex flex-col min-h-0">
      <nav className="flex-1 min-h-0 overflow-y-auto py-4 px-3 space-y-5">
        <div>
          {!collapsed && (
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 px-3">
              {t("groups.main")}
            </p>
          )}
          <div className="space-y-0.5">{renderItems(MAIN_ITEMS, collapsed)}</div>
        </div>

        {activeBusinessItems.length > 0 && (
          <div>
            {!collapsed && (
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 px-3">
                {t("groups.myBusiness")}
              </p>
            )}
            <div className="space-y-0.5">{renderItems(activeBusinessItems, collapsed)}</div>
          </div>
        )}

        <div>
          {!collapsed && (
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 px-3">
              {t("groups.other")}
            </p>
          )}
          <div className="space-y-0.5">{renderItems(OTHER_ITEMS, collapsed)}</div>
        </div>
      </nav>

      <div className={cn("flex-shrink-0 border-t border-gray-100 py-3 px-3", collapsed && "flex justify-center")}>
        <Link
          href={`/${locale}`}
          title={collapsed ? t("links.exitToSite") : undefined}
          className={cn(
            "flex items-center rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors",
            collapsed ? "p-3 justify-center" : "px-3 py-2.5 gap-3"
          )}
        >
          <FiLogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{t("links.exitToSite")}</span>}
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setIsMobileOpen(false)} />
      )}

      <button
        className="lg:hidden fixed top-[4.5rem] left-3 z-30 p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
        onClick={() => setIsMobileOpen((v) => !v)}
        aria-label={t("toggleMenu")}
      >
        {isMobileOpen ? <FiX className="h-4 w-4" /> : <FiMenu className="h-4 w-4" />}
      </button>

      <aside className={cn(
        "lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 shadow-xl transition-transform duration-300 flex flex-col",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex-shrink-0 flex items-center justify-between px-4 h-16 border-b border-gray-100">
          <div className="flex items-center gap-3 min-w-0">
            {profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profileImage} alt={businessName} className="h-8 w-8 rounded-full object-cover shrink-0" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">{businessName.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">{t("partner")}</p>
              <p className="text-sm font-semibold text-gray-800 truncate max-w-[130px]">{businessName}</p>
            </div>
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="p-2 hover:bg-gray-50 rounded-lg transition-colors shrink-0">
            <FiX className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        {navContent(false)}
      </aside>

      <aside className={cn(
        "hidden lg:flex flex-col bg-white border-r border-gray-100 sticky h-[calc(100vh-4rem)] shrink-0 transition-all duration-300 relative",
        isCollapsed ? "w-16" : "w-56"
      )}>
        {!isCollapsed && (
          <div className="flex-shrink-0 flex items-center gap-3 px-4 py-4 border-b border-gray-100">
            {profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profileImage} alt={businessName} className="h-8 w-8 rounded-full object-cover shrink-0" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">{businessName.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">{t("partner")}</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5 truncate">{businessName}</p>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsCollapsed((v) => !v)}
          className="absolute -right-3 top-6 z-10 h-6 w-6 bg-white border border-gray-200 shadow-md hover:bg-gray-50 transition-all rounded-md hidden lg:flex items-center justify-center"
          aria-label={isCollapsed ? t("expandSidebar") : t("collapseSidebar")}
        >
          {isCollapsed
            ? <FiChevronRight className="h-3 w-3 text-gray-500" />
            : <FiChevronLeft  className="h-3 w-3 text-gray-500" />
          }
        </button>

        {navContent(isCollapsed)}
      </aside>
    </>
  );
}
