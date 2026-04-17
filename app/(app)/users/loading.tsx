export default function Loading() {
  return (
    <div className="animate-fade-in">
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
        <div className="flex h-14 items-center px-4 sm:px-6">
          <div className="skeleton h-5 w-36" />
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-800 to-transparent" />
      </div>
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="skeleton h-8 w-48 rounded-lg" />
          <div className="skeleton h-9 w-32 rounded-xl" />
        </div>
        <div className="glass-card rounded-2xl divide-y divide-zinc-100 dark:divide-zinc-800">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              <div className="skeleton h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-4 w-40" />
                <div className="skeleton h-3 w-56" />
              </div>
              <div className="skeleton h-6 w-20 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
