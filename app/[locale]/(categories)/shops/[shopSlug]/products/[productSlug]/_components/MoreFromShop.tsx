import Link from "next/link";
import { ProductCard } from "@/components/shops/ProductCard";

interface Product {
  id:           string;
  slug:         string;
  name:         string;
  price:        number;
  comparePrice: number | null;
  isHandmade:   boolean;
  imageUrl:     string | null;
}

interface Props {
  shopSlug:     string;
  shopName:     string;
  products:     Product[];
  locale:       string;
  title:        string;
  viewAllLabel: string;
  handmadeLabel: string;
}

export function MoreFromShop({
  shopSlug, shopName, products, locale, title, viewAllLabel, handmadeLabel,
}: Props) {
  if (products.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <Link
          href={`/${locale}/shops/${shopSlug}`}
          className="text-sm text-blue-600 hover:underline"
        >
          {viewAllLabel}
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-4">
        {products.slice(0, 6).map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            slug={product.slug}
            shopSlug={shopSlug}
            name={product.name}
            shopName={shopName}
            price={product.price}
            comparePrice={product.comparePrice}
            isHandmade={product.isHandmade}
            imageUrl={product.imageUrl}
            locale={locale}
            handmadeLabel={handmadeLabel}
          />
        ))}
      </div>
    </div>
  );
}
