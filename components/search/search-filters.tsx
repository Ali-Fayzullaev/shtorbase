'use client'

import { useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { type Category } from '@/lib/types/database'
import { cn } from '@/lib/utils/format'

interface SearchFiltersProps {
  categories: Category[]
  onSearch: (query: string) => void
  onFilterCategory: (categoryId: string | null) => void
  onFilterUnit: (unit: string | null) => void
  onFilterStock: (stock: string | null) => void
}

export function SearchFilters({
  categories,
  onSearch,
  onFilterCategory,
  onFilterUnit,
  onFilterStock,
}: SearchFiltersProps) {
  const [query, setQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = (value: string) => {
    setQuery(value)
    onSearch(value)
  }

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск по названию или артикулу..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 py-2 text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
          />
          {query && (
            <button
              onClick={() => handleSearch('')}
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

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 glass-card rounded-lg p-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1 uppercase tracking-wider">Категория</label>
            <select
              onChange={(e) => onFilterCategory(e.target.value || null)}
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
              onChange={(e) => onFilterUnit(e.target.value || null)}
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
              onChange={(e) => onFilterStock(e.target.value || null)}
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
