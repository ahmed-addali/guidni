import Link from "next/link";
import { notFound } from "next/navigation";
import { FiChevronLeft } from "react-icons/fi";
import { getMyShopBySlug } from "@/lib/actions/partner-shops";
import { CreateProductForm } from "./_components/CreateProductForm";

type Params = Promise<{ locale: string; shopSlug: string }>;

export async function generateMetadata() {
  return { title: "New Product · Partner Dashboard" };
}

export default async function NewProductPage({ params }: { params: Params }) {
  const { locale, shopSlug } = await params;
  const shop = await getMyShopBySlug(shopSlug);
  if (!shop) notFound();

  return (
    <div className="space-y-6 max-w-screen-md">
      <Link
        href={`/${locale}/partner/shops/${shopSlug}?tab=products`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
      >
        <FiChevronLeft className="h-4 w-4" />
        {shop.name}
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Product</h1>
        <p className="text-sm text-gray-400 mt-1">Add a product to {shop.name}.</p>
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <CreateProductForm shopId={shop.id} shopSlug={shop.slug} locale={locale} />
      </div>
    </div>
  );
}
