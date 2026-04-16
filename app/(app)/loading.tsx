export default function DashboardLoading() {
  return (
    <div className="animate-fade-in">
      {/* Header skeleton */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md">
        <div className="flex h-14 items-center px-4 sm:px-6">
          <div className="skeleton h-5 w-24" />
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Welcome banner skeleton */}
        <div className="skeleton h-32 rounded-2xl" />

        {/* Section title */}
        <div className="flex items-center gap-2">
          <div className="skeleton h-5 w-1 rounded-full" />
          <div className="skeleton h-4 w-20" />
        </div>
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>

        {/* Section title */}
        <div className="flex items-center gap-2">
          <div className="skeleton h-5 w-1 rounded-full" />
          <div className="skeleton h-4 w-16" />
        </div>
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>

        {/* Widgets skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="skeleton h-64 rounded-2xl" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
