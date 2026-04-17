'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { type Category } from '@/lib/types/database'
import { cn } from '@/lib/utils/format'

interface CatalogFiltersProps {
  categories: Category[]
  currentSearch?: string
  currentCategory?: string
  currentUnit?: string
  currentStock?: string
}

export function CatalogFilters({
  categories,
  currentSearch,
  currentCategory,
  currentUnit,
  currentStock,
}: CatalogFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(currentSearch ?? '')
  const [showFilters, setShowFilters] = useState(
    !!(currentCategory || currentUnit || currentStock)
  )

  const updateParams = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page')
      router.push(`/catalog?${params.toString()}`)
    },
    [router, searchParams]
  )

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value)
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set('q', value)
      } else {
        params.delete('q')
      }
      params.delete('page')
      router.push(`/catalog?${params.toString()}`)
    },
    [router, searchParams]
  )

  // Debounced search on typing
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null)
  const handleInputChange = (value: string) => {
    setQuery(value)
    if (timer) clearTimeout(timer)
    const t = setTimeout(() => handleSearch(value), 400)
    setTimer(t)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск по названию или артикулу..."
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 py-2 text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
          />
          {query && (
            <button
              onClick={() => handleInputChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-medium transition-all',
            showFilters
              ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
              : 'border-slate-200 bg-white text-slate-500 hover:text-slate-700 hover:border-slate-300'
          )}
        >
          <SlidersHorizontal size={14} />
          Фильтры
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 glass-card rounded-lg p-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1 uppercase tracking-wider">Категория</label>
            <select
              value={currentCategory ?? ''}
              onChange={(e) => updateParams('category', e.target.value || null)}
              className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[13px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
            >
              <option value="">Все</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1 uppercase tracking-wider">Единица</label>
            <select
              value={currentUnit ?? ''}
              onChange={(e) => updateParams('unit', e.target.value || null)}
              className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[13px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
            >
              <option value="">Все</option>
              <option value="meter">Метр</option>
              <option value="piece">Штука</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1 uppercase tracking-wider">Наличие</label>
            <select
              value={currentStock ?? ''}
              onChange={(e) => updateParams('stock', e.target.value || null)}
              className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[13px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
            >
              <option value="">Все</option>
              <option value="in-stock">В наличии</option>
              <option value="low">Заканчивается (&lt;10)</option>
              <option value="out">Нет в наличии</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
