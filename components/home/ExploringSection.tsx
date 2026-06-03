"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IoMap, IoRestaurant, IoBusiness, IoWallet } from "react-icons/io5";
import { FaMagic, FaLandmark } from "react-icons/fa";
import { TiWeatherPartlySunny } from "react-icons/ti";
import { MdAttractions } from "react-icons/md";
import { MapPin } from "lucide-react";

export function ExploringSection() {
  const t = useTranslations("HomePage.exploring");
  const locale = useLocale();

  const features = [
    { icon: <FaLandmark className="w-6 h-6 text-blue-600" />, title: t("historyTitle"), desc: t("historyDesc") },
    { icon: <TiWeatherPartlySunny className="w-6 h-6 text-yellow-500" />, title: t("weatherTitle"), desc: t("weatherDesc") },
    { icon: <IoRestaurant className="w-6 h-6 text-green-600" />, title: t("cuisineTitle"), desc: t("cuisineDesc") },
    { icon: <IoBusiness className="w-6 h-6 text-purple-600" />, title: t("stayTitle"), desc: t("stayDesc") },
    { icon: <IoWallet className="w-6 h-6 text-red-500" />, title: t("budgetTitle"), desc: t("budgetDesc") },
    { icon: <MdAttractions className="w-6 h-6 text-teal-500" />, title: t("attractionsTitle"), desc: t("attractionsDesc") },
  ];

  return (
    <section className="py-12 w-full">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">{t("readyToExplore")}</h2>
        <p className="mt-3 text-base text-muted-foreground max-w-2xl mx-auto">{t("intro")}</p>
      </div>

      <Card className="p-6 border border-gray-100 w-full mb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {features.map((f, i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="mt-0.5 shrink-0">{f.icon}</div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Destination hint callout */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center gap-2.5 bg-primary/5 border border-primary/15 rounded-full px-5 py-2.5 text-sm text-primary font-medium">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {t("ctaParagraph")}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <Link href={`/${locale}/destinations`}>
          <Button size="lg" className="rounded-full px-8 gap-2">
            <IoMap className="h-4 w-4" />
            {t("exploreBtn")}
          </Button>
        </Link>
        <Button size="lg" variant="outline" className="rounded-full px-8 gap-2 text-muted-foreground" disabled>
          <FaMagic className="h-4 w-4" />
          {t("generateBtn")}
        </Button>
      </div>
    </section>
  );
}
