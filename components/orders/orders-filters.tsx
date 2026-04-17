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
    <div className="flex flex-col sm:flex-row gap-3 animate-fade-in">
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
          placeholder="Поиск по заказам..."
          className="w-full rounded-xl border border-white/30 dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.04] backdrop-blur-md pl-10 pr-9 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 dark:focus:border-indigo-700 transition-all shadow-sm"
        />
        {search && (
          <button
            onClick={() => { setSearch(''); updateParams({ q: undefined }) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Status filter */}
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-white/30 dark:bg-white/[0.04] backdrop-blur-md border border-white/30 dark:border-white/[0.06] p-1">
        {filterTabs.map((s) => (
          <button
            key={s.value}
            onClick={() => updateParams({ status: s.value === 'all' ? undefined : s.value })}
            className={cn(
              'btn-press whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-200',
              (currentStatus ?? 'all') === s.value
                ? 'bg-white/70 dark:bg-white/[0.08] text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Executor filter */}
      {showEmployeeFilter && employees && employees.length > 0 && (
        <div className="relative">
          <Filter size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <select
            value={currentAssigned ?? ''}
            onChange={(e) => updateParams({ assigned: e.target.value || undefined })}
            className="appearance-none rounded-xl border border-white/30 dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.04] backdrop-blur-md pl-10 pr-8 py-2.5 text-sm text-zinc-600 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 dark:focus:border-indigo-700 transition-all shadow-sm"
          >
            <option value="">Все исполнители</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.full_name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
