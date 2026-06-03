import Image from "next/image";
import { MapPin } from "lucide-react";
import { getAdminDestinations } from "@/lib/actions/admin";
import { DestinationToggles } from "./_components/DestinationToggles";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  void params;
  return { title: "Destinations — Admin" };
}

export default async function AdminDestinationsPage({ params }: { params: Params }) {
  void params;

  const destinations = await getAdminDestinations();

  return (
    <div className="space-y-6 max-w-screen-xl">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Destinations</h1>
        <p className="text-sm text-gray-400 mt-1">
          {destinations.length} destinations ·{" "}
          {destinations.filter((d) => d.active).length} active ·{" "}
          {destinations.filter((d) => d.featured).length} featured
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {destinations.map((dest) => (
          <div
            key={dest.id}
            className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Cover */}
            <div className="relative h-36 bg-gradient-to-br from-primary/20 to-blue-100">
              {dest.images?.[0]?.url ? (
                <Image
                  src={dest.images[0].url}
                  alt={dest.city}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-3 left-4 text-white">
                <p className="font-bold text-lg leading-tight">{dest.city}</p>
                <div className="flex items-center gap-1 text-white/80 text-xs">
                  <MapPin className="h-3 w-3" />
                  {dest.country}
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{dest._count.activities} activities</span>
                <span>{dest._count.stays} stays</span>
                <span className="font-mono text-gray-300">{dest.slug}</span>
              </div>

              {dest.description && (
                <p className="text-xs text-gray-400 line-clamp-2">{dest.description}</p>
              )}

              <DestinationToggles
                id={dest.id}
                active={dest.active}
                featured={dest.featured}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
