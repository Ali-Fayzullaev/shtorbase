'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Search, X, Filter } from 'lucide-react'
import { type OrderStatusConfig } from '@/lib/types/database'
import { cn } from '@/lib/utils/format'

interface OrdersFiltersProps {
  currentStatus?: string
  currentSearch?: string
  currentAssigned?: string
  statuses: OrderStatusConfig[]
  employees?: { id: string; full_name: string; role: string }[]
  showEmployeeFilter?: boolean
}

export function OrdersFilters({ currentStatus, currentSearch, currentAssigned, statuses, employees, showEmployeeFilter }: OrdersFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(currentSearch ?? '')

  const filterTabs = [
    { value: 'all', label: 'Все' },
    ...statuses.map((s) => ({ value: s.slug, label: s.label })),
  ]

  function updateParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    params.delete('page')
    router.push(`/orders?${params.toString()}`)
  }

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="rounded-2xl border border-zinc-200/70 bg-white/90 p-3 shadow-sm backdrop-blur dark:border-white/[0.06] dark:bg-zinc-950/70">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') updateParams({ q: search || undefined })
              }}
              placeholder="Поиск по номеру, клиенту или заметке..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-9 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all dark:border-white/[0.06] dark:bg-white/[0.04] dark:text-zinc-100"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); updateParams({ q: undefined }) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors dark:hover:bg-white/[0.06]"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Executor filter */}
          {showEmployeeFilter && employees && employees.length > 0 && (
            <div className="relative min-w-[220px]">
              <Filter size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <select
                value={currentAssigned ?? ''}
                onChange={(e) => updateParams({ assigned: e.target.value || undefined })}
                className="appearance-none w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-8 py-2.5 text-sm text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all dark:border-white/[0.06] dark:bg-white/[0.04] dark:text-zinc-300"
              >
                <option value="">Все исполнители</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
            Быстрый статус
          </span>
          {filterTabs.map((s) => (
            <button
              key={s.value}
              onClick={() => updateParams({ status: s.value === 'all' ? undefined : s.value })}
              className={cn(
                'btn-press whitespace-nowrap rounded-full border px-3 py-1.5 text-[12px] font-medium transition-all duration-200',
                (currentStatus ?? 'all') === s.value
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300'
                  : 'border-zinc-200 bg-white text-zinc-500 hover:text-zinc-700 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-zinc-400 dark:hover:text-zinc-200'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
