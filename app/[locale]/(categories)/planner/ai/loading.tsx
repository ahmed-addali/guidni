export default function AIPlannerLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 animate-pulse">

      {/* Back link */}
      <div className="h-4 w-24 bg-gray-100 rounded-full mb-8" />

      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 rounded-2xl bg-gray-200 shrink-0" />
        <div className="space-y-2">
          <div className="h-7 w-48 bg-gray-200 rounded" />
          <div className="h-3.5 w-64 bg-gray-100 rounded-full" />
        </div>
      </div>

      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-0 mb-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-gray-200 shrink-0" />
              {i < 3 && <div className="h-0.5 w-16 sm:w-24 bg-gray-100" />}
            </div>
          ))}
        </div>
        <div className="h-4 w-40 bg-gray-200 rounded mb-1.5" />
        <div className="h-3 w-56 bg-gray-100 rounded-full" />
      </div>

      {/* Step card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 min-h-72 space-y-6">
        <div className="space-y-3">
          <div className="h-4 w-36 bg-gray-200 rounded" />
          <div className="h-11 bg-gray-100 rounded-xl" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-28 bg-gray-200 rounded" />
          <div className="flex gap-2 flex-wrap">
            {[48, 56, 40, 52, 44].map((w, i) => (
              <div key={i} className={`h-10 w-${w > 50 ? 14 : 12} bg-gray-100 rounded-xl`} />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>

      {/* Nav buttons */}
      <div className="flex items-center justify-between mt-5">
        <div className="h-9 w-20 bg-gray-100 rounded-xl" />
        <div className="h-9 w-24 bg-gray-200 rounded-xl" />
      </div>

    </div>
  );
}
