"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { useState, useEffect } from "react";
import {
  FiGrid,
  FiSend,
  FiList,
  FiTrendingUp,
  FiUser,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
  FiMenu,
  FiX,
  FiUsers,
  FiGift,
} from "react-icons/fi";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { key: "overview",    icon: FiGrid,       path: "" },
  { key: "invitations", icon: FiList,       path: "/invitations" },
  { key: "earnings",    icon: FiTrendingUp, path: "/earnings" },
  { key: "referrals",   icon: FiUsers,      path: "/referrals" },
  { key: "points",      icon: FiGift,       path: "/points" },
  { key: "profile",     icon: FiUser,       path: "/profile" },
] as const;

const labels: Record<string, string> = {
  overview:    "Overview",
  invitations: "My Invitations",
  earnings:    "Earnings",
  referrals:   "Referrals",
  points:      "Points & Wallet",
  profile:     "Profile",
};

interface Props {
  displayName: string;
  pseudonym?:  string | null;
}

export function AgentSidebar({ displayName, pseudonym }: Props) {
  const pathname = usePathname();
  const locale   = useLocale();
  const base     = `/${locale}/agent`;

  const [isCollapsed,  setIsCollapsed]  = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("agent-sidebar-collapsed");
    if (stored === "true") setIsCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("agent-sidebar-collapsed", String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  function isActive(path: string) {
    const href = `${base}${path}`;
    return path === "" ? pathname === href : pathname.startsWith(href);
  }

  function renderItems(
    items: readonly { key: string; icon: React.ElementType; path: string }[],
    collapsed: boolean
  ) {
    return items.map(({ key, icon: Icon, path }) => {
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
    });
  }

  const navContent = (collapsed: boolean) => (
    <div className="flex-1 flex flex-col min-h-0">
      <nav className="flex-1 min-h-0 overflow-y-auto py-4 px-3 space-y-0.5">
        {renderItems(NAV_ITEMS, collapsed)}
      </nav>

      <div className="flex-shrink-0 border-t border-gray-100 py-3 px-3 space-y-0.5">
        <Link
          href={`${base}/new-invitation`}
          title={collapsed ? "Send Invitation" : undefined}
          className={cn(
            "flex items-center rounded-xl text-sm font-semibold transition-colors bg-primary text-white hover:bg-primary/90",
            collapsed ? "p-3 justify-center" : "px-3 py-2.5 gap-3"
          )}
        >
          <FiSend className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Send Invitation</span>}
        </Link>

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

  const headerContent = (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Local Agent</p>
      <p className="text-sm font-semibold text-gray-800 mt-0.5 truncate">
        {pseudonym ? `@${pseudonym}` : displayName}
      </p>
    </div>
  );

  return (
    <>
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

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
          {headerContent}
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
          "hidden lg:flex flex-col bg-white border-r border-gray-100 sticky top-0 h-[calc(100vh-4rem)] shrink-0 transition-all duration-300 relative",
          isCollapsed ? "w-16" : "w-56"
        )}
      >
        {!isCollapsed && (
          <div className="flex-shrink-0 px-5 py-4 border-b border-gray-100">
            {headerContent}
          </div>
        )}

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
