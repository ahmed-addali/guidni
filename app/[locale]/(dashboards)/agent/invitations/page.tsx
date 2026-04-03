import Link from "next/link";
import { notFound } from "next/navigation";
import { FiSend, FiClock } from "react-icons/fi";
import { getMyInvitations } from "@/lib/actions/agent";
import { InvitationList } from "./_components/InvitationList";

type Params   = Promise<{ locale: string }>;
type SearchParams = Promise<{ page?: string }>;

export async function generateMetadata() {
  return { title: "My Invitations — Agent Dashboard" };
}

export default async function InvitationsPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { locale }  = await params;
  const { page }    = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10));

  const { invitations, total } = await getMyInvitations(currentPage, 20);
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6 max-w-screen-lg">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Invitations</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total invitation{total !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href={`/${locale}/agent/new-invitation`}
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <FiSend className="h-3.5 w-3.5" />
          New invitation
        </Link>
      </div>

      {invitations.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl py-20 text-center">
          <FiClock className="h-10 w-10 text-gray-200 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-1">No invitations yet</h2>
          <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
            Send your first invitation to a tourist and start earning commissions.
          </p>
          <Link
            href={`/${locale}/agent/new-invitation`}
            className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <FiSend className="h-3.5 w-3.5" />
            Send invitation
          </Link>
        </div>
      ) : (
        <InvitationList invitations={invitations} locale={locale} />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {currentPage > 1 && (
            <Link
              href={`/${locale}/agent/invitations?page=${currentPage - 1}`}
              className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link
              href={`/${locale}/agent/invitations?page=${currentPage + 1}`}
              className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
