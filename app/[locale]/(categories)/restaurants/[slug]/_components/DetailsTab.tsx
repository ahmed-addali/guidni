import Link from "next/link";
import { MapPin, Phone, Globe, ExternalLink } from "lucide-react";
import { FaInstagram, FaFacebook } from "react-icons/fa";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type Hours = {
  day: string;
  opening: string | null;
  closing: string | null;
  isClosed: boolean;
  isFullDayOpening: boolean;
};

type Props = {
  description: string;
  arabicDescription: string | null;
  address: string | null;
  phone: string | null;
  location: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  hours: Hours[];
  locale: string;
};

export function DetailsTab({
  description,
  arabicDescription,
  address,
  phone,
  location,
  website,
  instagram,
  facebook,
  hours,
  locale,
}: Props) {
  const desc = locale === "ar" && arabicDescription ? arabicDescription : description;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: description + contact */}
      <div className="space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">About</h3>
          <p className="text-gray-700 text-sm leading-relaxed">{desc}</p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Contact</h3>
          {address && (
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-gray-400" />
              <span>{address}</span>
            </div>
          )}
          {phone && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Phone className="h-4 w-4 shrink-0 text-gray-400" />
              <a href={`tel:${phone}`} className="hover:text-primary transition-colors">{phone}</a>
            </div>
          )}
          {location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
              <Link href={location} target="_blank" rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1">
                View on Maps <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Social links */}
        {(website || instagram || facebook) && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Links</h3>
            <div className="flex flex-wrap gap-3">
              {website && (
                <Link href={website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary transition-colors">
                  <Globe className="h-4 w-4" /> Website
                </Link>
              )}
              {instagram && (
                <Link href={instagram} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-pink-500 transition-colors">
                  <FaInstagram className="h-4 w-4" /> Instagram
                </Link>
              )}
              {facebook && (
                <Link href={facebook} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  <FaFacebook className="h-4 w-4" /> Facebook
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right: hours */}
      {hours.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Opening Hours</h3>
          <div className="space-y-2">
            {DAYS.map((day) => {
              const h = hours.find((x) => x.day.toLowerCase() === day.toLowerCase());
              return (
                <div key={day} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                  <span className="font-medium text-gray-700 w-28">{day}</span>
                  {!h || h.isClosed ? (
                    <span className="text-red-500 text-xs font-medium">Closed</span>
                  ) : h.isFullDayOpening ? (
                    <span className="text-green-600 text-xs font-medium">Open 24h</span>
                  ) : (
                    <span className="text-gray-600">{h.opening} – {h.closing}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
