"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { HiViewGrid } from "react-icons/hi";
import { BiSolidBuildingHouse } from "react-icons/bi";
import { IoRestaurant } from "react-icons/io5";
import { FiBarChart2 } from "react-icons/fi";

export function BecomePartnerBanner() {
  const t      = useTranslations("HomePage.info");
  const locale = useLocale();

  const benefits = [
    t("partners.benefit1"),
    t("partners.benefit2"),
    t("partners.benefit3"),
    t("partners.benefit4"),
  ];

  const stats = [
    { icon: <HiViewGrid className="w-5 h-5 text-white/60" />,        value: "50+", label: t("partners.statActivities") },
    { icon: <BiSolidBuildingHouse className="w-5 h-5 text-white/60" />, value: "20+", label: t("partners.statStays") },
    { icon: <IoRestaurant className="w-5 h-5 text-white/60" />,      value: "30+", label: t("partners.statRestaurants") },
    { icon: <FiBarChart2 className="w-5 h-5 text-white/60" />,       value: "6",   label: t("partners.statDestinations") },
  ];

  return (
    <div className="rounded-2xl overflow-hidden bg-primary">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left — copy + CTAs */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          <span className="text-xs font-semibold text-blue-300 uppercase tracking-widest mb-3">
            {t("partners.eyebrow")}
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 leading-tight">
            {t("partners.title")}
          </h2>
          <p className="text-white/65 text-sm leading-relaxed mb-7 max-w-md">
            {t("partners.description")}
          </p>

          <ul className="space-y-2.5 mb-8">
            {benefits.map((b, i) => (
              <li key={i} className="flex items-center gap-2.5 text-sm text-white/80">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 shrink-0">
                  <Check className="h-3 w-3 text-white" strokeWidth={2.5} />
                </span>
                {b}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-3">
            <Link href={`/${locale}/become-partner/apply`}>
              <Button className="bg-white text-primary hover:bg-white/90 rounded-full px-6 font-semibold">
                {t("partners.joinButton")}
              </Button>
            </Link>
            <Link href={`/${locale}/partners`}>
              <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 rounded-full px-6">
                {t("partners.learnButton")}
              </Button>
            </Link>
          </div>
        </div>

        {/* Right — stat tiles */}
        <div className="bg-white/5 p-8 sm:p-12 flex items-center">
          <div className="grid grid-cols-2 gap-4 w-full">
            {stats.map((s, i) => (
              <div key={i} className="bg-white/10 rounded-2xl p-5">
                <div className="mb-2">{s.icon}</div>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-white/55 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
