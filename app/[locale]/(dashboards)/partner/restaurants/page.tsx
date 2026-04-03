import { getPartnerRestaurants } from "@/lib/actions/partner-restaurants";
import { RestaurantsClient } from "./_components/RestaurantsClient";

export async function generateMetadata() {
  return { title: "Restaurants · Partner Dashboard" };
}

export default async function PartnerRestaurantsPage() {
  const restaurants = await getPartnerRestaurants();

  return (
    <div className="space-y-6 max-w-screen-xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Restaurants</h1>
        <p className="text-sm text-gray-400 mt-1">Manage your restaurant listings.</p>
      </div>
      <RestaurantsClient restaurants={restaurants as any} />
    </div>
  );
}
