"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { useState, useEffect } from "react";
import {
  FiGrid,
  FiUsers,
  FiCalendar,
  FiBriefcase,
  FiMapPin,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
  FiMenu,
  FiX,
  FiAward,
  FiTrendingUp,
  FiActivity,
} from "react-icons/fi";
import { HiViewGrid } from "react-icons/hi";
import { FaTicket, FaStore, FaCompass, FaUserSecret, FaCar } from "react-icons/fa6";
import { IoRestaurant } from "react-icons/io5";
import { cn } from "@/lib/utils";

const groups = [
  {
    label: "Main",
    items: [
      { key: "overview",  icon: FiGrid,      path: "" },
      { key: "bookings",  icon: FiCalendar,  path: "/bookings" },
    ],
  },
  {
    label: "Content",
    items: [
      { key: "activities",   icon: FiActivity,    path: "/activities" },
      { key: "stays",        icon: HiViewGrid,    path: "/stays" },
      { key: "restaurants",  icon: IoRestaurant,  path: "/restaurants" },
      { key: "listings",     icon: HiViewGrid,    path: "/listings" },
      { key: "passes",        icon: FaTicket,    path: "/passes" },
      { key: "destinations",  icon: FiMapPin,    path: "/destinations" },
      { key: "badges",        icon: FiAward,     path: "/badges" },
    ],
  },
  {
    label: "Shops",
    items: [
      { key: "shops", icon: FaStore, path: "/shops" },
    ],
  },
  {
    label: "Transport",
    items: [
      { key: "transport", icon: FaCar, path: "/transport" },
    ],
  },
  {
    label: "Guides",
    items: [
      { key: "guides",            icon: FaCompass,    path: "/guides" },
      { key: "guide-plans",       icon: FaCompass,    path: "/guide-plans" },
      { key: "guide-purchases",   icon: FiTrendingUp, path: "/guide-purchases" },
      { key: "planner",           icon: FiActivity,   path: "/planner" },
    ],
  },
  {
    label: "Management",
    items: [
      { key: "users",    icon: FiUsers,       path: "/users" },
      { key: "partners", icon: FiBriefcase,   path: "/partners" },
      { key: "agents",            icon: FaUserSecret, path: "/agents" },
      { key: "agents-payouts",   icon: FiTrendingUp, path: "/agents/payouts" },
      { key: "agents-referrals", icon: FiUsers,      path: "/agents/referrals" },
    ],
  },
] as const;

const labels: Record<string, string> = {
  overview:     "Overview",
  bookings:     "Bookings",
  activities:   "Activities",
  stays:        "Stays",
  restaurants:  "Restaurants",
  listings:     "Listings",
  passes:       "Passes",
  destinations: "Destinations",
  badges:       "Badges",
  shops:        "Shops",
  transport:    "Transport",
  guides:       "Guides",
  "guide-plans":       "Guide Plans",
  "guide-purchases":   "Plan Purchases",
  planner:             "Planner Stats",
  users:        "Users",
  partners:     "Partners",
  agents:              "Local Agents",
  "agents-payouts":    "Agent Payouts",
  "agents-referrals":  "Partner Referrals",
};

export function AdminSidebar() {
  const pathname = usePathname();
  const locale   = useLocale();
  const base     = `/${locale}/admin`;

  const [isCollapsed,  setIsCollapsed]  = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Persist collapse state
  useEffect(() => {
    const stored = localStorage.getItem("admin-sidebar-collapsed");
    if (stored === "true") setIsCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("admin-sidebar-collapsed", String(isCollapsed));
  }, [isCollapsed]);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  function isActive(path: string) {
    const href = `${base}${path}`;
    if (path === "") return pathname === href;
    // Exact match for leaf routes to avoid parent highlighting child paths
    const isLeaf = groups.some((g) =>
      g.items.some((item) => item.path !== path && item.path.startsWith(path + "/"))
    );
    return isLeaf ? pathname === href : pathname.startsWith(href);
  }

  const navContent = (collapsed: boolean) => (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Nav groups — scrollable */}
      <nav className="flex-1 min-h-0 overflow-y-auto py-4 px-3 space-y-5">
        {groups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 px-3">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ key, icon: Icon, path }) => {
                const active = isActive(path);
                return (
                  <Link
                    key={key}
                    href={`${base}${path}`}
                    title={collapsed ? labels[key] : undefined}
                    className={cn(
                      "flex items-center rounded-xl text-sm font-medium transition-colors",
                      collapsed ? "p-3 justify-center" : "px-3 py-2.5 gap-3",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-gray-400")} />
                    {!collapsed && <span>{labels[key]}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Exit — always pinned to the bottom */}
      <div className={cn(
        "flex-shrink-0 border-t border-gray-100 py-3 px-3",
        collapsed && "flex justify-center"
      )}>
        <Link
          href={`/${locale}`}
          title={collapsed ? "Exit to site" : undefined}
          className={cn(
            "flex items-center rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors",
            collapsed ? "p-3 justify-center" : "px-3 py-2.5 gap-3"
          )}
        >
          <FiLogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Exit to site</span>}
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile toggle button */}
      <button
        className="lg:hidden fixed top-[4.5rem] left-3 z-30 p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
        onClick={() => setIsMobileOpen((v) => !v)}
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <FiX className="h-4 w-4" /> : <FiMenu className="h-4 w-4" />}
      </button>

      {/* Mobile drawer */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 shadow-xl transition-transform duration-300 flex flex-col",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex-shrink-0 flex items-center justify-between px-4 h-16 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Admin</p>
            <p className="text-sm font-semibold text-gray-800">Platform Control</p>
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <FiX className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        {navContent(false)}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-white border-r border-gray-100 sticky h-[calc(100vh-4rem)] shrink-0 transition-all duration-300 relative",
          isCollapsed ? "w-16" : "w-56"
        )}
      >
        {/* Section label — only when expanded */}
        {!isCollapsed && (
          <div className="flex-shrink-0 px-5 py-4 border-b border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Admin</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">Platform Control</p>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setIsCollapsed((v) => !v)}
          className="absolute -right-3 top-6 z-10 h-6 w-6 bg-white border border-gray-200 shadow-md hover:bg-gray-50 transition-all rounded-md hidden lg:flex items-center justify-center"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
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
