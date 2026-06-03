import { MapPin, ExternalLink } from "lucide-react";

interface Props {
  address?:  string | null;
  location?: string | null;
  labels: {
    title:      string;
    viewOnMaps: string;
  };
}

function isEmbedUrl(url: string) {
  return url.includes("google.com/maps/embed");
}

export function ShopLocationSection({ address, location, labels }: Props) {
  if (!address && !location) return null;

  return (
    <section id="shop-location" className="scroll-mt-28 space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
        <MapPin className="h-5 w-5 text-gray-400" />
        {labels.title}
      </h2>

      {/* Map embed or fallback card */}
      {location && isEmbedUrl(location) ? (
        <div className="rounded-2xl overflow-hidden border border-gray-100 h-64 sm:h-80">
          <iframe
            src={location}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Shop location"
          />
        </div>
      ) : (
        <div className="bg-gray-50 rounded-2xl border border-gray-100 h-40 flex items-center justify-center">
          <MapPin className="h-10 w-10 text-gray-200" />
        </div>
      )}

      {/* Address + link */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        {address && (
          <p className="text-sm text-gray-600 flex items-start gap-2">
            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
            {address}
          </p>
        )}
        {location && !isEmbedUrl(location) && (
          <a
            href={location}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline shrink-0"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {labels.viewOnMaps}
          </a>
        )}
        {location && isEmbedUrl(location) && address && (
          <a
            href={location.replace("/embed", "")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline shrink-0"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {labels.viewOnMaps}
          </a>
        )}
      </div>
    </section>
  );
}
