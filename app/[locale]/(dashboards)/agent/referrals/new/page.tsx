import { notFound } from "next/navigation";
import { getMyAgentProfile } from "@/lib/actions/agent";
import { CreateReferralForm } from "./_components/CreateReferralForm";

type Params = Promise<{ locale: string }>;

export async function generateMetadata() {
  return { title: "Refer a Partner — Agent Dashboard" };
}

export default async function NewReferralPage({ params }: { params: Params }) {
  const { locale } = await params;

  const profile = await getMyAgentProfile();
  if (!profile) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Refer a Partner</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Know a business that should be on Guidni? Submit their details and earn up to 105 points.
        </p>
      </div>

      {/* Points breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { pts: "+5",  label: "They sign up" },
          { pts: "+20", label: "Admin verifies" },
          { pts: "+30", label: "First listing" },
          { pts: "+50", label: "First booking" },
        ].map(({ pts, label }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-xl px-3 py-3 text-center">
            <p className="text-lg font-bold text-primary">{pts}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8">
        <CreateReferralForm locale={locale} />
      </div>
    </div>
  );
}
