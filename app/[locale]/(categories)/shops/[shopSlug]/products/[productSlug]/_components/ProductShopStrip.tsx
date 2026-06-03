import Link from "next/link";
import Image from "next/image";
import { FaStore, FaChevronRight } from "react-icons/fa6";

interface Props {
  shopSlug:      string;
  shopName:      string;
  shopLogo?:     string | null;
  categoryLabel: string;
  locale:        string;
  visitLabel:    string;
}

export function ProductShopStrip({
  shopSlug, shopName, shopLogo, categoryLabel, locale, visitLabel,
}: Props) {
  return (
    <Link
      href={`/${locale}/shops/${shopSlug}`}
      className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-colors group"
    >
      {shopLogo ? (
        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200 shrink-0">
          <Image src={shopLogo} alt={shopName} fill className="object-cover" />
        </div>
      ) : (
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <FaStore className="h-5 w-5 text-primary" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm truncate">{shopName}</p>
        <p className="text-xs text-gray-500">{categoryLabel}</p>
      </div>

      <div className="flex items-center gap-1 text-xs text-primary font-medium shrink-0">
        {visitLabel}
        <FaChevronRight className="h-3 w-3" />
      </div>
    </Link>
  );
}
