import Link from "next/link";
import { notFound } from "next/navigation";
import { FiChevronLeft } from "react-icons/fi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMyShopBySlug } from "@/lib/actions/partner-shops";
import { DetailsTab }  from "./_components/DetailsTab";
import { ProductsTab } from "./_components/ProductsTab";
import { OrdersTab }   from "./_components/OrdersTab";
import { ImagesTab }   from "./_components/ImagesTab";
import { SettingsTab } from "./_components/SettingsTab";

type Params = Promise<{ locale: string; shopSlug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { shopSlug } = await params;
  const shop = await getMyShopBySlug(shopSlug);
  return { title: `${shop?.name ?? "Shop"} · Partner Dashboard` };
}

export default async function EditShopPage({ params }: { params: Params }) {
  const { locale, shopSlug } = await params;
  const shop = await getMyShopBySlug(shopSlug);
  if (!shop) notFound();

  return (
    <div className="space-y-6 max-w-screen-lg">
      <Link
        href={`/${locale}/partner/shops`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
      >
        <FiChevronLeft className="h-4 w-4" />
        Shops
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 truncate">{shop.name}</h1>
        <p className="text-sm text-gray-400 mt-1">Manage your shop listing.</p>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="products">Products ({shop.products.length})</TabsTrigger>
          <TabsTrigger value="orders">Orders ({shop.orders.length})</TabsTrigger>
          <TabsTrigger value="images">Images ({shop.images.length})</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <DetailsTab shop={shop as never} />
          </div>
        </TabsContent>

        <TabsContent value="products">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <ProductsTab
              shopId={shop.id}
              shopSlug={shop.slug}
              locale={locale}
              products={shop.products as never}
            />
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <OrdersTab orders={shop.orders as never} />
          </div>
        </TabsContent>

        <TabsContent value="images">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <ImagesTab shopId={shop.id} images={shop.images} />
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <SettingsTab shop={shop as never} locale={locale} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
