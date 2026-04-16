import { Header } from '@/components/layout/header'
import { OrdersTable } from '@/components/orders/orders-table'
import { OrdersFilters } from '@/components/orders/orders-filters'
import { Pagination } from '@/components/ui/pagination'
import { getOrders, getOrderStats } from '@/lib/actions/orders'
import { Plus } from 'lucide-react'
import Link from 'next/link'

interface OrdersPageProps {
  searchParams: Promise<{
    status?: string
    q?: string
    page?: string
  }>
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams

  const [{ orders, total, page, totalPages }, stats] = await Promise.all([
    getOrders({
      status: params.status,
      search: params.q,
      page: params.page ? parseInt(params.page) : 1,
    }),
    getOrderStats(),
  ])

  return (
    <>
      <Header title="Заказы" description={`${total} заказов`}>
        <Link
          href="/orders/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          Новый заказ
        </Link>
      </Header>

      <div className="p-5 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-200/80 bg-white p-4">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Всего</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-blue-200/80 bg-blue-50/50 p-4">
            <p className="text-[11px] font-medium text-blue-400 uppercase tracking-wider">Новые</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{stats.new}</p>
          </div>
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4">
            <p className="text-[11px] font-medium text-amber-400 uppercase tracking-wider">В работе</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{stats.inProgress}</p>
          </div>
          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-4">
            <p className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">Готовы</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{stats.ready}</p>
          </div>
        </div>

        <OrdersFilters
          currentStatus={params.status}
          currentSearch={params.q}
        />
        <OrdersTable orders={orders} />
        {totalPages > 1 && (
          <Pagination currentPage={page} totalPages={totalPages} />
        )}
      </div>
    </>
  )
}
