export default function OrdersLoading() {
  return (
    <div className="animate-fade-in">
      {/* Header skeleton */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md">
        <div className="flex h-14 items-center px-4 sm:px-6">
          <div className="skeleton h-5 w-24" />
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {/* Filters skeleton */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="skeleton h-10 w-48 rounded-xl" />
          <div className="skeleton h-10 w-32 rounded-xl" />
          <div className="skeleton h-10 w-32 rounded-xl" />
        </div>

        {/* Table skeleton */}
        <div className="rounded-2xl bg-white ring-1 ring-zinc-100 overflow-hidden">
          {/* Table header */}
          <div className="skeleton h-12 rounded-none" />
          {/* Table rows */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-zinc-50">
              <div className="skeleton h-4 w-10" />
              <div className="skeleton h-4 flex-1" />
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-6 w-20 rounded-full" />
              <div className="skeleton h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
