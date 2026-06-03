import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getAdminShops, getAdminProducts, getAdminOrders } from "@/lib/actions/admin-shops";
import { getShopCategoryLabel, getProductCategoryLabel } from "@/lib/utils/shop-categories";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductFeaturedToggle } from "./_components/ProductFeaturedToggle";
import { ShopStatusActions }    from "./_components/ShopStatusActions";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin.shops" });
  return { title: t("pageTitle") };
}

export default async function AdminShopsPage({ params }: { params: Params }) {
  const { locale } = await params;

  const [shops, products, orders, t] = await Promise.all([
    getAdminShops(),
    getAdminProducts(),
    getAdminOrders(),
    getTranslations({ locale, namespace: "Admin.shops" }),
  ]);

  const activeShops      = shops.filter((s) => s.status === "ACTIVE").length;
  const draftShops       = shops.filter((s) => s.status === "DRAFT").length;
  const featuredProducts = products.filter((p) => p.featured).length;
  const pendingOrders    = orders.filter((o) => o.status === "PENDING").length;

  const statusActionLabels = {
    approveLabel:       t("approve"),
    suspendLabel:       t("suspend"),
    featureLabel:       t("feature"),
    unfeatureLabel:     t("unfeature"),
    activeLabel:        t("statusActive"),
    suspendedLabel:     t("statusSuspended"),
    draftLabel:         t("statusDraft"),
    toastApproved:      t("toastApproved"),
    toastSuspended:     t("toastSuspended"),
    toastDraft:         t("toastDraft"),
    toastStatusFailed:  t("toastStatusFailed"),
    toastFeatureFailed: t("toastFeatureFailed"),
  };

  return (
    <div className="space-y-6 max-w-screen-xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("pageTitle")}</h1>
        <p className="text-sm text-gray-400 mt-1">
          {t("summary", {
            total:    shops.length,
            active:   activeShops,
            draft:    draftShops,
            products: products.length,
            featured: featuredProducts,
            orders:   orders.length,
            pending:  pendingOrders,
          })}
        </p>
      </div>

      <Tabs defaultValue="shops">
        <TabsList className="bg-gray-100 mb-4">
          <TabsTrigger value="shops">{t("tabShops")} ({shops.length})</TabsTrigger>
          <TabsTrigger value="products">{t("tabProducts")} ({products.length})</TabsTrigger>
          <TabsTrigger value="orders">{t("tabOrders")} ({orders.length})</TabsTrigger>
        </TabsList>

        {/* ── Shops tab ──────────────────────────────────────────────── */}
        <TabsContent value="shops">
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            {shops.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">{t("noShops")}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                      <th className="text-left px-6 py-3 font-medium">{t("colShop")}</th>
                      <th className="text-left px-6 py-3 font-medium">{t("colCategory")}</th>
                      <th className="text-left px-6 py-3 font-medium">{t("colLocation")}</th>
                      <th className="text-left px-6 py-3 font-medium">{t("colPartner")}</th>
                      <th className="text-right px-6 py-3 font-medium">{t("colProducts")}</th>
                      <th className="text-right px-6 py-3 font-medium">{t("colOrders")}</th>
                      <th className="text-center px-6 py-3 font-medium">{t("colStatus")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {shops.map((shop) => (
                      <tr key={shop.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3.5">
                          <Link
                            href={`/${locale}/shops/${shop.slug}`}
                            target="_blank"
                            className="font-medium text-gray-800 hover:text-primary transition-colors"
                          >
                            {shop.name}
                          </Link>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                            {getShopCategoryLabel(shop.category, locale === "ar" ? "ar" : "en")}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-gray-600">
                          {shop.destination?.city ?? shop.city ?? shop.country}
                        </td>
                        <td className="px-6 py-3.5 text-gray-500 text-xs">
                          <div className="flex items-center gap-1.5">
                            {shop.businessProfile.name}
                            {shop.businessProfile.isVerified && (
                              <span className="text-green-600" title={t("verified")}>✓</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-right text-gray-600">
                          {shop._count.products}
                        </td>
                        <td className="px-6 py-3.5 text-right text-gray-600">
                          {shop._count.orders}
                        </td>
                        <td className="px-6 py-3.5">
                          <ShopStatusActions
                            id={shop.id}
                            status={shop.status as "DRAFT" | "ACTIVE" | "SUSPENDED"}
                            featured={shop.featuredInHome}
                            labels={statusActionLabels}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Products tab ───────────────────────────────────────────── */}
        <TabsContent value="products">
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            {products.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">{t("noProducts")}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                      <th className="text-left px-6 py-3 font-medium">{t("colProduct")}</th>
                      <th className="text-left px-6 py-3 font-medium">{t("colCategory")}</th>
                      <th className="text-left px-6 py-3 font-medium">{t("colShop")}</th>
                      <th className="text-left px-6 py-3 font-medium">{t("colLocation")}</th>
                      <th className="text-right px-6 py-3 font-medium">{t("colPrice")}</th>
                      <th className="text-right px-6 py-3 font-medium">{t("colStock")}</th>
                      <th className="text-center px-6 py-3 font-medium">{t("colHandmade")}</th>
                      <th className="text-center px-6 py-3 font-medium">{t("colFeatured")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3.5">
                          <Link
                            href={`/${locale}/shops/${product.shop.slug}/products/${product.slug}`}
                            target="_blank"
                            className="font-medium text-gray-800 hover:text-primary transition-colors max-w-[200px] truncate block"
                          >
                            {product.name}
                          </Link>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            {getProductCategoryLabel(product.category, locale === "ar" ? "ar" : "en")}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <Link
                            href={`/${locale}/shops/${product.shop.slug}`}
                            target="_blank"
                            className="text-gray-600 hover:text-primary transition-colors text-xs"
                          >
                            {product.shop.name}
                          </Link>
                        </td>
                        <td className="px-6 py-3.5 text-gray-500 text-xs">
                          {product.shop.destination?.city ?? "—"}
                        </td>
                        <td className="px-6 py-3.5 text-right font-medium text-gray-700 whitespace-nowrap">
                          {(product.price / 1000).toFixed(3)} TND
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <span className={`text-xs font-medium ${
                            product.stock === 0
                              ? "text-red-500"
                              : product.stock <= 5
                              ? "text-amber-600"
                              : "text-gray-600"
                          }`}>
                            {product.stock === 0
                              ? t("outOfStock")
                              : product.stock <= 5
                              ? `${product.stock} (${t("lowStock")})`
                              : product.stock}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-center text-xs text-gray-400">
                          {product.isHandmade ? "✓" : "—"}
                        </td>
                        <td className="px-6 py-3.5 flex justify-center">
                          <ProductFeaturedToggle productId={product.id} featured={product.featured} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Orders tab ─────────────────────────────────────────────── */}
        <TabsContent value="orders">
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            {orders.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">{t("noOrders")}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                      <th className="text-left px-6 py-3 font-medium">{t("colRef")}</th>
                      <th className="text-left px-6 py-3 font-medium">{t("colShop")}</th>
                      <th className="text-left px-6 py-3 font-medium">{t("colCustomer")}</th>
                      <th className="text-left px-6 py-3 font-medium">{t("colDelivery")}</th>
                      <th className="text-right px-6 py-3 font-medium">{t("colItems")}</th>
                      <th className="text-right px-6 py-3 font-medium">{t("colTotal")}</th>
                      <th className="text-center px-6 py-3 font-medium">{t("colStatus")}</th>
                      <th className="text-right px-6 py-3 font-medium">{t("colDate")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3.5 font-mono text-xs text-gray-700 whitespace-nowrap">
                          {order.orderRef}
                        </td>
                        <td className="px-6 py-3.5">
                          <Link
                            href={`/${locale}/shops/${order.shop.slug}`}
                            target="_blank"
                            className="text-gray-700 hover:text-primary transition-colors text-xs"
                          >
                            {order.shop.name}
                          </Link>
                        </td>
                        <td className="px-6 py-3.5">
                          <div>
                            <p className="text-gray-700">{order.user.name ?? "—"}</p>
                            <p className="text-xs text-gray-400">{order.user.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {order.deliveryMethod === "PICKUP" ? t("deliveryPickup") : t("deliveryDelivery")}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right text-gray-600">
                          {order.items.reduce((s, i) => s + i.quantity, 0)}
                        </td>
                        <td className="px-6 py-3.5 text-right font-medium text-gray-700 whitespace-nowrap">
                          {order.total} TND
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <OrderStatusBadge
                            status={order.status}
                            label={t(`orderStatus.${order.status}`)}
                          />
                        </td>
                        <td className="px-6 py-3.5 text-right text-gray-400 text-xs whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString(locale, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
