import Link from "next/link";
import { notFound } from "next/navigation";
import { FiTrendingUp, FiArrowRight } from "react-icons/fi";
import { getMyEarnings, getMyEarningsStats } from "@/lib/actions/agent";
import { RequestPayoutButton } from "./_components/RequestPayoutButton";

type Params       = Promise<{ locale: string }>;
type SearchParams  = Promise<{ page?: string }>;

export async function generateMetadata() {
  return { title: "Earnings — Agent Dashboard" };
}

export default async function EarningsPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { locale }  = await params;
  const { page }    = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10));

  const [stats, { earnings, total }] = await Promise.all([
    getMyEarningsStats(),
    getMyEarnings(currentPage, 20),
  ]);
  if (!stats) notFound();

  const totalPages = Math.ceil(total / 20);

  const statusConfig: Record<string, { label: string; className: string }> = {
    PENDING:   { label: "Pending",   className: "bg-yellow-50 text-yellow-700 border-yellow-100" },
    CONFIRMED: { label: "Confirmed", className: "bg-blue-50 text-blue-700 border-blue-100" },
    PAID:      { label: "Paid",      className: "bg-green-50 text-green-700 border-green-100" },
    CANCELLED: { label: "Cancelled", className: "bg-gray-50 text-gray-500 border-gray-100" },
  };

  return (
    <div className="space-y-6 max-w-screen-lg">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
          <p className="text-gray-500 text-sm mt-0.5">Your commission history and payout status.</p>
        </div>
        <RequestPayoutButton
          confirmedAmount={stats.confirmed}
          locale={locale}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "All-time earned",   value: `${stats.allTime.toFixed(2)} TND`,   sub: undefined },
          { label: "Pending",           value: `${stats.pending.toFixed(2)} TND`,   sub: "awaiting confirmation" },
          { label: "Confirmed",         value: `${stats.confirmed.toFixed(2)} TND`, sub: stats.confirmed >= 25 ? "ready to request payout" : `${(25 - stats.confirmed).toFixed(2)} TND more to unlock payout` },
          { label: "Paid out",          value: `${stats.paid.toFixed(2)} TND`,      sub: undefined },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-2xl p-5 space-y-1">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{label}</p>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            {sub && <p className="text-xs text-gray-400">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Table */}
      {earnings.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl py-20 text-center">
          <FiTrendingUp className="h-10 w-10 text-gray-200 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-1">No earnings yet</h2>
          <p className="text-sm text-gray-400 max-w-xs mx-auto">
            Commissions appear here once a tourist books via one of your invitation links.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <span>Booking</span>
            <span className="text-right">Booking amt</span>
            <span className="text-right">Commission</span>
            <span>Status</span>
          </div>

          <div className="divide-y divide-gray-50">
            {earnings.map((e) => {
              const s = statusConfig[e.status] ?? statusConfig.PENDING;
              return (
                <div key={e.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{e.bookingRef}</p>
                    <p className="text-xs text-gray-400">
                      {e.listingType} · {new Date(e.createdAt).toLocaleDateString()} · {(e.commissionRate * 100).toFixed(0)}%
                    </p>
                  </div>
                  <p className="text-sm text-gray-700 text-right">{Number(e.bookingAmount).toFixed(2)} TND</p>
                  <p className="text-sm font-semibold text-gray-900 text-right">{Number(e.commissionAmount).toFixed(2)} TND</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${s.className}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {currentPage > 1 && (
            <Link href={`/${locale}/agent/earnings?page=${currentPage - 1}`} className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              Previous
            </Link>
          )}
          <span className="text-sm text-gray-500">Page {currentPage} of {totalPages}</span>
          {currentPage < totalPages && (
            <Link href={`/${locale}/agent/earnings?page=${currentPage + 1}`} className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
