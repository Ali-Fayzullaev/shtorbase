'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils/format'

const statuses = [
  { value: 'all', label: 'Все' },
  { value: 'new', label: 'Новые' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'ready', label: 'Готовы' },
  { value: 'delivered', label: 'Выданы' },
  { value: 'cancelled', label: 'Отменены' },
]

interface OrdersFiltersProps {
  currentStatus?: string
  currentSearch?: string
}

export function OrdersFilters({ currentStatus, currentSearch }: OrdersFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(currentSearch ?? '')

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
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') updateParams({ q: search || undefined })
          }}
          placeholder="Поиск по заказам..."
          className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
        {search && (
          <button
            onClick={() => { setSearch(''); updateParams({ q: undefined }) }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Status filter */}
      <div className="flex gap-1 overflow-x-auto">
        {statuses.map((s) => (
          <button
            key={s.value}
            onClick={() => updateParams({ status: s.value === 'all' ? undefined : s.value })}
            className={cn(
              'whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
              (currentStatus ?? 'all') === s.value
                ? 'bg-primary text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
