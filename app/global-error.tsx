'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Централизованное логирование (Sentry подключится сюда позже).
    console.error('[GlobalError]', error.message, error.digest)
  }, [error])

  return (
    <html lang="ru">
      <body className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased">
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/40">
              <AlertTriangle className="text-red-600 dark:text-red-400" size={26} />
            </div>
            <h1 className="text-xl font-semibold mb-2">Что-то пошло не так</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
              Произошла непредвиденная ошибка. Мы уже знаем о ней.
            </p>
            {error.digest && (
              <p className="text-[11px] font-mono text-zinc-400 dark:text-zinc-600 mb-6">ID: {error.digest}</p>
            )}
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              <RefreshCw size={14} />
              Попробовать снова
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
