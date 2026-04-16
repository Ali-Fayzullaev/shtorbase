import { Header } from '@/components/layout/header'
import { OrdersTable } from '@/components/orders/orders-table'
import { OrdersFilters } from '@/components/orders/orders-filters'
import { Pagination } from '@/components/ui/pagination'
import { getOrders, getOrderStats, getEmployees } from '@/lib/actions/orders'
import { getOrderStatuses } from '@/lib/actions/settings-data'
import { createClient } from '@/lib/supabase/server'
import { type UserRole } from '@/lib/types/database'
import { Plus, ClipboardList, Inbox, Clock, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

interface OrdersPageProps {
  searchParams: Promise<{
    status?: string
    q?: string
    page?: string
    assigned?: string
  }>
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const userRole = (profile?.role ?? 'employee') as UserRole

  const [{ orders, total, page, totalPages }, stats, orderStatuses, employees] = await Promise.all([
    getOrders({
      status: params.status,
      search: params.q,
      page: params.page ? parseInt(params.page) : 1,
      userId: user.id,
      userRole,
      assignedTo: params.assigned,
    }),
    getOrderStats(user.id, userRole),
    getOrderStatuses(),
    userRole !== 'employee' ? getEmployees() : Promise.resolve([]),
  ])

  return (
    <>
      <Header
        title={userRole === 'employee' ? 'Мои заказы' : 'Заказы'}
        description={userRole === 'employee' ? `${total} назначенных вам` : `${total} заказов`}
      >
        <Link
          href="/orders/new"
          className="btn-press inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
        >
          <Plus size={16} />
          Новый заказ
        </Link>
      </Header>

      <div className="p-4 sm:p-6 space-y-5 page-enter">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-children">
          <div className="group relative overflow-hidden rounded-2xl bg-white border border-zinc-200/60 p-4 transition-all duration-300 hover:shadow-md hover:shadow-zinc-200/50">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-zinc-400/20 to-transparent" />
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 shadow-sm">
                <ClipboardList size={18} className="text-zinc-600" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Всего</p>
                <p className="text-2xl font-bold text-zinc-900 tabular-nums">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-2xl bg-white border border-zinc-200/60 p-4 transition-all duration-300 hover:shadow-md hover:shadow-indigo-100/50">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500/30 to-transparent" />
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm shadow-indigo-500/20">
                <Inbox size={18} className="text-white" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Новые</p>
                <p className="text-2xl font-bold text-zinc-900 tabular-nums">{stats.new}</p>
              </div>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-2xl bg-white border border-zinc-200/60 p-4 transition-all duration-300 hover:shadow-md hover:shadow-amber-100/50">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500/30 to-transparent" />
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm shadow-amber-500/20">
                <Clock size={18} className="text-white" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">В работе</p>
                <p className="text-2xl font-bold text-zinc-900 tabular-nums">{stats.inProgress}</p>
              </div>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-2xl bg-white border border-zinc-200/60 p-4 transition-all duration-300 hover:shadow-md hover:shadow-emerald-100/50">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/30 to-transparent" />
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm shadow-emerald-500/20">
                <CheckCircle size={18} className="text-white" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Готовы</p>
                <p className="text-2xl font-bold text-zinc-900 tabular-nums">{stats.ready}</p>
              </div>
            </div>
          </div>
        </div>

        <OrdersFilters
          currentStatus={params.status}
          currentSearch={params.q}
          currentAssigned={params.assigned}
          statuses={orderStatuses}
          employees={employees}
          showEmployeeFilter={userRole !== 'employee'}
        />
        <OrdersTable orders={orders} userRole={userRole} statuses={orderStatuses} />
        {totalPages > 1 && (
          <Pagination currentPage={page} totalPages={totalPages} />
        )}
      </div>
    </>
  )
}
