import { getTranslations } from "next-intl/server";
import { Heart } from "lucide-react";
import Link from "next/link";
import { getWishlist } from "@/lib/actions/wishlist";
import { getShopCategoryLabel } from "@/lib/utils/shop-categories";
import { ActivityCard } from "@/components/activities/ActivityCard";
import { StayCard } from "@/components/stays/StayCard";
import { RestaurantCard } from "@/components/restaurants/RestaurantCard";
import { ShopCard } from "@/components/shops/ShopCard";
import { ProductCard } from "@/components/shops/ProductCard";
import { TransferCard } from "@/components/transfers/TransferCard";
import { RentalCard } from "@/components/rentals/RentalCard";

type Props = { params: Promise<{ locale: string }> };

export default async function WishlistPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("WishlistPage");
  const { activities, stays, restaurants, shops, products, transfers, rentals } = await getWishlist();

  const isEmpty =
    activities.length === 0 &&
    stays.length === 0 &&
    restaurants.length === 0 &&
    shops.length === 0 &&
    products.length === 0 &&
    transfers.length === 0 &&
    rentals.length === 0;

  return (
    <div className="max-w-screen-xl mx-auto px-4 md:px-20 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
        <Heart className="h-7 w-7 fill-rose-500 text-rose-500" />
      </div>
      <p className="text-gray-500 mb-10">{t("subtitle")}</p>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Heart className="h-16 w-16 text-gray-200 mb-6" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            {t("emptyTitle")}
          </h2>
          <p className="text-gray-400 mb-8 max-w-sm">{t("emptyHint")}</p>
          <div className="flex gap-3">
            <Link
              href={`/${locale}/activities`}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
            >
              {t("browseActivities")}
            </Link>
            <Link
              href={`/${locale}/stays`}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t("browseStays")}
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Activities section */}
          {activities.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {t("activitiesTitle")}{" "}
                <span className="text-gray-400 font-normal text-base">
                  ({activities.length})
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {activities.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    locale={locale}
                    initialIsWishlisted={true}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Stays section */}
          {stays.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {t("staysTitle")}{" "}
                <span className="text-gray-400 font-normal text-base">
                  ({stays.length})
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {stays.map((stay) => (
                  <StayCard
                    key={stay.id}
                    stay={stay}
                    locale={locale}
                    initialIsWishlisted={true}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Restaurants section */}
          {restaurants.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {t("restaurantsTitle")}{" "}
                <span className="text-gray-400 font-normal text-base">
                  ({restaurants.length})
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {restaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    locale={locale}
                    initialIsWishlisted={true}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Shops section */}
          {shops.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {t("shopsTitle")}{" "}
                <span className="text-gray-400 font-normal text-base">
                  ({shops.length})
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {shops.map((shop) => (
                  <ShopCard
                    key={shop.id}
                    id={shop.id}
                    slug={shop.slug}
                    name={shop.name}
                    arabicName={shop.arabicName}
                    category={shop.category}
                    categoryLabel={getShopCategoryLabel(shop.category, locale)}
                    city={shop.city ?? shop.destination?.city ?? null}
                    country={shop.country}
                    note={shop.note}
                    nbReviews={shop.nbReviews}
                    coverPhoto={shop.coverPhoto ?? shop.images[0]?.url ?? null}
                    logo={shop.logo}
                    deliveryMethods={shop.deliveryMethods as never}
                    productImages={shop.products.flatMap((p) => p.images.map((i) => i.url))}
                    locale={locale}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Products section */}
          {products.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {t("productsTitle")}{" "}
                <span className="text-gray-400 font-normal text-base">
                  ({products.length})
                </span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    slug={product.slug}
                    shopSlug={product.shop.slug}
                    name={product.name}
                    shopName={product.shop.name}
                    price={product.price}
                    comparePrice={product.comparePrice}
                    isHandmade={product.isHandmade}
                    imageUrl={product.images[0]?.url ?? null}
                    locale={locale}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Rentals section */}
          {rentals.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {t("rentalsTitle")}{" "}
                <span className="text-gray-400 font-normal text-base">
                  ({rentals.length})
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {rentals.map((rental) => (
                  <RentalCard
                    key={rental.id}
                    id={rental.id}
                    slug={rental.slug}
                    title={rental.title}
                    type={rental.type as "CAR" | "BIKE" | "SCOOTER" | "BOAT" | "OTHER"}
                    pricePerDay={rental.pricePerDay}
                    capacity={rental.capacity}
                    brand={rental.brand}
                    model={rental.model}
                    city={rental.city ?? rental.destination?.city ?? null}
                    country={rental.country}
                    coverImage={rental.images[0]?.url ?? null}
                    locale={locale}
                    initialIsWishlisted={true}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Transfers section */}
          {transfers.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {t("transfersTitle")}{" "}
                <span className="text-gray-400 font-normal text-base">
                  ({transfers.length})
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {transfers.map((transfer) => (
                  <TransferCard
                    key={transfer.id}
                    id={transfer.id}
                    slug={transfer.slug}
                    title={transfer.title}
                    type={transfer.type as "AIRPORT_TRANSFER" | "TAXI" | "CHAUFFEUR" | "SHUTTLE"}
                    pricePerTrip={transfer.pricePerTrip}
                    pricePerHour={transfer.pricePerHour}
                    pricePerPerson={transfer.pricePerPerson}
                    capacity={transfer.capacity}
                    city={transfer.city ?? transfer.destination?.city ?? null}
                    country={transfer.country}
                    coverImage={transfer.images[0]?.url ?? null}
                    locale={locale}
                    initialIsWishlisted={true}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
