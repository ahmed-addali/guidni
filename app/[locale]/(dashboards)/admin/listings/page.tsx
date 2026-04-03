import { getAdminActivities, getAdminStays } from "@/lib/actions/admin";
import { FeaturedToggle } from "./_components/FeaturedToggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  void params;
  return { title: "Listings — Admin" };
}

export default async function AdminListingsPage({ params }: { params: Params }) {
  void params;

  const [activities, stays] = await Promise.all([
    getAdminActivities(),
    getAdminStays(),
  ]);

  const featuredActivities = activities.filter((a) => a.featuredInHome).length;
  const featuredStays = stays.filter((s) => s.featuredInHome).length;

  return (
    <div className="space-y-6 max-w-screen-xl">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Listings</h1>
        <p className="text-sm text-gray-400 mt-1">
          {activities.length} activities ({featuredActivities} featured) ·{" "}
          {stays.length} stays ({featuredStays} featured)
        </p>
      </div>

      <Tabs defaultValue="activities">
        <TabsList className="bg-gray-100 mb-4">
          <TabsTrigger value="activities">Activities ({activities.length})</TabsTrigger>
          <TabsTrigger value="stays">Stays ({stays.length})</TabsTrigger>
        </TabsList>

        {/* Activities tab */}
        <TabsContent value="activities">
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            {activities.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">No activities yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                      <th className="text-left px-6 py-3 font-medium">Title</th>
                      <th className="text-left px-6 py-3 font-medium">Category</th>
                      <th className="text-left px-6 py-3 font-medium">Destination</th>
                      <th className="text-left px-6 py-3 font-medium">Partner</th>
                      <th className="text-right px-6 py-3 font-medium">Price</th>
                      <th className="text-center px-6 py-3 font-medium">Featured</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {activities.map((a) => (
                      <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3.5 font-medium text-gray-800 max-w-[220px] truncate">
                          {a.title}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            {a.category}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-gray-600">
                          {a.destination?.city ?? "—"}
                        </td>
                        <td className="px-6 py-3.5 text-gray-500 text-xs">
                          {a.businessProfile.name}
                        </td>
                        <td className="px-6 py-3.5 text-right font-medium text-gray-700">
                          {a.price} TND
                        </td>
                        <td className="px-6 py-3.5 flex justify-center">
                          <FeaturedToggle id={a.id} type="activity" featured={a.featuredInHome} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Stays tab */}
        <TabsContent value="stays">
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            {stays.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">No stays yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                      <th className="text-left px-6 py-3 font-medium">Title</th>
                      <th className="text-left px-6 py-3 font-medium">Type</th>
                      <th className="text-left px-6 py-3 font-medium">Destination</th>
                      <th className="text-left px-6 py-3 font-medium">Partner</th>
                      <th className="text-right px-6 py-3 font-medium">Price</th>
                      <th className="text-center px-6 py-3 font-medium">Featured</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stays.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3.5 font-medium text-gray-800 max-w-[220px] truncate">
                          {s.title}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">
                            {s.propertyType}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-gray-600">
                          {s.destination?.city ?? "—"}
                        </td>
                        <td className="px-6 py-3.5 text-gray-500 text-xs">
                          {s.businessProfile.name}
                        </td>
                        <td className="px-6 py-3.5 text-right font-medium text-gray-700">
                          {s.price} TND
                        </td>
                        <td className="px-6 py-3.5 flex justify-center">
                          <FeaturedToggle id={s.id} type="stay" featured={s.featuredInHome} />
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
