import { getTranslations } from "next-intl/server";
import { FiCompass } from "react-icons/fi";
import { MdLocationOn } from "react-icons/md";
import { BsCurrencyExchange } from "react-icons/bs";
import { IoLanguageSharp, IoPeople } from "react-icons/io5";
import { FaRegClock, FaPlane } from "react-icons/fa";
import { CultureAccordion } from "./CultureAccordion";
import type { GuideSection } from "@/lib/data/destination-guides";

// Map quick-fact labels (any locale) to a colored icon
const FACT_ICONS: { match: RegExp; icon: React.ReactNode }[] = [
  {
    match: /langua|langue|لغ/i,
    icon: <IoLanguageSharp className="h-7 w-7 text-blue-500" />,
  },
  {
    match: /currenc|devise|monnaie|عمل/i,
    icon: <BsCurrencyExchange className="h-7 w-7 text-amber-500" />,
  },
  {
    match: /popul|سكان/i,
    icon: <IoPeople className="h-7 w-7 text-rose-500" />,
  },
  {
    match: /region|région|منطق/i,
    icon: <MdLocationOn className="h-7 w-7 text-green-500" />,
  },
  {
    match: /time|zone|heure|وقت/i,
    icon: <FaRegClock className="h-7 w-7 text-purple-500" />,
  },
  {
    match: /airport|aéroport|مطار/i,
    icon: <FaPlane className="h-7 w-7 text-sky-500" />,
  },
];

function getFactIcon(label: string) {
  return (
    FACT_ICONS.find((f) => f.match.test(label))?.icon ?? (
      <MdLocationOn className="h-7 w-7 text-gray-400" />
    )
  );
}

const HIGHLIGHT_GRADIENTS = [
  "from-amber-400 to-orange-500",
  "from-blue-400 to-primary",
  "from-teal-400 to-cyan-500",
  "from-purple-400 to-pink-500",
  "from-rose-400 to-red-500",
  "from-green-400 to-emerald-500",
];

export async function OverviewSection({ guide }: { guide: GuideSection }) {
  const t = await getTranslations("DestinationGuide");

  return (
    <section id="overview" className="scroll-mt-20 mb-16">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
          <FiCompass className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{t("overview")}</h2>
      </div>

      {/* Tagline + description */}
      <p className="text-xl italic text-blue-600 font-medium mb-3">
        &ldquo;{guide.tagline}&rdquo;
      </p>
      <p className="text-gray-700 leading-relaxed mb-8 max-w-3xl text-base">
        {guide.description}
      </p>

      {/* ── Quick facts ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-8">
        <h3 className="font-semibold text-gray-800 border-b border-gray-100 pb-3 mb-6">
          {t("quickFacts")}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          {guide.quickFacts.map((fact) => (
            <div key={fact.label} className="flex flex-col items-center text-center gap-2">
              <div className="flex justify-center">
                {getFactIcon(fact.label)}
              </div>
              <p className="text-sm font-bold text-gray-900">{fact.value}</p>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                {fact.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Highlights ──────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h3 className="font-semibold text-gray-800 mb-4">{t("highlights")}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {guide.highlights.map((h, i) => (
            <div
              key={h.title}
              className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Colored top banner */}
              <div
                className={`h-24 bg-gradient-to-br ${
                  HIGHLIGHT_GRADIENTS[i % HIGHLIGHT_GRADIENTS.length]
                } flex items-end p-4`}
              >
                <p className="text-white font-bold text-base leading-tight">
                  {h.title}
                </p>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-600 leading-relaxed">
                  {h.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Culture (accordion) ──────────────────────────────────────────── */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-4">{t("culture")}</h3>
        <CultureAccordion groups={guide.culture} />
      </div>
    </section>
  );
}
