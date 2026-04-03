import { getAllGuidniReviews, getListingsForBadgeAdmin } from "@/lib/actions/admin-badges";
import { GuidniReviewsTable } from "./_components/GuidniReviewsTable";
import { BadgeAssignmentSection } from "./_components/BadgeAssignmentSection";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  void params;
  return { title: "Badges & Reviews — Admin" };
}

export default async function AdminBadgesPage({ params }: { params: Params }) {
  void params;

  const [reviews, listings] = await Promise.all([
    getAllGuidniReviews(),
    getListingsForBadgeAdmin(),
  ]);

  const byStatus = reviews.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-screen-xl">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Badges & Guidni Reviews</h1>
        <p className="text-sm text-gray-400 mt-1">
          {reviews.length} total · {byStatus.PENDING ?? 0} pending ·{" "}
          {byStatus.PUBLISHED ?? 0} published · {byStatus.WITHDRAWN ?? 0} withdrawn
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {(["PENDING", "SCHEDULED", "UNDER_REVIEW", "PUBLISHED", "WITHDRAWN"] as const).map((s) => (
          <div key={s} className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-2xl font-bold text-gray-900">{byStatus[s] ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1">{s.replace("_", " ")}</p>
          </div>
        ))}
      </div>

      {/* Badge assignment */}
      <BadgeAssignmentSection
        activities={listings.activities}
        stays={listings.stays}
        restaurants={listings.restaurants}
        shops={listings.shops}
        transfers={listings.transfers}
      />

      {/* Guidni Reviews table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <GuidniReviewsTable reviews={reviews} />
      </div>
    </div>
  );
}
