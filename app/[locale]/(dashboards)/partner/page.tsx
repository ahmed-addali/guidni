import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  FiCalendar,
  FiDollarSign,
  FiStar,
  FiActivity,
  FiHome,
  FiArrowRight,
  FiTrendingUp,
} from "react-icons/fi";
import {
  getPartnerDashboardStats,
  getPartnerRecentBookings,
  getPartnerReviews,
  getMyBusinessProfile,
} from "@/lib/actions/partner";

type Params = Promise<{ locale: string }>;

const STATUS_COLORS: Record<string, string> = {
  PENDING:   "bg-yellow-50 text-yellow-700 border-yellow-200",
  CONFIRMED: "bg-green-50  text-green-700  border-green-200",
  CANCELLED: "bg-red-50    text-red-700    border-red-200",
  COMPLETED: "bg-gray-100  text-gray-700   border-gray-200",
};

export async function generateMetadata({ params }: { params: Params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PartnerDashboard" });
  return { title: t("title") };
}

export default async function PartnerOverviewPage({ params }: { params: Params }) {
  const { locale } = await params;

  const [stats, recentBookings, allReviews, profile] = await Promise.all([
    getPartnerDashboardStats(),
    getPartnerRecentBookings(5),
    getPartnerReviews(),
    getMyBusinessProfile(),
  ]);

  const recentReviews = allReviews.slice(0, 4);

  const base = `/${locale}/partner`;

  const statCards = [
    {
      label:    "Total Revenue",
      value:    stats ? `${stats.totalRevenue.toLocaleString()} TND` : "—",
      subLabel: "This month",
      subValue: stats ? `+${stats.currentMonthRevenue.toLocaleString()} TND` : "",
      icon:     FiDollarSign,
      href:     `${base}/earnings`,
      color:    "text-emerald-600",
      bg:       "bg-emerald-50",
    },
    {
      label:    "Total Bookings",
      value:    stats?.totalBookings.toString() ?? "0",
      subLabel: "This month",
      subValue: stats ? `+${stats.currentMonthBookings}` : "",
      icon:     FiCalendar,
      href:     `${base}/bookings`,
      color:    "text-blue-600",
      bg:       "bg-blue-50",
    },
    {
      label:    "Upcoming",
      value:    stats?.upcomingBookings.toString() ?? "0",
      subLabel: "Confirmed bookings",
      subValue: "",
      icon:     FiTrendingUp,
      href:     `${base}/bookings`,
      color:    "text-violet-600",
      bg:       "bg-violet-50",
    },
    {
      label:    "Rating",
      value:    stats ? stats.rating.toFixed(1) : "—",
      subLabel: `${stats?.totalReviews ?? 0} reviews`,
      subValue: "",
      icon:     FiStar,
      href:     `${base}/reviews`,
      color:    "text-yellow-500",
      bg:       "bg-yellow-50",
    },
    {
      label:    "Activities",
      value:    stats?.totalActivities.toString() ?? "0",
      subLabel: "Listed",
      subValue: "",
      icon:     FiActivity,
      href:     `${base}/activities`,
      color:    "text-orange-600",
      bg:       "bg-orange-50",
    },
    {
      label:    "Stays",
      value:    stats?.totalStays.toString() ?? "0",
      subLabel: "Listed",
      subValue: "",
      icon:     FiHome,
      href:     `${base}/stays`,
      color:    "text-primary",
      bg:       "bg-primary/10",
    },
  ];

  return (
    <div className="space-y-8 max-w-screen-xl">
      {/* Page heading */}
      <div className="flex items-center gap-4">
        {profile?.profileImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.profileImage}
            alt={profile.name}
            className="h-14 w-14 rounded-full object-cover border border-gray-100 shrink-0"
          />
        ) : profile ? (
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-primary">
              {profile.name.charAt(0).toUpperCase()}
            </span>
          </div>
        ) : null}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {profile ? profile.name : "Dashboard"}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Welcome back — here's what's happening.</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
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
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{card.label}</p>
              {card.subValue && (
                <p className="text-xs text-emerald-600 font-medium mt-1">{card.subValue} {card.subLabel}</p>
              )}
              {!card.subValue && card.subLabel && (
                <p className="text-xs text-gray-400 mt-1">{card.subLabel}</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom section: bookings + reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Bookings */}
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
            <ul className="divide-y divide-gray-100">
              {recentBookings.map((b) => (
                <li key={b.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{b.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {b.customer} · {new Date(b.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <span className="text-sm font-semibold text-gray-700">
                      {b.amount.toLocaleString()} TND
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[b.status] ?? ""}`}>
                      {b.status.charAt(0) + b.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Reviews */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Recent Reviews</h2>
            <Link
              href={`${base}/reviews`}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View all <FiArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {recentReviews.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400">No reviews yet.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentReviews.map((r) => (
                <li key={r.id} className="px-6 py-4 space-y-1 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <FiStar
                        key={i}
                        className={`h-3.5 w-3.5 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
                      />
                    ))}
                    <span className="text-xs text-gray-400 ml-1">{r.rating.toFixed(1)}</span>
                    {!r.response && (
                      <span className="ml-auto text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full">
                        Awaiting reply
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">{r.comment}</p>
                  <p className="text-xs text-gray-400">
                    {r.user.name ?? "Guest"} · {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
