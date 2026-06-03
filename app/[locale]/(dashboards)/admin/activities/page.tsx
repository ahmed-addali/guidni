import { getAdminActivities } from "@/lib/actions/admin";
import { ActivityStatusActions } from "./_components/ActivityStatusActions";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  void params;
  return { title: "Activities — Admin" };
}

export default async function AdminActivitiesPage({ params }: { params: Params }) {
  void params;

  const activities = await getAdminActivities();

  const counts = activities.reduce(
    (acc, a) => {
      acc[a.status as keyof typeof acc] = (acc[a.status as keyof typeof acc] ?? 0) + 1;
      return acc;
    },
    { ACTIVE: 0, DRAFT: 0, SUSPENDED: 0 } as Record<string, number>
  );

  return (
    <div className="space-y-6 max-w-screen-xl">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
        <p className="text-sm text-gray-400 mt-1">
          {activities.length} total · {counts.ACTIVE} active · {counts.DRAFT} draft ·{" "}
          {counts.SUSPENDED} suspended
        </p>
      </div>

      {/* Table */}
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
                  <th className="text-left px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activities.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-gray-800 max-w-[220px]">
                      <span className="block truncate">{a.title}</span>
                      <span className="text-xs text-gray-400 font-normal">{a.slug}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        {a.categories[0] ?? "—"}
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
                    <td className="px-6 py-3.5">
                      <ActivityStatusActions
                        id={a.id}
                        status={a.status as "ACTIVE" | "SUSPENDED" | "DRAFT"}
                        featured={a.featuredInHome}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
