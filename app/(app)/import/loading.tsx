export default function Loading() {
  return (
    <div className="animate-fade-in">
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
        <div className="flex h-14 items-center px-4 sm:px-6">
          <div className="skeleton h-5 w-32" />
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-800 to-transparent" />
      </div>
      <div className="p-4 sm:p-6 max-w-2xl space-y-5">
        <div className="skeleton h-24 rounded-2xl" />
        <div className="skeleton h-40 rounded-2xl" />
        <div className="skeleton h-10 w-32 rounded-xl" />
      </div>
    </div>
  )
}
