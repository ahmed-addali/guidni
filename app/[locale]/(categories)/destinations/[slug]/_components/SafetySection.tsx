import { getTranslations } from "next-intl/server";
import { FaShieldAlt, FaSun, FaWalking, FaWallet } from "react-icons/fa";
import { GiHealthNormal } from "react-icons/gi";
import { IoMdArrowDropright } from "react-icons/io";
import type { GuideSection } from "@/lib/data/destination-guides";

// Icon set for safety tips (cycles through the list)
const TIP_ICONS = [
  <FaWalking key="0" className="h-4 w-4 text-blue-500" />,
  <FaWallet key="1" className="h-4 w-4 text-green-500" />,
  <FaShieldAlt key="2" className="h-4 w-4 text-indigo-500" />,
  <FaSun key="3" className="h-4 w-4 text-amber-500" />,
  <FaWalking key="4" className="h-4 w-4 text-blue-500" />,
  <FaShieldAlt key="5" className="h-4 w-4 text-indigo-500" />,
];

export async function SafetySection({ guide }: { guide: GuideSection }) {
  const t = await getTranslations("DestinationGuide");
  const { safety } = guide;

  return (
    <section id="safety" className="scroll-mt-20 mb-16">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
          <FaShieldAlt className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{t("safety")}</h2>
      </div>

      {/* Overview callout */}
      <div className="flex items-start gap-3 bg-green-50 border border-green-100 rounded-2xl p-5 mb-6">
        <FaShieldAlt className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-green-800 leading-relaxed">
          {safety.overview}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Safety tips */}
        <div className="bg-white border border-blue-100 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
            <FaShieldAlt className="h-4 w-4 text-blue-600" />
            {t("safetyTips")}
          </h3>
          <div className="space-y-3">
            {safety.tips.map((tip, i) => (
              <div key={tip} className="flex items-start gap-3">
                <div className="p-1.5 rounded-full border border-gray-200 mt-0.5 flex-shrink-0">
                  {TIP_ICONS[i % TIP_ICONS.length]}
                </div>
                <p className="text-sm text-gray-600">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency numbers */}
        <div className="bg-white border border-blue-100 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
            <GiHealthNormal className="h-4 w-4 text-red-600" />
            {t("emergency")}
          </h3>
          <div className="space-y-3">
            {safety.emergency.map((em) => (
              <div
                key={em.service}
                className="flex items-center justify-between bg-gray-50 rounded-xl p-3 border border-gray-100"
              >
                <span className="text-sm font-medium text-gray-700">
                  {em.service}
                </span>
                <span className="text-base font-bold text-red-600 font-mono tracking-wider">
                  {em.number}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
