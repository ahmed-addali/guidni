import Link from "next/link";
import Image from "next/image";
import { TbRoute } from "react-icons/tb";
import { FiMapPin } from "react-icons/fi";

type RelatedTransfer = {
  id: string;
  slug: string;
  title: string;
  type: string;
  pricePerTrip: number | null;
  pricePerHour: number | null;
  city: string | null;
  country: string;
  images: { id: string; url: string }[];
  destination: { slug: string; city: string };
};

const TYPE_LABELS_MAP: Record<string, string> = {
  AIRPORT_TRANSFER: "Airport Transfer",
  TAXI:             "City Taxi",
  CHAUFFEUR:        "Private Chauffeur",
  SHUTTLE:          "Shuttle",
};

type Props = {
  transfers: RelatedTransfer[];
  locale: string;
  title: string;
  perTrip: string;
  perHour: string;
};

export function TransferRelatedSection({ transfers, locale, title, perTrip, perHour }: Props) {
  if (transfers.length === 0) return null;

  return (
    <section>
      <h2 className="font-bold text-xl text-gray-900 mb-5">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {transfers.map((t) => {
          const price = t.type === "CHAUFFEUR" ? t.pricePerHour : t.pricePerTrip;
          const label = t.type === "CHAUFFEUR" ? perHour : perTrip;
          return (
            <Link
              key={t.id}
              href={`/${locale}/transport/transfers/${t.slug}`}
              className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="relative h-44 bg-gray-100">
                {t.images[0] ? (
                  <Image
                    src={t.images[0].url}
                    alt={t.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <TbRoute className="h-12 w-12 text-gray-300" />
                  </div>
                )}
                <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-700 px-2.5 py-1 rounded-full border border-gray-200">
                  {TYPE_LABELS_MAP[t.type] ?? t.type}
                </span>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <p className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-primary transition-colors">
                  {t.title}
                </p>
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                  <FiMapPin className="h-3 w-3" />
                  <span>{t.city ? `${t.city}, ${t.country}` : t.country}</span>
                </div>
                {price != null && (
                  <div className="mt-auto pt-3 flex items-baseline gap-1">
                    <span className="font-bold text-gray-900">{price} TND</span>
                    <span className="text-xs text-gray-400">{label}</span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
