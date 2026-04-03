import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { getDestinations } from "@/lib/actions/destinations";
import { MapPin } from "lucide-react";

const DESTINATION_GRADIENTS: Record<string, string> = {
  djerba:   "from-cyan-400 to-blue-500",
  hammamet: "from-teal-400 to-emerald-500",
  tunis:    "from-amber-400 to-orange-500",
  sousse:   "from-sky-400 to-cyan-500",
  mahdia:   "from-blue-400 to-indigo-500",
  tozeur:   "from-orange-400 to-amber-600",
  paris:    "from-pink-400 to-rose-500",
  nice:     "from-violet-400 to-purple-500",
  dubai:    "from-yellow-400 to-amber-500",
};

const DEFAULT_GRADIENT = "from-primary to-blue-600";

export async function DestinationsGrid() {
  const [destinations, locale, t] = await Promise.all([
    getDestinations(true),
    getLocale(),
    getTranslations("HomePage.destinations"),
  ]);

  if (destinations.length === 0) return null;

  return (
    <section className="w-full py-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        {t("title")}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {destinations.map((dest) => {
          const gradient =
            DESTINATION_GRADIENTS[dest.slug] ?? DEFAULT_GRADIENT;
          return (
            <Link
              key={dest.slug}
              href={`/${locale}/activities?destination=${dest.slug}`}
              className="group relative rounded-xl overflow-hidden aspect-[4/3] cursor-pointer"
            >
              {dest.coverImage ? (
                <img
                  src={dest.coverImage}
                  alt={dest.city}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${gradient} group-hover:scale-105 transition-transform duration-300`}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-2.5">
                <p className="text-white font-semibold text-sm leading-tight">
                  {dest.city}
                </p>
                <div className="flex items-center gap-0.5 mt-0.5">
                  <MapPin className="h-3 w-3 text-white/70" />
                  <p className="text-white/70 text-xs">{dest.country}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
