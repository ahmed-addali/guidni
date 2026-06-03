import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Sparkles, Calendar, Users, MapPin, ArrowRight } from "lucide-react";

interface Props {
  locale: string;
}

const SAMPLE_DAYS = [
  {
    dayKey: "day1",
    slots: [
      { time: "Morning",   title: "Explore the Medina",         type: "attraction" },
      { time: "Lunch",     title: "Djerba Heritage Restaurant", type: "food" },
      { time: "Afternoon", title: "Flamingo Coast Tour",        type: "activity" },
      { time: "Evening",   title: "Sunset at Borj El Kebir",   type: "attraction" },
    ],
  },
  {
    dayKey: "day2",
    slots: [
      { time: "Morning",   title: "Djerba Explore Park",      type: "activity" },
      { time: "Lunch",     title: "Seafood at the harbour",   type: "food" },
      { time: "Afternoon", title: "Guellala Pottery Village", type: "attraction" },
    ],
  },
];

const typeColor: Record<string, string> = {
  attraction: "bg-blue-50 text-blue-700",
  activity:   "bg-green-50 text-green-700",
  food:       "bg-orange-50 text-orange-700",
};

export async function AIPlannerSection({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: "HomePage.planner" });

  const STEPS = [
    { icon: MapPin,    label: t("step1") },
    { icon: Calendar,  label: t("step2") },
    { icon: Users,     label: t("step3") },
    { icon: Sparkles,  label: t("step4") },
  ];

  return (
    <section className="py-16 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        {/* Left — value proposition */}
        <div className="space-y-7">
          <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/15 rounded-full px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">{t("badge")}</span>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-gray-900 leading-tight">
              {t("headline")}{" "}
              <span className="text-blue-600">{t("headlineAccent")}</span>
            </h2>
            <p className="text-gray-500 text-base leading-relaxed">{t("subtitle")}</p>
          </div>

          {/* Steps */}
          <ol className="space-y-3">
            {STEPS.map(({ icon: Icon, label }, i) => (
              <li key={label} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <Icon className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-700">{label}</span>
              </li>
            ))}
          </ol>

          <Link
            href={`/${locale}/planner`}
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            {t("cta")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Right — itinerary preview mockup */}
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-br from-primary/5 to-blue-50 rounded-3xl -z-10" />

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-primary px-5 py-3.5 flex items-center justify-between">
              <div>
                <p className="text-white font-semibold text-sm">{t("previewHeader")}</p>
                <p className="text-white/60 text-xs mt-0.5">{t("previewSubheader")}</p>
              </div>
              <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1">
                <Sparkles className="h-3 w-3 text-white" />
                <span className="text-white text-xs font-medium">{t("previewBadge")}</span>
              </div>
            </div>

            {/* Days */}
            <div className="divide-y divide-gray-50">
              {SAMPLE_DAYS.map((day) => (
                <div key={day.dayKey} className="px-5 py-4 space-y-2.5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {t(day.dayKey as "day1" | "day2")}
                  </p>
                  <div className="space-y-1.5">
                    {day.slots.map((slot) => (
                      <div key={slot.title} className="flex items-center gap-2.5">
                        <span className="text-[10px] text-gray-400 w-16 shrink-0">{slot.time}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColor[slot.type]}`}>
                          {slot.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Fade hint for more days */}
              <div className="px-5 py-3 flex items-center justify-between">
                <p className="text-xs text-gray-400">{t("previewMoreDays")}</p>
                <Link
                  href={`/${locale}/planner`}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  {t("previewCta")} <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
