export default function Loading() {
  return (
    <div className="animate-fade-in">
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
        <div className="flex h-14 items-center px-4 sm:px-6">
          <div className="skeleton h-5 w-40" />
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-800 to-transparent" />
      </div>
      <div className="p-4 sm:p-5 space-y-4">
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-7 w-24 rounded-full" />
          ))}
        </div>
        <div className="skeleton h-11 rounded-2xl" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
