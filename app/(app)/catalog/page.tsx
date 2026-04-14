import { Header } from '@/components/layout/header'
import { CatalogFilters } from '@/components/search/catalog-filters'
import { ProductTable } from '@/components/products/product-table'
import { Pagination } from '@/components/ui/pagination'
import { PrintButton } from '@/components/ui/print-button'
import { getCatalogProducts, getCategories } from '@/lib/actions/products'
import { Download } from 'lucide-react'

interface CatalogPageProps {
  searchParams: Promise<{
    q?: string
    category?: string
    unit?: string
    stock?: string
    page?: string
  }>
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams

  const [{ products, total, page, totalPages }, categories] = await Promise.all([
    getCatalogProducts({
      search: params.q,
      category: params.category,
      unit: params.unit,
      stock: params.stock,
      page: params.page ? parseInt(params.page) : 1,
    }),
    getCategories(),
  ])

  return (
    <>
      <Header title="Каталог" description={`${total} товаров`}>
        <div className="flex items-center gap-2 no-print">
          <PrintButton />
          <a
            href={`/api/export?${new URLSearchParams(Object.fromEntries(Object.entries({ q: params.q, category: params.category, unit: params.unit, stock: params.stock }).filter((e): e is [string, string] => !!e[1]))).toString()}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-all"
          >
            <Download size={14} />
            Excel
          </a>
        </div>
      </Header>

      <div className="p-5 space-y-4">
        <CatalogFilters
          categories={categories}
          currentSearch={params.q}
          currentCategory={params.category}
          currentUnit={params.unit}
          currentStock={params.stock}
        />
        <ProductTable products={products} />
        {totalPages > 1 && (
          <Pagination currentPage={page} totalPages={totalPages} />
        )}
      </div>
    </>
  )
}
