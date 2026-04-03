export default function ShopsLoading() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 pb-12 space-y-6">
      {/* Hero skeleton */}
      <div className="py-10 space-y-3">
        <div className="h-10 w-64 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-4 w-96 bg-gray-100 rounded-lg animate-pulse" />
      </div>

      {/* Mode toggle skeleton */}
      <div className="h-10 w-56 bg-gray-100 rounded-xl animate-pulse" />

      {/* Category filter skeleton */}
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-9 w-28 bg-gray-100 rounded-full animate-pulse shrink-0" />
        ))}
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="h-44 bg-gray-100 animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-1/3 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
