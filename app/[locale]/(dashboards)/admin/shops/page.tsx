import Link from "next/link";
import { getAdminShops, getAdminProducts, getAdminOrders } from "@/lib/actions/admin-shops";
import { getShopCategoryLabel, getProductCategoryLabel } from "@/lib/utils/shop-categories";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShopFeaturedToggle }    from "./_components/ShopFeaturedToggle";
import { ProductFeaturedToggle } from "./_components/ProductFeaturedToggle";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  void params;
  return { title: "Shops — Admin" };
}

const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING:    "Pending",
  CONFIRMED:  "Confirmed",
  PROCESSING: "Processing",
  SHIPPED:    "Shipped",
  DELIVERED:  "Delivered",
  CANCELLED:  "Cancelled",
  REFUNDED:   "Refunded",
};

const DELIVERY_LABEL: Record<string, string> = {
  PICKUP:         "Pickup",
  LOCAL_DELIVERY: "Local",
  NATIONWIDE:     "National",
  INTERNATIONAL:  "International",
};

export default async function AdminShopsPage({ params }: { params: Params }) {
  const { locale } = await params;

  const [shops, products, orders] = await Promise.all([
    getAdminShops(),
    getAdminProducts(),
    getAdminOrders(),
  ]);

  const featuredShops    = shops.filter((s) => s.featuredInHome).length;
  const featuredProducts = products.filter((p) => p.featured).length;
  const pendingOrders    = orders.filter((o) => o.status === "PENDING").length;

  return (
    <div className="space-y-6 max-w-screen-xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Shops</h1>
        <p className="text-sm text-gray-400 mt-1">
          {shops.length} shops ({featuredShops} featured) ·{" "}
          {products.length} products ({featuredProducts} featured) ·{" "}
          {orders.length} orders ({pendingOrders} pending)
        </p>
      </div>

      <Tabs defaultValue="shops">
        <TabsList className="bg-gray-100 mb-4">
          <TabsTrigger value="shops">Shops ({shops.length})</TabsTrigger>
          <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
          <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
        </TabsList>

        {/* ── Shops tab ──────────────────────────────────────────────── */}
        <TabsContent value="shops">
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            {shops.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">No shops yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                      <th className="text-left px-6 py-3 font-medium">Shop</th>
                      <th className="text-left px-6 py-3 font-medium">Category</th>
                      <th className="text-left px-6 py-3 font-medium">Location</th>
                      <th className="text-left px-6 py-3 font-medium">Partner</th>
                      <th className="text-right px-6 py-3 font-medium">Products</th>
                      <th className="text-right px-6 py-3 font-medium">Orders</th>
                      <th className="text-center px-6 py-3 font-medium">Status</th>
                      <th className="text-center px-6 py-3 font-medium">Featured</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {shops.map((shop) => (
                      <tr key={shop.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3.5">
                          <Link
                            href={`/${locale}/shops/${shop.slug}`}
                            className="font-medium text-gray-800 hover:text-primary transition-colors"
                          >
                            {shop.name}
                          </Link>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                            {getShopCategoryLabel(shop.category, "en")}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-gray-600">
                          {shop.destination?.city ?? shop.city ?? shop.country}
                        </td>
                        <td className="px-6 py-3.5 text-gray-500 text-xs">
                          <div className="flex items-center gap-1.5">
                            {shop.businessProfile.name}
                            {shop.businessProfile.isVerified && (
                              <span className="text-green-600" title="Verified">✓</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-right text-gray-600">
                          {shop._count.products}
                        </td>
                        <td className="px-6 py-3.5 text-right text-gray-600">
                          {shop._count.orders}
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                            shop.isOpen
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-gray-50 text-gray-500 border-gray-200"
                          }`}>
                            {shop.isOpen ? "Open" : "Closed"}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 flex justify-center">
                          <ShopFeaturedToggle shopId={shop.id} featured={shop.featuredInHome} />
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
              <div className="py-16 text-center text-sm text-gray-400">No products yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                      <th className="text-left px-6 py-3 font-medium">Product</th>
                      <th className="text-left px-6 py-3 font-medium">Category</th>
                      <th className="text-left px-6 py-3 font-medium">Shop</th>
                      <th className="text-left px-6 py-3 font-medium">Destination</th>
                      <th className="text-right px-6 py-3 font-medium">Price</th>
                      <th className="text-right px-6 py-3 font-medium">Stock</th>
                      <th className="text-center px-6 py-3 font-medium">Handmade</th>
                      <th className="text-center px-6 py-3 font-medium">Featured</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3.5">
                          <Link
                            href={`/${locale}/shops/${product.shop.slug}/products/${product.slug}`}
                            className="font-medium text-gray-800 hover:text-primary transition-colors max-w-[200px] truncate block"
                          >
                            {product.name}
                          </Link>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            {getProductCategoryLabel(product.category, "en")}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <Link
                            href={`/${locale}/shops/${product.shop.slug}`}
                            className="text-gray-600 hover:text-primary transition-colors text-xs"
                          >
                            {product.shop.name}
                          </Link>
                        </td>
                        <td className="px-6 py-3.5 text-gray-500 text-xs">
                          {product.shop.destination?.city ?? "—"}
                        </td>
                        <td className="px-6 py-3.5 text-right font-medium text-gray-700">
                          {product.price} TND
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <span className={`text-xs font-medium ${
                            product.stock === 0
                              ? "text-red-500"
                              : product.stock <= 5
                              ? "text-amber-600"
                              : "text-gray-600"
                          }`}>
                            {product.stock}
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
              <div className="py-16 text-center text-sm text-gray-400">No orders yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                      <th className="text-left px-6 py-3 font-medium">Ref</th>
                      <th className="text-left px-6 py-3 font-medium">Shop</th>
                      <th className="text-left px-6 py-3 font-medium">Customer</th>
                      <th className="text-left px-6 py-3 font-medium">Delivery</th>
                      <th className="text-right px-6 py-3 font-medium">Items</th>
                      <th className="text-right px-6 py-3 font-medium">Total</th>
                      <th className="text-center px-6 py-3 font-medium">Status</th>
                      <th className="text-right px-6 py-3 font-medium">Date</th>
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
                            {DELIVERY_LABEL[order.deliveryMethod] ?? order.deliveryMethod}
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
                            label={ORDER_STATUS_LABEL[order.status] ?? order.status}
                          />
                        </td>
                        <td className="px-6 py-3.5 text-right text-gray-400 text-xs whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString()}
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
