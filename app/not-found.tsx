import Link from 'next/link'
import { Compass, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 animate-fade-in">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/40">
          <Compass className="text-indigo-600 dark:text-indigo-400" size={26} />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">404</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
          Страница не найдена или была перемещена.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
        >
          <Home size={14} />
          На главную
        </Link>
      </div>
    </div>
  )
}
