import Image from "next/image";
import { getAdminUsers } from "@/lib/actions/admin";
import { UserRoleSelect } from "./_components/UserRoleSelect";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  void params;
  return { title: "Users — Admin" };
}

export default async function AdminUsersPage({ params }: { params: Params }) {
  void params;

  const users = await getAdminUsers();

  const roleCounts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-screen-xl">
      {/* Heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-400 mt-1">
            {users.length} total — {roleCounts.ADMIN ?? 0} admins,{" "}
            {roleCounts.PARTNER ?? 0} partners, {roleCounts.USER ?? 0} users
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {users.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                  <th className="text-left px-6 py-3 font-medium">User</th>
                  <th className="text-left px-6 py-3 font-medium">Email</th>
                  <th className="text-left px-6 py-3 font-medium">Role</th>
                  <th className="text-left px-6 py-3 font-medium">Bookings</th>
                  <th className="text-left px-6 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => {
                  const totalBookings =
                    user._count.activityReservations + user._count.staysReservations;
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          {user.image ? (
                            <Image
                              src={user.image}
                              alt={user.name}
                              width={32}
                              height={32}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium text-gray-800">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-gray-500">{user.email}</td>
                      <td className="px-6 py-3.5">
                        <UserRoleSelect userId={user.id} currentRole={user.role} />
                      </td>
                      <td className="px-6 py-3.5 text-gray-600">{totalBookings}</td>
                      <td className="px-6 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
