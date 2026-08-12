import { Suspense } from 'react'
import { Header } from '@/components/layout/header'
import { OrdersTable } from '@/components/orders/orders-table'
import { OrdersFilters } from '@/components/orders/orders-filters'
import { EmployeeOrderBoard } from '@/components/orders/employee-order-board'
import { OrdersRealtimeSync } from '@/components/orders/orders-realtime'
import { Pagination } from '@/components/ui/pagination'
import { getOrders, getOrderStats, getEmployees, getOrderQueue, getMyActiveOrders, getMyRecentDoneOrders } from '@/lib/actions/orders'
import { getOrderStatuses } from '@/lib/actions/settings-data'
import { requireProfile } from '@/lib/actions/profile'
import { type UserRole } from '@/lib/types/database'
import { Plus, ClipboardList, Inbox, Clock, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface SearchParams {
  status?: string
  q?: string
  page?: string
  assigned?: string
}

interface OrdersPageProps {
  searchParams: Promise<SearchParams>
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  // Shared with layout via React cache() — no extra DB call
  const profile = await requireProfile()
  const userRole = profile.role
  const userId = profile.authId

  return (
    <>
      <Header
        title={userRole === 'employee' ? 'Мои заказы' : 'Заказы'}
        description="Управление заказами"
      >
        <OrdersRealtimeSync />
        {userRole !== 'employee' && (
          <Link
            href="/orders/new"
            className="btn-press inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
          >
            <Plus size={16} />
            Новый заказ
          </Link>
        )}
      </Header>

      <div className="p-4 sm:p-6 space-y-5 page-enter">

        {/* Stats strip */}
        <Suspense fallback={<StatsSkeleton />}>
          <OrderStatsSection userId={userId} userRole={userRole} />
        </Suspense>

        {/* Сотрудник: очередь + свои заказы в работе. Менеджер/админ: таблица со всеми заказами */}
        {userRole === 'employee' ? (
          <Suspense fallback={<TableSkeleton />}>
            <EmployeeOrdersSection userId={userId} />
          </Suspense>
        ) : (
          <Suspense fallback={<TableSkeleton />}>
            <OrdersContent
              searchParams={searchParams}
              userId={userId}
              userRole={userRole}
            />
          </Suspense>
        )}

      </div>
    </>
  )
}

async function EmployeeOrdersSection({ userId }: { userId: string }) {
  const [queueOrders, activeOrders, doneOrders] = await Promise.all([
    getOrderQueue(),
    getMyActiveOrders(userId),
    getMyRecentDoneOrders(userId),
  ])

  return (
    <EmployeeOrderBoard queueOrders={queueOrders} activeOrders={activeOrders} doneOrders={doneOrders} />
  )
}

async function OrderStatsSection({ userId, userRole }: { userId: string; userRole: UserRole }) {
  const stats = await getOrderStats(userId, userRole)
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-children">
      <div className="group relative overflow-hidden rounded-2xl glass-card p-4">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-zinc-400/20 to-transparent" />
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/40 dark:bg-white/[0.06] shadow-sm">
            <ClipboardList size={18} className="text-zinc-600 dark:text-zinc-300" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Всего</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{stats.total}</p>
          </div>
        </div>
      </div>
      <div className="group relative overflow-hidden rounded-2xl glass-card p-4">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500/30 to-transparent" />
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm shadow-indigo-500/20">
            <Inbox size={18} className="text-white" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Новые</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{stats.new}</p>
          </div>
        </div>
      </div>
      <div className="group relative overflow-hidden rounded-2xl glass-card p-4">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500/30 to-transparent" />
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm shadow-amber-500/20">
            <Clock size={18} className="text-white" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">В работе</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{stats.inProgress}</p>
          </div>
        </div>
      </div>
      <div className="group relative overflow-hidden rounded-2xl glass-card p-4">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/30 to-transparent" />
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm shadow-emerald-500/20">
            <CheckCircle size={18} className="text-white" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Готовы</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{stats.ready}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

async function OrdersContent({
  searchParams,
  userId,
  userRole,
}: {
  searchParams: Promise<SearchParams>
  userId: string
  userRole: UserRole
}) {
  const params = await searchParams
  const [{ orders, total, page, totalPages }, orderStatuses, employees] = await Promise.all([
    getOrders({
      status: params.status,
      search: params.q,
      page: params.page ? parseInt(params.page) : 1,
      userId,
      userRole,
      assignedTo: params.assigned,
    }),
    getOrderStatuses(),
    userRole !== 'employee' ? getEmployees() : Promise.resolve([]),
  ])

  return (
    <>
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
    </>
  )
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
      ))}
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-14 rounded-xl bg-zinc-50 dark:bg-zinc-800/30 animate-pulse" />
      ))}
    </div>
  )
}
