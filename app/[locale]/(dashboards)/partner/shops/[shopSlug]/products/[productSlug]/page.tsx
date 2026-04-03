import Link from "next/link";
import { notFound } from "next/navigation";
import { FiChevronLeft } from "react-icons/fi";
import { getMyProductBySlug } from "@/lib/actions/partner-shops";
import { EditProductForm } from "./_components/EditProductForm";

type Params = Promise<{ locale: string; shopSlug: string; productSlug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { shopSlug, productSlug } = await params;
  const product = await getMyProductBySlug(shopSlug, productSlug);
  return { title: `${product?.name ?? "Product"} · Partner Dashboard` };
}

export default async function EditProductPage({ params }: { params: Params }) {
  const { locale, shopSlug, productSlug } = await params;
  const product = await getMyProductBySlug(shopSlug, productSlug);
  if (!product) notFound();

  return (
    <div className="space-y-6 max-w-screen-md">
      <Link
        href={`/${locale}/partner/shops/${shopSlug}?tab=products`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
      >
        <FiChevronLeft className="h-4 w-4" />
        {product.shop.name}
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 truncate">{product.name}</h1>
        <p className="text-sm text-gray-400 mt-1">Edit product details.</p>
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <EditProductForm product={product as never} shopSlug={shopSlug} locale={locale} />
      </div>
    </div>
  );
}
