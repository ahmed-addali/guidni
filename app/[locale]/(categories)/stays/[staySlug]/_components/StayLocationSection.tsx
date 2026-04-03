import { MapPin, ExternalLink } from "lucide-react";

type Props = {
  address?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  region: string;
  country: string;
  location?: string | null;
  locationNotes?: string | null;
  lat?: number | null;
  lng?: number | null;
  labels: {
    title: string;
    viewOnMaps: string;
  };
};

export function StayLocationSection({
  address,
  neighborhood,
  city,
  region,
  country,
  location,
  locationNotes,
  lat,
  lng,
  labels,
}: Props) {
  const addressLine = [address, neighborhood, city, region, country]
    .filter(Boolean)
    .join(", ");

  const mapsKey     = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  const hasMap      = mapsKey && lat && lng;
  const staticMapUrl = hasMap
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=600x200&markers=color:0x1e3a8a%7C${lat},${lng}&key=${mapsKey}`
    : null;

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{labels.title}</h2>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-gray-100 mb-4 h-44 bg-gray-50 flex items-center justify-center">
        {staticMapUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={staticMapUrl}
            alt={addressLine}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-300">
            <MapPin className="h-10 w-10" />
          </div>
        )}
      </div>

      {/* Address + notes + link */}
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
          <span className="text-sm text-gray-700">{addressLine}</span>
        </div>
        {locationNotes && (
          <p className="text-sm text-gray-500 leading-relaxed pl-6">{locationNotes}</p>
        )}
        {location && (
          <a
            href={location}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline pl-6"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {labels.viewOnMaps}
          </a>
        )}
      </div>
    </div>
  );
}
