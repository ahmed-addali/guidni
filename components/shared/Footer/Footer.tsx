"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { MaxWidthWrapper } from "@/components/shared/MaxWidthWrapper";
import { FaFacebook, FaInstagram, FaTiktok, FaYoutube } from "react-icons/fa";

export function Footer() {
  const t = useTranslations("Footer");
  const locale = useLocale();
  const isRtl = t("dir") === "rtl";

  const columns = [
    {
      title: t("explore"),
      links: [
        { name: t("djerba"),       href: `/${locale}/destinations/djerba` },
        { name: t("dubai"),        href: `/${locale}/destinations/dubai` },
        { name: t("destinations"), href: `/${locale}/destinations` },
        { name: t("attractions"),  href: `/${locale}/destinations` },
        { name: t("badges"),       href: `/${locale}/badges` },
      ],
    },
    {
      title: t("experiences"),
      links: [
        { name: t("activities"),  href: `/${locale}/activities` },
        { name: t("stays"),       href: `/${locale}/stays` },
        { name: t("restaurants"), href: `/${locale}/restaurants` },
        { name: t("passes"),      href: `/${locale}/passes` },
        { name: t("transport"),   href: `/${locale}/transport` },
        { name: t("shops"),       href: `/${locale}/shops` },
        { name: t("planner"),     href: `/${locale}/planner` },
      ],
    },
    {
      title: t("company"),
      links: [
        { name: t("about"),          href: `/${locale}/about` },
        { name: t("becomePartner"),   href: `/${locale}/become-partner` },
        { name: t("becomeAgent"),     href: `/${locale}/become-agent` },
        { name: t("agentLeaderboard"),href: `/${locale}/agents/leaderboard` },
        { name: t("blog"),           href: `/${locale}/blog` },
        { name: t("careers"),        href: `/${locale}/careers` },
      ],
    },
    {
      title: t("support"),
      links: [
        { name: t("faq"),        href: `/${locale}/faq` },
        { name: t("contact"),    href: `/${locale}/contact` },
        { name: t("howItWorks"), href: `/${locale}/how-it-works` },
        { name: t("terms"),      href: `/${locale}/terms` },
        { name: t("privacy"),    href: `/${locale}/privacy` },
        { name: t("cookies"),    href: `/${locale}/cookies` },
      ],
    },
  ];

  const socialLinks = [
    { icon: <FaFacebook className="w-4 h-4" />, href: "https://www.facebook.com/profile.php?id=61578036814669", label: "Facebook" },
    { icon: <FaInstagram className="w-4 h-4" />, href: "https://www.instagram.com/guidni.travel/", label: "Instagram" },
    { icon: <FaTiktok className="w-4 h-4" />, href: "#", label: "TikTok" },
    { icon: <FaYoutube className="w-4 h-4" />, href: "#", label: "YouTube" },
  ];

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-20">
      <MaxWidthWrapper className={isRtl ? "rtl" : ""}>

        {/* Top — logo + tagline + social */}
        <div className="pt-14 pb-10 flex flex-col items-center gap-4">
          <Link href={`/${locale}`} className="shrink-0">
            <Image
              src="/images/guidni-logo.png"
              alt="Guidni"
              width={120}
              height={44}
              className="h-10 w-auto object-contain"
            />
          </Link>
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            {t("tagline")}
          </p>
          <div className="flex gap-3 mt-1">
            {socialLinks.map((s) => (
              <Link
                key={s.label}
                href={s.href}
                aria-label={s.label}
                target={s.href.startsWith("http") ? "_blank" : undefined}
                rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-primary hover:border-primary/40 transition-colors"
              >
                {s.icon}
              </Link>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* Link columns — 2 cols on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12">
          {columns.map((col) => (
            <div key={col.title} className="space-y-3">
              <h4 className="font-semibold text-gray-900 text-xs uppercase tracking-wider">
                {col.title}
              </h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-gray-900 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="py-5 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Guidni. {t("rightsReserved")}
            </p>
            <div className="flex gap-5">
              {[
                { name: t("terms"),   href: `/${locale}/terms` },
                { name: t("privacy"), href: `/${locale}/privacy` },
                { name: t("cookies"), href: `/${locale}/cookies` },
              ].map((l) => (
                <Link
                  key={l.name}
                  href={l.href}
                  className="text-xs text-muted-foreground hover:text-gray-900 transition-colors"
                >
                  {l.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

      </MaxWidthWrapper>
    </footer>
  );
}
