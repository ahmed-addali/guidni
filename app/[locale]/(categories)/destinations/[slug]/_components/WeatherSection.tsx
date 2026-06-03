import { getTranslations } from "next-intl/server";
import { TbSun } from "react-icons/tb";
import { FaRegStar } from "react-icons/fa";
import { FiInfo } from "react-icons/fi";
import { TiWeatherPartlySunny } from "react-icons/ti";
import type { GuideSection } from "@/lib/data/destination-guides";

const SEASON_META: { emoji: string; tempRange: string }[] = [
  { emoji: "🌸", tempRange: "18–25 °C" },
  { emoji: "☀️", tempRange: "28–37 °C" },
  { emoji: "🍂", tempRange: "22–28 °C" },
  { emoji: "⛄", tempRange: "12–18 °C" },
];

export async function WeatherSection({ guide }: { guide: GuideSection }) {
  const t = await getTranslations("DestinationGuide");
  const { weather } = guide;

  return (
    <section id="weather" className="scroll-mt-20 mb-16">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-amber-50 rounded-xl text-amber-500">
          <TbSun className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{t("weather")}</h2>
      </div>

      <p className="text-gray-700 leading-relaxed mb-6 max-w-3xl">
        {weather.description}
      </p>

      {/* ── Main weather card (gradient bg) ─────────────────────────────── */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-sky-100 border border-blue-100 rounded-2xl p-6 mb-6">
        {/* Climate summary */}
        <div className="bg-white rounded-xl p-4 mb-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
            <TiWeatherPartlySunny className="h-5 w-5 text-blue-600" />
            {t("climate")}
          </h3>
          <ul className="space-y-1.5 text-sm text-gray-700">
            <li>
              <span className="font-medium">Type: </span>
              {weather.climate.type}
            </li>
            <li>
              <span className="font-medium">Temperature: </span>
              {weather.climate.tempRange}
            </li>
            <li>
              <span className="font-medium">Rainfall: </span>
              {weather.climate.rainfall}
            </li>
          </ul>
        </div>

        {/* Season cards */}
        <h3 className="font-semibold text-gray-800 mb-3">
          🌤️ Seasons
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {weather.seasons.map((season, i) => (
            <div
              key={season.name}
              className={`bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow ${
                season.hot ? "border border-amber-200" : "border border-gray-100"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">
                  {SEASON_META[i]?.emoji ?? "🌡️"}
                </span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {season.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{season.dates}</span>
                    <span>•</span>
                    <span className="font-medium text-gray-700">
                      {SEASON_META[i]?.tempRange}
                    </span>
                    {season.hot && (
                      <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full text-xs">
                        Hot
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {season.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Best time to visit ───────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <FaRegStar className="h-4 w-4 text-amber-500" />
          {t("bestTime")}
        </h3>
        <div className="space-y-4">
          {weather.bestTime.map((bt) => (
            <div key={bt.period} className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0 mt-1.5" />
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {bt.period}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">{bt.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Travel tip callout ───────────────────────────────────────────── */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-4">
        <FiInfo className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 leading-relaxed">{weather.tip}</p>
      </div>
    </section>
  );
}
