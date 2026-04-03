import Link from "next/link";
import { FiChevronLeft } from "react-icons/fi";
import { getMyBusinessProfile } from "@/lib/actions/partner";
import { getDestinations } from "@/lib/actions/destinations";
import { CreateRentalWizard } from "./_components/CreateRentalWizard";

type Params = Promise<{ locale: string }>;

export async function generateMetadata() {
  return { title: "New Rental · Partner Dashboard" };
}

export default async function NewRentalPage({ params }: { params: Params }) {
  const { locale } = await params;
  const [profile, destinations] = await Promise.all([
    getMyBusinessProfile(),
    getDestinations(),
  ]);

  return (
    <div className="space-y-6 max-w-screen-md">
      <Link
        href={`/${locale}/partner/rentals`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
      >
        <FiChevronLeft className="h-4 w-4" />
        Rentals
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Rental</h1>
        <p className="text-sm text-gray-400 mt-1">List a vehicle for guests to rent.</p>
      </div>
      <CreateRentalWizard
        profileCountry={profile?.country}
        profileRegion={profile?.region}
        profilePhone={profile?.phone ?? undefined}
        destinations={destinations.map((d) => ({
          id: d.id,
          label: `${d.city}, ${d.country}`,
          city: d.city,
          country: d.country,
          region: d.region ?? "",
        }))}
      />
    </div>
  );
}
