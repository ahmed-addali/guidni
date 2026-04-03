import { getPartnerDashboardStats, getPartnerAllBookings } from "@/lib/actions/partner";
import { FiDollarSign, FiTrendingUp, FiCalendar } from "react-icons/fi";

export async function generateMetadata() {
  return { title: "Earnings · Partner Dashboard" };
}

export default async function PartnerEarningsPage() {
  const [stats, bookings] = await Promise.all([
    getPartnerDashboardStats(),
    getPartnerAllBookings(),
  ]);

  const paidBookings = bookings.filter(
    (b) => b.status === "COMPLETED" || b.status === "CONFIRMED"
  );

  // Group by month for summary
  const monthlyMap = new Map<string, number>();
  for (const b of paidBookings) {
    const key = new Date(b.date).toLocaleDateString("en", { month: "short", year: "numeric" });
    monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + b.amount);
  }
  const monthly = [...monthlyMap.entries()]
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .slice(-6);

  const statCards = [
    {
      label:    "Total Revenue",
      value:    `${(stats?.totalRevenue ?? 0).toLocaleString()} TND`,
      subLabel: "All time",
      icon:     FiDollarSign,
      color:    "text-emerald-600",
      bg:       "bg-emerald-50",
    },
    {
      label:    "This Month",
      value:    `${(stats?.currentMonthRevenue ?? 0).toLocaleString()} TND`,
      subLabel: "Current month",
      icon:     FiTrendingUp,
      color:    "text-blue-600",
      bg:       "bg-blue-50",
    },
    {
      label:    "Paid Bookings",
      value:    paidBookings.length.toString(),
      subLabel: "Confirmed + Completed",
      icon:     FiCalendar,
      color:    "text-violet-600",
      bg:       "bg-violet-50",
    },
  ];

  return (
    <div className="space-y-8 max-w-screen-lg">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
        <p className="text-sm text-gray-400 mt-1">Revenue summary across all your listings.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
            <div className={`h-9 w-9 rounded-xl ${card.bg} flex items-center justify-center`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{card.label}</p>
              <p className="text-xs text-gray-400">{card.subLabel}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly breakdown */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h2 className="font-semibold text-gray-800 mb-5">Monthly Revenue</h2>
        {monthly.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No revenue data yet.</p>
        ) : (
          <div className="space-y-3">
            {monthly.map(([month, amount]) => {
              const max = Math.max(...monthly.map(([, a]) => a));
              const pct = max > 0 ? (amount / max) * 100 : 0;
              return (
                <div key={month} className="flex items-center gap-4">
                  <span className="text-sm text-gray-500 w-24 shrink-0">{month}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 w-28 text-right shrink-0">
                    {amount.toLocaleString()} TND
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-6 italic">
          Full earnings charts with payout management coming in Phase 20 (Payment integration).
        </p>
      </div>

      {/* Transaction list */}
      {paidBookings.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ref</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Listing</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paidBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{b.bookingRef}</td>
                    <td className="px-5 py-3.5 text-gray-700 truncate max-w-[200px]">{b.title}</td>
                    <td className="px-5 py-3.5 text-gray-500">{new Date(b.date).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                        b.status === "COMPLETED"
                          ? "bg-gray-100 text-gray-700 border-gray-200"
                          : "bg-green-50 text-green-700 border-green-200"
                      }`}>
                        {b.status.charAt(0) + b.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-gray-700">
                      {b.amount.toLocaleString()} TND
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
