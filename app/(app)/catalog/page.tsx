'use client'

import { useState, useMemo } from 'react'
import { Header } from '@/components/layout/header'
import { SearchFilters } from '@/components/search/search-filters'
import { ProductTable } from '@/components/products/product-table'
import { demoProducts, demoCategories } from '@/lib/demo-data'
import { Download } from 'lucide-react'
import { type Product } from '@/lib/types/database'

export default function CatalogPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [unitFilter, setUnitFilter] = useState<string | null>(null)
  const [stockFilter, setStockFilter] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let result: Product[] = demoProducts

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      )
    }

    if (categoryFilter) {
      result = result.filter((p) => p.category_id === categoryFilter)
    }

    if (unitFilter) {
      result = result.filter((p) => p.unit === unitFilter)
    }

    if (stockFilter === 'in-stock') {
      result = result.filter((p) => p.stock >= 10)
    } else if (stockFilter === 'low') {
      result = result.filter((p) => p.stock > 0 && p.stock < 10)
    } else if (stockFilter === 'out') {
      result = result.filter((p) => p.stock === 0)
    }

    return result
  }, [searchQuery, categoryFilter, unitFilter, stockFilter])

  return (
    <>
      <Header title="Каталог товаров" description={`${filtered.length} из ${demoProducts.length} товаров`}>
        <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-muted hover:text-foreground hover:border-foreground/20 transition-all">
          <Download size={16} />
          Excel
        </button>
      </Header>

      <div className="p-6 space-y-4">
        <SearchFilters
          categories={demoCategories}
          onSearch={setSearchQuery}
          onFilterCategory={setCategoryFilter}
          onFilterUnit={setUnitFilter}
          onFilterStock={setStockFilter}
        />
        <ProductTable products={filtered} />
      </div>
    </>
  )
}
