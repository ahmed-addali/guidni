import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FiChevronLeft, FiExternalLink } from "react-icons/fi";
import { getMyProductBySlug } from "@/lib/actions/partner-shops";
import { EditProductForm } from "./_components/EditProductForm";

type Params = Promise<{ locale: string; shopSlug: string; productSlug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { locale, shopSlug, productSlug } = await params;
  const [product, t] = await Promise.all([
    getMyProductBySlug(shopSlug, productSlug),
    getTranslations({ locale, namespace: "PartnerDashboard.editProduct" }),
  ]);
  return { title: `${product?.name ?? t("pageTitle")} · Partner Dashboard` };
}

export default async function EditProductPage({ params }: { params: Params }) {
  const { locale, shopSlug, productSlug } = await params;
  const [product, t] = await Promise.all([
    getMyProductBySlug(shopSlug, productSlug),
    getTranslations({ locale, namespace: "PartnerDashboard.editProduct" }),
  ]);
  if (!product) notFound();

  return (
    <div className="space-y-6 max-w-screen-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href={`/${locale}/partner/shops/${shopSlug}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-2"
          >
            <FiChevronLeft className="h-4 w-4" />
            {t("backLabel")}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 truncate">{product.name}</h1>
          <p className="text-sm text-gray-400 mt-1">{t("pageSubtitle")}</p>
        </div>
        <a
          href={`/${locale}/shops/${shopSlug}/products/${productSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 rounded-xl px-3 py-2 hover:text-blue-600 hover:border-blue-300 transition-colors shrink-0 mt-7"
        >
          <FiExternalLink className="h-4 w-4" />
          {t("previewLink")}
        </a>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <EditProductForm product={product as never} shopSlug={shopSlug} locale={locale} />
      </div>
    </div>
  );
}
