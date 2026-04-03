import { Clock, DollarSign, MapPin, ExternalLink } from "lucide-react";
import type { getAttractionBySlug } from "@/lib/actions/attractions";

type Attraction = NonNullable<Awaited<ReturnType<typeof getAttractionBySlug>>>;

interface Props {
  attraction: Attraction;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export function AttractionPracticalInfo({ attraction, t }: Props) {
  const coordinates = attraction.coordinates as { lat?: number; lng?: number } | null;
  const mapsUrl =
    coordinates?.lat && coordinates?.lng
      ? `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`
      : attraction.location
        ? `https://www.google.com/maps/search/${encodeURIComponent(attraction.location)}`
        : null;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
      <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">
        {t("practicalInfo")}
      </h3>

      {attraction.hours && (
        <div className="flex gap-3">
          <div className="shrink-0 mt-0.5">
            <Clock className="h-4 w-4 text-gray-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
              {t("hours")}
            </p>
            <p className="text-sm text-gray-700">{attraction.hours}</p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <div className="shrink-0 mt-0.5">
          <DollarSign className="h-4 w-4 text-gray-400" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
            {t("admission")}
          </p>
          {attraction.hasFee ? (
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {attraction.feeAmount ? `${attraction.feeAmount} TND` : attraction.fees}
              </p>
              {attraction.feeNote && (
                <p className="text-xs text-gray-500 mt-0.5">{attraction.feeNote}</p>
              )}
            </div>
          ) : (
            <p className="text-sm font-semibold text-green-600">{t("free")}</p>
          )}
        </div>
      </div>

      {attraction.location && (
        <div className="flex gap-3">
          <div className="shrink-0 mt-0.5">
            <MapPin className="h-4 w-4 text-gray-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
              {t("location")}
            </p>
            <p className="text-sm text-gray-700">{attraction.location}</p>
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
              >
                <ExternalLink className="h-3 w-3" />
                {t("viewMap")}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
