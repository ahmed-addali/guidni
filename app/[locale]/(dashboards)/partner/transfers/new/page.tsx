import { getDestinations } from "@/lib/actions/destinations";
import { CreateTransferWizard } from "./_components/CreateTransferWizard";

export async function generateMetadata() {
  return { title: "New Transfer · Partner Dashboard" };
}

export default async function NewTransferPage() {
  const raw = await getDestinations();
  const destinations = raw.map((d) => ({
    id: d.id,
    city: d.city,
    country: d.country,
    region: d.region ?? "",
  }));
  return (
    <div className="max-w-2xl mx-auto">
      <CreateTransferWizard destinations={destinations} />
    </div>
  );
}
