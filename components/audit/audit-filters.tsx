'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SlidersHorizontal } from 'lucide-react'
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
      <div className="flex items-center gap-2">
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
