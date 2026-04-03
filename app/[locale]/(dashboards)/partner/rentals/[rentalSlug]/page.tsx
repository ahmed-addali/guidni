import Link from "next/link";
import { notFound } from "next/navigation";
import { FiChevronLeft } from "react-icons/fi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMyRentalBySlug } from "@/lib/actions/partner-rentals";
import { getPartnerRentalReservations } from "@/lib/actions/rental-reservations";
import { getDestinations } from "@/lib/actions/destinations";
import { DetailsTab }      from "./_components/DetailsTab";
import { ImagesTab }       from "./_components/ImagesTab";
import { ReservationsTab } from "./_components/ReservationsTab";

type Params = Promise<{ locale: string; rentalSlug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { rentalSlug } = await params;
  const rental = await getMyRentalBySlug(rentalSlug);
  return { title: `${rental?.title ?? "Rental"} · Partner Dashboard` };
}

export default async function EditRentalPage({ params }: { params: Params }) {
  const { locale, rentalSlug } = await params;
  const [rental, destinations] = await Promise.all([
    getMyRentalBySlug(rentalSlug),
    getDestinations(),
  ]);
  if (!rental) notFound();

  const reservations = await getPartnerRentalReservations(rental.id);

  return (
    <div className="space-y-6 max-w-screen-lg">
      <Link
        href={`/${locale}/partner/rentals`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
      >
        <FiChevronLeft className="h-4 w-4" />
        Rentals
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 truncate">{rental.title}</h1>
        <p className="text-sm text-gray-400 mt-1">Manage your rental listing.</p>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="images">Images ({rental.images.length})</TabsTrigger>
          <TabsTrigger value="reservations">Reservations ({reservations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <DetailsTab
            rental={rental as any}
            destinations={destinations.map((d) => ({
              id: d.id,
              label: `${d.city}, ${d.country}`,
              city: d.city,
              country: d.country,
              region: d.region ?? "",
            }))}
          />
        </TabsContent>

        <TabsContent value="images">
          <ImagesTab rentalId={rental.id} images={rental.images} />
        </TabsContent>

        <TabsContent value="reservations">
          <ReservationsTab initialReservations={reservations as any} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
