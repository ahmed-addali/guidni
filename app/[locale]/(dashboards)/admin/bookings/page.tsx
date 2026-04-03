import { getAdminAllBookings } from "@/lib/actions/admin";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  void params;
  return { title: "Bookings — Admin" };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:   "bg-yellow-50 text-yellow-700 border-yellow-200",
  CONFIRMED: "bg-green-50  text-green-700  border-green-200",
  CANCELLED: "bg-red-50    text-red-700    border-red-200",
  COMPLETED: "bg-gray-100  text-gray-700   border-gray-200",
};

export default async function AdminBookingsPage({ params }: { params: Params }) {
  void params;

  const bookings = await getAdminAllBookings();

  const totalRevenue = bookings.reduce((sum, b) => sum + b.amount, 0);
  const byStatus = bookings.reduce<Record<string, number>>((acc, b) => {
    acc[b.status] = (acc[b.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-screen-xl">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="text-sm text-gray-400 mt-1">
          {bookings.length} total · {byStatus.PENDING ?? 0} pending ·{" "}
          {byStatus.CONFIRMED ?? 0} confirmed · {byStatus.CANCELLED ?? 0} cancelled
        </p>
      </div>

      {/* Revenue summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Bookings",  value: bookings.length.toString() },
          { label: "Total Revenue",   value: `${totalRevenue.toLocaleString()} TND` },
          { label: "Pending",         value: (byStatus.PENDING ?? 0).toString() },
          { label: "Confirmed",       value: (byStatus.CONFIRMED ?? 0).toString() },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {bookings.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">No bookings yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                  <th className="text-left px-6 py-3 font-medium">Ref</th>
                  <th className="text-left px-6 py-3 font-medium">Listing</th>
                  <th className="text-left px-6 py-3 font-medium">Type</th>
                  <th className="text-left px-6 py-3 font-medium">Customer</th>
                  <th className="text-left px-6 py-3 font-medium">Booked On</th>
                  <th className="text-left px-6 py-3 font-medium">Check-in</th>
                  <th className="text-right px-6 py-3 font-medium">Amount</th>
                  <th className="text-left px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-xs text-gray-500">{b.bookingRef}</td>
                    <td className="px-6 py-3.5 font-medium text-gray-800 max-w-[200px] truncate">
                      {b.title}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        b.type === "Activity"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-teal-50 text-teal-700"
                      }`}>
                        {b.type}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div>
                        <p className="text-gray-700">{b.customer}</p>
                        <p className="text-xs text-gray-400">{b.customerEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(b.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(b.checkIn).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5 text-right font-semibold text-gray-700">
                      {b.amount.toLocaleString()} TND
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[b.status] ?? ""}`}>
                        {b.status.charAt(0) + b.status.slice(1).toLowerCase()}
                      </span>
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
