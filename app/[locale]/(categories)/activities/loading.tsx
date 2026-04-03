import { Skeleton } from "@/components/ui/skeleton";

export default function ActivitiesLoading() {
  return (
    <div className="py-8 space-y-8">
      {/* Header skeleton */}
      <div className="text-center max-w-3xl mx-auto px-4 space-y-3">
        <Skeleton className="h-10 w-72 mx-auto" />
        <Skeleton className="h-5 w-96 mx-auto" />
      </div>

      {/* Category filter skeleton */}
      <div className="flex gap-2 px-4 sm:px-6 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full shrink-0" />
        ))}
      </div>

      {/* Grid skeleton */}
      <section className="px-4 sm:px-6">
        <Skeleton className="h-4 w-32 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
