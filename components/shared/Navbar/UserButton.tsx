"use client";

import { useSession, signOut } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale, useTranslations } from "next-intl";
import {
  CalendarDays,
  Heart,
  LogOut,
  MessageSquare,
  Settings,
  ShoppingBag,
  User,
  LayoutDashboard,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Role chip colours (labels injected from translations at render time)
const ROLE_STYLES: Record<string, { className: string }> = {
  ADMIN:   { className: "bg-red-100 text-red-700" },
  PARTNER: { className: "bg-blue-100 text-blue-700" },
  AGENT:   { className: "bg-emerald-100 text-emerald-700" },
};

type NavItem = {
  icon: React.ReactNode;
  label: string;
  href: string;
};

function MenuItem({ icon, label, href, nav }: NavItem & { nav: (href: string) => void }) {
  return (
    <button
      onClick={() => nav(href)}
      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
    >
      <span className="text-gray-400 group-hover:text-primary transition-colors shrink-0">
        {icon}
      </span>
      <span className="flex-1 text-left">{label}</span>
      <ChevronRight className="h-3 w-3 text-gray-300 group-hover:text-gray-400 transition-colors" />
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pt-1 pb-0.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
      {children}
    </p>
  );
}

function Divider() {
  return <div className="my-1 border-t border-gray-100" />;
}

export function UserButton() {
  const { data: session } = useSession();
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("UserMenu");

  if (!session?.user) return null;

  const user = session.user;
  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "U";

  const role = (user as any).role as string;
  const roleStyle = ROLE_STYLES[role];
  const roleLabels: Record<string, string> = {
    ADMIN:   t("roleAdmin"),
    PARTNER: t("rolePartner"),
    AGENT:   t("roleAgent"),
  };

  // A user may hold multiple roles in the future;
  // for now derive each dashboard independently so ADMIN sees all three
  const isAdmin   = role === "ADMIN";
  const isPartner = role === "PARTNER" || isAdmin;
  const isAgent   = role === "AGENT"   || isAdmin;
  const hasDashboard = isAdmin || isPartner || isAgent;

  const nav = (path: string) => router.push(`/${locale}${path}`);

  const userItems: NavItem[] = [
    { icon: <CalendarDays className="h-4 w-4" />, label: t("myBookings"), href: "/bookings" },
    { icon: <MessageSquare className="h-4 w-4" />, label: t("myReviews"),  href: "/reviews" },
    { icon: <ShoppingBag   className="h-4 w-4" />, label: t("myOrders"),   href: "/orders" },
    { icon: <Heart         className="h-4 w-4" />, label: t("wishlist"),    href: "/wishlist" },
    { icon: <User          className="h-4 w-4" />, label: t("profile"),     href: "/profile" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-9 h-9 rounded-xl flex items-center justify-center hover:border-primary/50 hover:bg-gray-50 transition-colors cursor-pointer">
        <Avatar className="h-7 w-7">
          <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
          <AvatarFallback className="text-xs bg-primary text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-60 p-2 rounded-2xl shadow-lg border border-gray-100"
      >
        {/* ── Profile header ── */}
        <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
            <AvatarFallback className="text-sm bg-primary text-white font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
              {user.name}
            </p>
            <p className="text-xs text-gray-400 truncate leading-tight mt-0.5">
              {user.email}
            </p>
            {roleStyle && (
              <span className={cn("inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md leading-none", roleStyle.className)}>
                {roleLabels[role]}
              </span>
            )}
          </div>
        </div>

        <Divider />

        {/* ── User links ── */}
        <SectionLabel>{t("accountSection")}</SectionLabel>
        {userItems.map((item) => (
          <MenuItem key={item.href} {...item} nav={nav} />
        ))}

        {/* ── Dashboard links ── */}
        {hasDashboard && (
          <>
            <Divider />
            <SectionLabel>{t("dashboardsSection")}</SectionLabel>
            {isAdmin && (
              <MenuItem
                icon={<Settings className="h-4 w-4" />}
                label={t("adminDashboard")}
                href="/admin"
                nav={nav}
              />
            )}
            {isPartner && (
              <MenuItem
                icon={<LayoutDashboard className="h-4 w-4" />}
                label={t("partnerDashboard")}
                href="/partner"
                nav={nav}
              />
            )}
            {isAgent && (
              <MenuItem
                icon={<LayoutDashboard className="h-4 w-4" />}
                label={t("agentDashboard")}
                href="/agent"
                nav={nav}
              />
            )}
          </>
        )}

        <Divider />

        {/* ── Sign out ── */}
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>{t("signOut")}</span>
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
