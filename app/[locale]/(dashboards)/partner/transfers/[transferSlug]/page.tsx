import Link from "next/link";
import { notFound } from "next/navigation";
import { FiChevronLeft } from "react-icons/fi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMyTransferBySlug } from "@/lib/actions/partner-transfers";
import { getPartnerTransferReservations } from "@/lib/actions/transfer-reservations";
import { getDestinations } from "@/lib/actions/destinations";
import { DetailsTab }      from "./_components/DetailsTab";
import { ImagesTab }       from "./_components/ImagesTab";
import { ReservationsTab } from "./_components/ReservationsTab";

type Params = Promise<{ locale: string; transferSlug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { transferSlug } = await params;
  const transfer = await getMyTransferBySlug(transferSlug);
  return { title: `${transfer?.title ?? "Transfer"} · Partner Dashboard` };
}

export default async function EditTransferPage({ params }: { params: Params }) {
  const { locale, transferSlug } = await params;
  const [transfer, destinations] = await Promise.all([
    getMyTransferBySlug(transferSlug),
    getDestinations(),
  ]);
  if (!transfer) notFound();

  const reservations = await getPartnerTransferReservations(transfer.id);

  return (
    <div className="space-y-6 max-w-screen-lg">
      <Link
        href={`/${locale}/partner/transfers`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
      >
        <FiChevronLeft className="h-4 w-4" />
        Transfers
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 truncate">{transfer.title}</h1>
        <p className="text-sm text-gray-400 mt-1">Manage your transfer listing.</p>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="images">Images ({transfer.images.length})</TabsTrigger>
          <TabsTrigger value="reservations">Reservations ({reservations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <DetailsTab
            transfer={transfer as any}
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
          <ImagesTab transferId={transfer.id} images={transfer.images} />
        </TabsContent>

        <TabsContent value="reservations">
          <ReservationsTab initialReservations={reservations as any} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
