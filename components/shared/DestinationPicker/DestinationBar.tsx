import { getDestinations } from "@/lib/actions/destinations";
import { DestinationPicker } from "./DestinationPicker";
import { MaxWidthWrapper } from "@/components/shared/MaxWidthWrapper";

export async function DestinationBar() {
  const destinations = await getDestinations();

  if (destinations.length === 0) return null;

  return (
    <div className="bg-white border-b border-gray-100 py-2">
      <MaxWidthWrapper>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 hidden sm:block">
            Destination:
          </span>
          <DestinationPicker destinations={destinations} />
        </div>
      </MaxWidthWrapper>
    </div>
  );
}
