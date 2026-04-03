import Link from "next/link";
import { MapPin } from "lucide-react";

export default function PlanNotFound() {
  return (
    <div className="max-w-screen-lg mx-auto px-4 py-20 text-center">
      <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-5">
        <MapPin className="h-8 w-8 text-gray-400" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Plan not found</h1>
      <p className="text-gray-400 text-sm mb-6">
        This itinerary doesn&apos;t exist or is no longer available.
      </p>
      <Link
        href="./planner"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Create a new plan
      </Link>
    </div>
  );
}
