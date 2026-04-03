import { getTranslations } from "next-intl/server";
import { BsCurrencyExchange } from "react-icons/bs";
import { TbPigMoney, TbStackMiddle } from "react-icons/tb";
import { IoDiamond } from "react-icons/io5";
import { FiInfo } from "react-icons/fi";
import { IoMdArrowDropright } from "react-icons/io";
import type { GuideSection } from "@/lib/data/destination-guides";

const LEVEL_META = [
  {
    icon: <TbPigMoney className="h-5 w-5 text-rose-500" />,
    bg: "bg-rose-50 border-rose-200",
  },
  {
    icon: <TbStackMiddle className="h-5 w-5 text-green-600" />,
    bg: "bg-green-50 border-green-200",
  },
  {
    icon: <IoDiamond className="h-5 w-5 text-blue-500" />,
    bg: "bg-blue-50 border-blue-200",
  },
];

export async function BudgetSection({ guide }: { guide: GuideSection }) {
  const t = await getTranslations("DestinationGuide");
  const { budget } = guide;

  return (
    <section id="budget" className="scroll-mt-20 mb-16">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-green-50 rounded-xl text-green-600">
          <BsCurrencyExchange className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{t("budget")}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Budget levels */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-800 border-b border-gray-100 pb-3 mb-4">
            {t("budgetLevels")}
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            {t("currency")}: <span className="font-medium text-gray-600">{budget.currency}</span>
          </p>
          <div className="space-y-3">
            {budget.levels.map((level, i) => (
              <div
                key={level.name}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  LEVEL_META[i]?.bg ?? "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-full bg-white border border-gray-200">
                    {LEVEL_META[i]?.icon}
                  </div>
                  <span className="font-medium text-gray-800 text-sm">
                    {level.name}
                  </span>
                </div>
                <span className="font-bold text-amber-700 text-sm">
                  {level.range}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Price examples */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-800 border-b border-gray-100 pb-3 mb-4">
            {t("priceExamples")}
          </h3>
          <div className="space-y-0">
            {budget.examples.map((ex, i) => (
              <div
                key={ex.item}
                className={`flex items-center justify-between py-2.5 ${
                  i < budget.examples.length - 1
                    ? "border-b border-gray-50"
                    : ""
                }`}
              >
                <span className="text-sm text-gray-600">{ex.item}</span>
                <span className="text-sm font-bold text-amber-700 ml-4">
                  {ex.price}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Money tips */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
          <FiInfo className="h-4 w-4 text-blue-500" />
          {t("moneyTips")}
        </h3>
        <div className="space-y-3">
          {budget.tips.map((tip) => (
            <div key={tip} className="flex items-start gap-2">
              <IoMdArrowDropright className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
