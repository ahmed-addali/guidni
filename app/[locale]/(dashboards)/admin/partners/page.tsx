import { getAdminPartners } from "@/lib/actions/admin";
import { VerifyToggle } from "./_components/VerifyToggle";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  void params;
  return { title: "Partners — Admin" };
}

export default async function AdminPartnersPage({ params }: { params: Params }) {
  void params;

  const partners = await getAdminPartners();

  return (
    <div className="space-y-6 max-w-screen-xl">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Partners</h1>
        <p className="text-sm text-gray-400 mt-1">{partners.length} business profiles</p>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {partners.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">No partners yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                  <th className="text-left px-6 py-3 font-medium">Business</th>
                  <th className="text-left px-6 py-3 font-medium">Owner</th>
                  <th className="text-left px-6 py-3 font-medium">Category</th>
                  <th className="text-left px-6 py-3 font-medium">Location</th>
                  <th className="text-left px-6 py-3 font-medium">Listings</th>
                  <th className="text-left px-6 py-3 font-medium">Verified</th>
                  <th className="text-left px-6 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {partners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5">
                      <div>
                        <p className="font-medium text-gray-800">{partner.name}</p>
                        {partner.website && (
                          <p className="text-xs text-gray-400 truncate max-w-[160px]">
                            {partner.website}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div>
                        <p className="text-gray-700">{partner.user.name}</p>
                        <p className="text-xs text-gray-400">{partner.user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {partner.categories.join(", ")}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-gray-600">
                      {partner.destination?.city ?? partner.region}
                    </td>
                    <td className="px-6 py-3.5 text-gray-600">
                      {partner._count.activities} activities, {partner._count.stays} stays
                    </td>
                    <td className="px-6 py-3.5">
                      <VerifyToggle profileId={partner.id} verified={partner.isVerified} />
                    </td>
                    <td className="px-6 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(partner.createdAt).toLocaleDateString()}
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
