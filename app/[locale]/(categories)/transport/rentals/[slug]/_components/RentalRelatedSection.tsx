import Link from "next/link";
import Image from "next/image";
import { TbCar } from "react-icons/tb";
import { FiUsers, FiMapPin } from "react-icons/fi";

type RelatedRental = {
  id: string;
  slug: string;
  title: string;
  type: string;
  pricePerDay: number;
  capacity: number;
  brand: string | null;
  model: string | null;
  city: string | null;
  country: string;
  images: { id: string; url: string }[];
};

type Props = {
  rentals: RelatedRental[];
  locale: string;
  title: string;
  perDay: string;
};

export function RentalRelatedSection({ rentals, locale, title, perDay }: Props) {
  if (rentals.length === 0) return null;

  return (
    <section>
      <h2 className="font-bold text-xl text-gray-900 mb-5">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rentals.map((r) => (
          <Link
            key={r.id}
            href={`/${locale}/transport/rentals/${r.slug}`}
            className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col"
          >
            <div className="relative h-44 bg-gray-100">
              {r.images[0] ? (
                <Image
                  src={r.images[0].url}
                  alt={r.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <TbCar className="h-12 w-12 text-gray-300" />
                </div>
              )}
            </div>
            <div className="p-4 flex flex-col flex-1">
              <p className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-primary transition-colors">
                {r.title}
              </p>
              {(r.brand || r.model) && (
                <p className="text-xs text-gray-400 mt-0.5">{[r.brand, r.model].filter(Boolean).join(" · ")}</p>
              )}
              <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                <FiMapPin className="h-3 w-3" />
                <span>{r.city ? `${r.city}, ${r.country}` : r.country}</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                <FiUsers className="h-3 w-3" />
                <span>{r.capacity}</span>
              </div>
              <div className="mt-auto pt-3 flex items-baseline gap-1">
                <span className="font-bold text-gray-900">{r.pricePerDay} TND</span>
                <span className="text-xs text-gray-400">{perDay}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
