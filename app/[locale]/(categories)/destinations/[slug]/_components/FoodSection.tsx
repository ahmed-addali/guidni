import { getTranslations } from "next-intl/server";
import { IoRestaurant } from "react-icons/io5";
import type { GuideSection } from "@/lib/data/destination-guides";

const FOOD_GRADIENTS = [
  "from-rose-400 to-orange-400",
  "from-amber-400 to-yellow-400",
  "from-green-400 to-teal-500",
  "from-blue-400 to-cyan-400",
  "from-purple-400 to-pink-500",
  "from-red-400 to-rose-500",
];

export async function FoodSection({ guide }: { guide: GuideSection }) {
  const t = await getTranslations("DestinationGuide");

  return (
    <section id="food" className="scroll-mt-20 mb-16">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-red-50 rounded-xl text-red-500">
          <IoRestaurant className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{t("food")}</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {guide.food.map((dish, i) => (
          <div
            key={dish.name}
            className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Colored top with dish name */}
            <div
              className={`h-28 bg-gradient-to-br ${
                FOOD_GRADIENTS[i % FOOD_GRADIENTS.length]
              } flex flex-col justify-end p-4`}
            >
              <div className="flex items-center gap-2">
                <IoRestaurant className="h-4 w-4 text-white/80" />
                <p className="text-white font-bold text-base leading-tight">
                  {dish.name}
                </p>
              </div>
            </div>
            {/* Description */}
            <div className="p-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                {dish.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
