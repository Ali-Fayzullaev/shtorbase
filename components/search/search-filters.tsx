'use client'

import { useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { type Category } from '@/lib/types/database'

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
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Поиск по названию или артикулу..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          {query && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
            showFilters
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border bg-card text-muted hover:text-foreground hover:border-foreground/20'
          }`}
        >
          <SlidersHorizontal size={16} />
          Фильтры
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Категория</label>
            <select
              onChange={(e) => onFilterCategory(e.target.value || null)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Все</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">Единица</label>
            <select
              onChange={(e) => onFilterUnit(e.target.value || null)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Все</option>
              <option value="meter">Метр</option>
              <option value="piece">Штука</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">Наличие</label>
            <select
              onChange={(e) => onFilterStock(e.target.value || null)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
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
