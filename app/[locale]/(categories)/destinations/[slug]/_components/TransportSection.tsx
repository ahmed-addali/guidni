import { getTranslations } from "next-intl/server";
import { TbCar } from "react-icons/tb";
import { FiNavigation, FiMap } from "react-icons/fi";
import type { GuideSection } from "@/lib/data/destination-guides";

export async function TransportSection({ guide }: { guide: GuideSection }) {
  const t = await getTranslations("DestinationGuide");
  const { transport } = guide;

  return (
    <section id="transport" className="scroll-mt-20 mb-16">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-teal-50 rounded-xl text-teal-600">
          <TbCar className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{t("transport")}</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-800 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
            <FiNavigation className="h-4 w-4 text-blue-600" />
            {t("gettingThere")}
          </h3>
          <div className="space-y-4">
            {transport.gettingThere.map((item) => (
              <div key={item.name}>
                <p className="text-sm font-semibold text-gray-800">
                  {item.name}
                </p>
                <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-800 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
            <FiMap className="h-4 w-4 text-blue-600" />
            {t("movingAround")}
          </h3>
          <div className="space-y-4">
            {transport.movingAround.map((item) => (
              <div key={item.name}>
                <p className="text-sm font-semibold text-gray-800">
                  {item.name}
                </p>
                <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
