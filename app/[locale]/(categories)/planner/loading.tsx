export default function PlannerLoading() {
  return (
    <div className="pb-20 animate-pulse">

      {/* ── Hero ── */}
      <section className="pt-16 pb-12 flex flex-col items-center px-4 gap-4">
        <div className="h-10 w-80 bg-gray-200 rounded-xl" />
        <div className="h-5 w-96 max-w-full bg-gray-100 rounded-full" />
      </section>

      <div className="max-w-screen-xl mx-auto px-4 md:px-20">

        {/* ── Mode cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-white p-7 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-200 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-3 w-48 bg-gray-100 rounded-full" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[0, 1, 2, 3].map((j) => (
                  <div key={j} className="h-3 bg-gray-100 rounded-full" />
                ))}
              </div>
              <div className="h-3 w-28 bg-gray-100 rounded-full" />
            </div>
          ))}
        </div>

        {/* ── Tertiary row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white px-6 py-4">
              <div className="w-9 h-9 rounded-xl bg-gray-100 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-48 bg-gray-100 rounded-full" />
              </div>
            </div>
          ))}
        </div>

        {/* ── Featured Guides ── */}
        <div className="h-5 w-48 bg-gray-200 rounded mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 space-y-3">
              <div className="h-24 bg-gray-100 rounded-xl" />
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-40 bg-gray-100 rounded-full" />
              <div className="h-3 w-24 bg-gray-100 rounded-full" />
            </div>
          ))}
        </div>

        {/* ── Popular Plans ── */}
        <div className="h-5 w-48 bg-gray-200 rounded mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 space-y-3">
              <div className="h-28 bg-gray-100 rounded-xl" />
              <div className="h-4 w-28 bg-gray-200 rounded" />
              <div className="h-3 w-36 bg-gray-100 rounded-full" />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
