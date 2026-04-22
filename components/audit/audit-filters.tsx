'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SlidersHorizontal, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils/format'

interface AuditFiltersProps {
  currentField?: string
  currentAction?: string
}

const fieldOptions = [
  { value: 'price', label: 'Цена' },
  { value: 'stock', label: 'Остаток' },
  { value: 'name', label: 'Название' },
  { value: 'description', label: 'Описание' },
  { value: 'note', label: 'Заметка' },
  { value: 'status', label: 'Статус' },
  { value: 'product', label: 'Создание' },
]

const actionOptions = [
  { value: 'create', label: 'Создание' },
  { value: 'update', label: 'Изменение' },
  { value: 'delete', label: 'Удаление' },
]

export function AuditFilters({ currentField, currentAction }: AuditFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showFilters, setShowFilters] = useState(!!(currentField || currentAction))
  const hasFilters = !!(currentField || currentAction)

  const updateParams = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page')
      router.push(`/audit?${params.toString()}`)
    },
    [router, searchParams],
  )

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-zinc-200/70 bg-white/90 p-3 shadow-sm backdrop-blur dark:border-white/[0.06] dark:bg-zinc-950/70">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-medium transition-all',
              showFilters
                ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-600',
            )}
          >
            <SlidersHorizontal size={14} />
            Фильтры
          </button>

          {hasFilters && (
            <button
              onClick={() => router.push('/audit')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-[13px] font-medium text-zinc-500 transition-colors hover:text-zinc-700 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              <RotateCcw size={14} />
              Сбросить
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
            Быстрый выбор
          </span>

          <button
            onClick={() => updateParams('action', null)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-[12px] font-medium transition-all',
              !currentAction
                ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300'
                : 'border-zinc-200 bg-white text-zinc-500 hover:text-zinc-700 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-zinc-400 dark:hover:text-zinc-200'
            )}
          >
            Все действия
          </button>

          {actionOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateParams('action', currentAction === opt.value ? null : opt.value)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-[12px] font-medium transition-all',
                currentAction === opt.value
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300'
                  : 'border-zinc-200 bg-white text-zinc-500 hover:text-zinc-700 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-zinc-400 dark:hover:text-zinc-200'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 glass-card rounded-lg p-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 dark:text-zinc-500 mb-1 uppercase tracking-wider">
              Поле
            </label>
            <select
              value={currentField ?? ''}
              onChange={(e) => updateParams('field', e.target.value || null)}
              className="rounded-md border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/50 px-2.5 py-1.5 text-[13px] text-slate-600 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
            >
              <option value="">Все</option>
              {fieldOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 dark:text-zinc-500 mb-1 uppercase tracking-wider">
              Действие
            </label>
            <select
              value={currentAction ?? ''}
              onChange={(e) => updateParams('action', e.target.value || null)}
              className="rounded-md border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/50 px-2.5 py-1.5 text-[13px] text-slate-600 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
            >
              <option value="">Все</option>
              {actionOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
