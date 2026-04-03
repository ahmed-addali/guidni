import { GeneratingSkeleton } from "./_components/GeneratingSkeleton";

export default function PlannerLoading() {
  return (
    <div className="max-w-screen-lg mx-auto px-4 py-10">
      <div className="mb-10 text-center space-y-2">
        <div className="h-10 w-72 bg-gray-100 rounded-xl animate-pulse mx-auto" />
        <div className="h-4 w-56 bg-gray-50 rounded-full animate-pulse mx-auto" />
      </div>
      <GeneratingSkeleton />
    </div>
  );
}
