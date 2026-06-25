import { Suspense } from 'react'
import { Header } from '@/components/layout/header'
import { CatalogFilters } from '@/components/search/catalog-filters'
import { CatalogGrid } from '@/components/catalog/catalog-grid'
import { CartProvider, CartPanel } from '@/components/catalog/catalog-cart'
import { Pagination } from '@/components/ui/pagination'
import { PrintButton } from '@/components/ui/print-button'
import { getCatalogProducts, getCategories } from '@/lib/actions/products'
import { Download } from 'lucide-react'

interface SearchParams {
  q?: string
  category?: string
  unit?: string
  stock?: string
  page?: string
}

interface CatalogPageProps {
  searchParams: Promise<SearchParams>
}

export default function CatalogPage({ searchParams }: CatalogPageProps) {
  // Don't await here — let sub-components pull what they need inside Suspense
  return (
    <CartProvider>
      <Header title="Каталог" description="Товары со склада">
        <div className="flex items-center gap-2 no-print">
          <PrintButton />
          <Suspense fallback={null}>
            <ExportLink searchParams={searchParams} />
          </Suspense>
        </div>
      </Header>

      <div className="p-5 space-y-4">
        {/* Filters: categories are cached, render fast */}
        <Suspense fallback={<FiltersSkeleton />}>
          <FiltersSection searchParams={searchParams} />
        </Suspense>

        {/* Grid: heavy (images), streams in */}
        <Suspense fallback={<GridSkeleton />}>
          <GridSection searchParams={searchParams} />
        </Suspense>
      </div>

      <CartPanel />
    </CartProvider>
  )
}

async function ExportLink({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const qs = new URLSearchParams(
    Object.fromEntries(
      Object.entries({ q: params.q, category: params.category, unit: params.unit, stock: params.stock })
        .filter((e): e is [string, string] => !!e[1])
    )
  ).toString()
  return (
    <a
      href={`/api/export${qs ? `?${qs}` : ''}`}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-all"
    >
      <Download size={14} />
      Excel
    </a>
  )
}

async function FiltersSection({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [params, categories] = await Promise.all([
    searchParams,
    getCategories(), // cached with 'use cache'
  ])
  return (
    <CatalogFilters
      categories={categories}
      currentSearch={params.q}
      currentCategory={params.category}
      currentUnit={params.unit}
      currentStock={params.stock}
    />
  )
}

async function GridSection({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const { products, total, page, totalPages } = await getCatalogProducts({
    search: params.q,
    category: params.category,
    unit: params.unit,
    stock: params.stock,
    page: params.page ? parseInt(params.page) : 1,
  })
  return (
    <>
      <CatalogGrid products={products} total={total} />
      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} />
      )}
    </>
  )
}

function FiltersSkeleton() {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-9 w-28 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
      ))}
    </div>
  )
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="aspect-[3/4] rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
      ))}
    </div>
  )
}
