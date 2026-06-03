import { FiMapPin, FiGlobe, FiInstagram, FiFacebook, FiTruck } from "react-icons/fi";
import { DescriptionWithToggle } from "@/components/shared/DescriptionWithToggle";

type DeliveryMethod = "PICKUP" | "LOCAL_DELIVERY" | "NATIONWIDE" | "INTERNATIONAL";

interface Props {
  description:       string;
  arabicDescription?: string | null;
  address?:          string | null;
  location?:         string | null;
  website?:          string | null;
  instagram?:        string | null;
  facebook?:         string | null;
  deliveryMethods:   DeliveryMethod[];
  freeShippingAbove?: number | null;
  minOrderAmount?:   number | null;
  locale:            string;
  labels: {
    about:         string;
    showMore:      string;
    showLess:      string;
    delivery:      string;
    freeShipping:  string;
    minOrder:      string;
    address:       string;
    viewOnMaps:    string;
    website:       string;
    instagram:     string;
    facebook:      string;
    deliveryLabels: Record<string, string>;
  };
}

export function ShopInfoCard({
  description, arabicDescription, address, location,
  website, instagram, facebook, deliveryMethods,
  freeShippingAbove, minOrderAmount, locale, labels,
}: Props) {
  const desc = locale === "ar" && arabicDescription ? arabicDescription : description;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-5 sticky top-24">
      {/* About */}
      <div>
        <h3 className="font-semibold text-gray-800 text-sm mb-2">{labels.about}</h3>
        <DescriptionWithToggle
          text={desc}
          showMoreLabel={labels.showMore}
          showLessLabel={labels.showLess}
          className="text-sm text-gray-600 leading-relaxed"
        />
      </div>

      {/* Delivery */}
      {deliveryMethods.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-1.5">
            <FiTruck className="h-4 w-4 text-gray-500" />
            {labels.delivery}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {deliveryMethods.map((m) => (
              <span
                key={m}
                className="text-xs text-gray-600 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full"
              >
                {labels.deliveryLabels[m] ?? m}
              </span>
            ))}
          </div>
          {freeShippingAbove != null && (
            <p className="text-xs text-green-600 mt-2">
              {labels.freeShipping.replace("{amount}", freeShippingAbove.toString())}
            </p>
          )}
          {minOrderAmount != null && (
            <p className="text-xs text-gray-400 mt-1">
              {labels.minOrder.replace("{amount}", minOrderAmount.toString())}
            </p>
          )}
        </div>
      )}

      {/* Address */}
      {address && (
        <div>
          <h3 className="font-semibold text-gray-800 text-sm mb-1">{labels.address}</h3>
          <p className="text-sm text-gray-600 flex items-start gap-1.5">
            <FiMapPin className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" />
            {address}
          </p>
          {location && (
            <a
              href={location}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline mt-1 inline-block"
            >
              {labels.viewOnMaps} →
            </a>
          )}
        </div>
      )}

      {/* Social links */}
      {(website || instagram || facebook) && (
        <div className="flex flex-col gap-2">
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors"
            >
              <FiGlobe className="h-4 w-4 shrink-0" />
              {labels.website}
            </a>
          )}
          {instagram && (
            <a
              href={`https://instagram.com/${instagram.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors"
            >
              <FiInstagram className="h-4 w-4 shrink-0" />
              {labels.instagram}
            </a>
          )}
          {facebook && (
            <a
              href={facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors"
            >
              <FiFacebook className="h-4 w-4 shrink-0" />
              {labels.facebook}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
