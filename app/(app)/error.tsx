'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function SegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[SegmentError]', error.message, error.digest)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6 animate-fade-in">
      <div className="max-w-md text-center glass-card rounded-2xl p-8">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/40">
          <AlertTriangle className="text-red-600 dark:text-red-400" size={22} />
        </div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
          Не удалось загрузить страницу
        </h2>
        <p className="text-[13px] text-zinc-600 dark:text-zinc-400 mb-5">
          Попробуйте перезагрузить — если не поможет, обратитесь к администратору.
        </p>
        {error.digest && (
          <p className="text-[11px] font-mono text-zinc-400 dark:text-zinc-600 mb-4">
            ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-indigo-500 transition-colors"
        >
          <RefreshCw size={13} />
          Попробовать снова
        </button>
      </div>
    </div>
  )
}
