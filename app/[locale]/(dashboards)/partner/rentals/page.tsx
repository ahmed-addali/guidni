import Link from "next/link";
import Image from "next/image";
import { FiPlus } from "react-icons/fi";
import { TbCar } from "react-icons/tb";
import { getMyRentals } from "@/lib/actions/partner-rentals";

export async function generateMetadata() {
  return { title: "Rentals · Partner Dashboard" };
}

const TYPE_LABELS: Record<string, string> = {
  CAR: "Car", BIKE: "Bike", SCOOTER: "Scooter", BOAT: "Boat", OTHER: "Vehicle",
};

export default async function PartnerRentalsPage() {
  const rentals = await getMyRentals();

  return (
    <div className="space-y-6 max-w-screen-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rentals</h1>
          <p className="text-sm text-gray-400 mt-1">Manage your rental fleet.</p>
        </div>
        <Link
          href="rentals/new"
          className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
        >
          <FiPlus className="h-4 w-4" />
          Add rental
        </Link>
      </div>

      {rentals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white border border-gray-100 rounded-2xl">
          <TbCar className="h-16 w-16 text-gray-200" />
          <div className="text-center">
            <p className="font-medium text-gray-700">No rentals yet</p>
            <p className="text-sm text-gray-400 mt-1">Add your first vehicle to start accepting bookings.</p>
          </div>
          <Link
            href="rentals/new"
            className="mt-1 flex items-center gap-1.5 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <FiPlus className="h-4 w-4" />
            Add rental
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="divide-y divide-gray-100">
            {rentals.map((r) => (
              <div key={r.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="relative h-14 w-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  {r.images[0] ? (
                    <Image src={r.images[0].url} alt={r.title} fill className="object-cover" sizes="80px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <TbCar className="h-7 w-7 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{r.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {TYPE_LABELS[r.type] ?? r.type}
                    {(r.brand || r.model) && ` · ${[r.brand, r.model].filter(Boolean).join(" ")}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-gray-900">{r.pricePerDay} TND/day</p>
                  <p className="text-xs text-gray-400 mt-0.5">{r._count.reservations} booking{r._count.reservations !== 1 ? "s" : ""}</p>
                </div>
                <Link
                  href={`rentals/${r.slug}`}
                  className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:border-gray-400 transition-colors shrink-0"
                >
                  Edit
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
