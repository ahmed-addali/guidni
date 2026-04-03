import Link from "next/link";
import {
  FiUsers,
  FiBriefcase,
  FiCalendar,
  FiDollarSign,
  FiStar,
  FiActivity,
  FiHome,
  FiArrowRight,
} from "react-icons/fi";
import { getAdminStats, getAdminRecentBookings } from "@/lib/actions/admin";

type Params = Promise<{ locale: string }>;

const STATUS_COLORS: Record<string, string> = {
  PENDING:   "bg-yellow-50 text-yellow-700 border-yellow-200",
  CONFIRMED: "bg-green-50  text-green-700  border-green-200",
  CANCELLED: "bg-red-50    text-red-700    border-red-200",
  COMPLETED: "bg-gray-100  text-gray-700   border-gray-200",
};

export async function generateMetadata({ params }: { params: Params }) {
  const { locale } = await params;
  void locale;
  return { title: "Admin — Guidni" };
}

export default async function AdminOverviewPage({ params }: { params: Params }) {
  const { locale } = await params;

  const [stats, recentBookings] = await Promise.all([
    getAdminStats(),
    getAdminRecentBookings(8),
  ]);

  const base = `/${locale}/admin`;

  const statCards = [
    {
      label:    "Total Users",
      value:    stats.totalUsers.toLocaleString(),
      subLabel: "Registered accounts",
      icon:     FiUsers,
      href:     `${base}/users`,
      color:    "text-blue-600",
      bg:       "bg-blue-50",
    },
    {
      label:    "Partners",
      value:    stats.totalPartners.toLocaleString(),
      subLabel: "Business profiles",
      icon:     FiBriefcase,
      href:     `${base}/partners`,
      color:    "text-violet-600",
      bg:       "bg-violet-50",
    },
    {
      label:    "Total Bookings",
      value:    stats.totalBookings.toLocaleString(),
      subLabel: "All time",
      icon:     FiCalendar,
      href:     `${base}/bookings`,
      color:    "text-emerald-600",
      bg:       "bg-emerald-50",
    },
    {
      label:    "Platform Revenue",
      value:    `${stats.totalRevenue.toLocaleString()} TND`,
      subLabel: "All time",
      icon:     FiDollarSign,
      href:     `${base}/bookings`,
      color:    "text-orange-600",
      bg:       "bg-orange-50",
    },
    {
      label:    "Activities",
      value:    stats.totalActivities.toLocaleString(),
      subLabel: "Listed",
      icon:     FiActivity,
      href:     `${base}/listings`,
      color:    "text-primary",
      bg:       "bg-primary/10",
    },
    {
      label:    "Stays",
      value:    stats.totalStays.toLocaleString(),
      subLabel: "Listed",
      icon:     FiHome,
      href:     `${base}/listings`,
      color:    "text-teal-600",
      bg:       "bg-teal-50",
    },
    {
      label:    "Avg Rating",
      value:    stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—",
      subLabel: `${stats.totalReviews} reviews`,
      icon:     FiStar,
      href:     `${base}/listings`,
      color:    "text-yellow-500",
      bg:       "bg-yellow-50",
    },
  ];

  return (
    <div className="space-y-8 max-w-screen-xl">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Platform overview — real-time from the database.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-gray-200 transition-all space-y-3"
          >
            <div className={`h-9 w-9 rounded-xl ${card.bg} flex items-center justify-center`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 leading-tight">{card.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{card.label}</p>
              <p className="text-xs text-gray-400 mt-1">{card.subLabel}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Manage Users",        href: `${base}/users` },
          { label: "Manage Partners",     href: `${base}/partners` },
          { label: "Featured Listings",   href: `${base}/listings` },
          { label: "All Bookings",        href: `${base}/bookings` },
          { label: "Destinations",        href: `${base}/destinations` },
          { label: "Partner Dashboard",   href: `/${locale}/partner` },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-between gap-2"
          >
            {item.label}
            <FiArrowRight className="h-3.5 w-3.5 shrink-0 text-gray-300" />
          </Link>
        ))}
      </div>

      {/* Recent bookings */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Recent Bookings</h2>
          <Link
            href={`${base}/bookings`}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            View all <FiArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">No bookings yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                  <th className="text-left px-6 py-3 font-medium">Ref</th>
                  <th className="text-left px-6 py-3 font-medium">Listing</th>
                  <th className="text-left px-6 py-3 font-medium">Type</th>
                  <th className="text-left px-6 py-3 font-medium">Customer</th>
                  <th className="text-left px-6 py-3 font-medium">Date</th>
                  <th className="text-right px-6 py-3 font-medium">Amount</th>
                  <th className="text-left px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-xs text-gray-500">{b.bookingRef}</td>
                    <td className="px-6 py-3.5 font-medium text-gray-800 max-w-[200px] truncate">{b.title}</td>
                    <td className="px-6 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        b.type === "activity"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-teal-50 text-teal-700"
                      }`}>
                        {b.type}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-gray-600">{b.customer}</td>
                    <td className="px-6 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(b.date).toLocaleDateString()}
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
