import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FiChevronLeft } from "react-icons/fi";
import { getMyShopBySlug } from "@/lib/actions/partner-shops";
import { CreateProductWizard } from "./_components/CreateProductWizard";

type Params = Promise<{ locale: string; shopSlug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PartnerDashboard.newProduct" });
  return { title: `${t("pageTitle")} · Partner Dashboard` };
}

export default async function NewProductPage({ params }: { params: Params }) {
  const { locale, shopSlug } = await params;
  const [shop, t] = await Promise.all([
    getMyShopBySlug(shopSlug),
    getTranslations({ locale, namespace: "PartnerDashboard.newProduct" }),
  ]);
  if (!shop) notFound();

  return (
    <div className="space-y-6 max-w-screen-md">
      <Link
        href={`/${locale}/partner/shops/${shopSlug}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
      >
        <FiChevronLeft className="h-4 w-4" />
        {shop.name}
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("pageTitle")}</h1>
        <p className="text-sm text-gray-400 mt-1">{t("pageSubtitle")}</p>
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <CreateProductWizard shopId={shop.id} shopSlug={shop.slug} />
      </div>
    </div>
  );
}
