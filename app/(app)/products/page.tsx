import { Suspense } from 'react'
import { Header } from '@/components/layout/header'
import { CatalogFilters } from '@/components/search/catalog-filters'
import { ProductsManagementTable } from '@/components/products/products-management-table'
import { Pagination } from '@/components/ui/pagination'
import { getCatalogProducts, getCategories } from '@/lib/actions/products'
import { requireProfile } from '@/lib/actions/profile'
import { redirect } from 'next/navigation'
import { Plus } from 'lucide-react'
import Link from 'next/link'

interface SearchParams {
  q?: string
  category?: string
  unit?: string
  stock?: string
  page?: string
}

interface ProductsPageProps {
  searchParams: Promise<SearchParams>
}

// Управление товарами (менеджер/админ): цена и остаток редактируются прямо
// в таблице, есть удаление. /catalog остаётся чистым просмотром для заказа.
export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const profile = await requireProfile()
  if (profile.role === 'employee') {
    redirect('/')
  }

  return (
    <>
      <Header title="Товары" description="Управление ассортиментом">
        <Link
          href="/products/new"
          className="btn-press inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
        >
          <Plus size={16} />
          Добавить товар
        </Link>
      </Header>

      <div className="p-5 space-y-4">
        <Suspense fallback={<FiltersSkeleton />}>
          <FiltersSection searchParams={searchParams} />
        </Suspense>

        <Suspense fallback={<TableSkeleton />}>
          <TableSection searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  )
}

async function FiltersSection({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [params, categories] = await Promise.all([searchParams, getCategories()])
  return (
    <CatalogFilters
      categories={categories}
      currentSearch={params.q}
      currentCategory={params.category}
      currentUnit={params.unit}
      currentStock={params.stock}
      basePath="/products"
    />
  )
}

async function TableSection({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const { products, total, page, totalPages } = await getCatalogProducts({
    search: params.q,
    category: params.category,
    unit: params.unit,
    stock: params.stock,
    page: params.page ? parseInt(params.page) : 1,
    pageSize: 50,
  })
  return (
    <>
      <p className="text-[12px] text-slate-400 dark:text-zinc-500">Всего товаров: {total}</p>
      <ProductsManagementTable products={products} />
      {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} basePath="/products" />}
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

function TableSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-14 rounded-xl bg-zinc-50 dark:bg-zinc-800/30 animate-pulse" />
      ))}
    </div>
  )
}
