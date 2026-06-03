import { getTranslations } from "next-intl/server";
import { FiPackage, FiCheck } from "react-icons/fi";
import type { GuideSection } from "@/lib/data/destination-guides";

export async function PackingSection({ guide }: { guide: GuideSection }) {
  const t = await getTranslations("DestinationGuide");
  const { packing } = guide;

  return (
    <section id="packing" className="scroll-mt-20 mb-16">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600">
          <FiPackage className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{t("packing")}</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Essentials */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-800 border-b border-gray-100 pb-3 mb-4">
            {t("essentials")}
          </h3>
          <ul className="space-y-2.5">
            {packing.essentials.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm text-gray-600"
              >
                <FiCheck className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Summer */}
        <div className="bg-white border border-amber-100 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-800 border-b border-amber-100 pb-3 mb-4">
            {t("summer")} ☀️
          </h3>
          <ul className="space-y-2.5">
            {packing.summer.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm text-gray-600"
              >
                <FiCheck className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Winter */}
        <div className="bg-white border border-sky-100 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-800 border-b border-sky-100 pb-3 mb-4">
            {t("winter")} 🧥
          </h3>
          <ul className="space-y-2.5">
            {packing.winter.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm text-gray-600"
              >
                <FiCheck className="h-4 w-4 text-sky-500 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
