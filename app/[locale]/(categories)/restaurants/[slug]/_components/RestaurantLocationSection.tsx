import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Globe, ExternalLink } from "lucide-react";
import { FaInstagram, FaFacebook } from "react-icons/fa";

type Props = {
  address: string | null;
  phone: string | null;
  location: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  labels: {
    viewOnMaps: string;
    website: string;
    instagram: string;
    facebook: string;
  };
};

export function RestaurantLocationSection({
  address,
  phone,
  location,
  website,
  instagram,
  facebook,
  labels,
}: Props) {
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  // Try to extract lat/lng from Google Maps URL
  let mapImageUrl: string | null = null;
  if (mapsKey && location) {
    const match = location.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) {
      const lat = match[1];
      const lng = match[2];
      mapImageUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=600x200&scale=2&markers=color:0x1e3a8a%7C${lat},${lng}&key=${mapsKey}`;
    }
  }

  return (
    <div className="space-y-4">
      {/* Map preview */}
      {mapImageUrl ? (
        <div className="relative h-44 rounded-2xl overflow-hidden">
          <Image src={mapImageUrl} alt="Map" fill className="object-cover" sizes="600px" />
        </div>
      ) : (
        <div className="h-44 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
          <MapPin className="h-8 w-8 text-gray-300" />
        </div>
      )}

      {/* Contact details */}
      <div className="space-y-2.5">
        {address && (
          <div className="flex items-start gap-2.5 text-sm text-gray-700">
            <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-gray-400" />
            <span>{address}</span>
          </div>
        )}
        {phone && (
          <div className="flex items-center gap-2.5 text-sm text-gray-700">
            <Phone className="h-4 w-4 shrink-0 text-gray-400" />
            <a href={`tel:${phone}`} className="hover:text-primary transition-colors">{phone}</a>
          </div>
        )}
        {location && (
          <div className="flex items-center gap-2.5 text-sm">
            <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
            <Link
              href={location}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-1"
            >
              {labels.viewOnMaps}
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>

      {/* Social links */}
      {(website || instagram || facebook) && (
        <div className="flex flex-wrap gap-4">
          {website && (
            <Link
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary transition-colors"
            >
              <Globe className="h-4 w-4" />
              {labels.website}
            </Link>
          )}
          {instagram && (
            <Link
              href={instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-pink-500 transition-colors"
            >
              <FaInstagram className="h-4 w-4" />
              {labels.instagram}
            </Link>
          )}
          {facebook && (
            <Link
              href={facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <FaFacebook className="h-4 w-4" />
              {labels.facebook}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
