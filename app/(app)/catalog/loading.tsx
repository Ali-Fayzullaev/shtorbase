export default function CatalogLoading() {
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
        {/* Search + filters skeleton */}
        <div className="flex items-center gap-3">
          <div className="skeleton h-10 flex-1 rounded-xl" />
          <div className="skeleton h-10 w-32 rounded-xl" />
        </div>

        {/* Product cards skeleton */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white ring-1 ring-zinc-100 overflow-hidden">
              <div className="skeleton aspect-[4/3] rounded-none" />
              <div className="p-4 space-y-3">
                <div className="skeleton h-3 w-20" />
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-3/4" />
                <div className="flex justify-between pt-2">
                  <div className="skeleton h-8 w-24 rounded-lg" />
                  <div className="skeleton h-4 w-12" />
                </div>
                <div className="skeleton h-10 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
