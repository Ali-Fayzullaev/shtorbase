export default function Loading() {
  return (
    <div className="animate-fade-in">
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
        <div className="flex h-14 items-center px-4 sm:px-6">
          <div className="skeleton h-5 w-52" />
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-800 to-transparent" />
      </div>
      <div className="p-4 sm:p-6 max-w-5xl space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
          <div className="space-y-3">
            <div className="skeleton aspect-square rounded-2xl" />
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton aspect-square rounded-lg" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="skeleton h-7 w-64 rounded-md" />
            <div className="skeleton h-5 w-40" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-20 rounded-xl" />
              ))}
            </div>
            <div className="skeleton h-24 rounded-xl" />
            <div className="flex gap-2">
              <div className="skeleton h-10 w-32 rounded-xl" />
              <div className="skeleton h-10 w-36 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
