import { Header } from '@/components/layout/header'
import { LowStockWidget } from '@/components/dashboard/low-stock-widget'
import { RecentChangesWidget } from '@/components/dashboard/recent-changes-widget'
import { OrdersTrendChart } from '@/components/dashboard/orders-trend-chart'
import { StatusDonutChart } from '@/components/dashboard/status-donut-chart'
import { LowStockAlert } from '@/components/ui/low-stock-alert'
import { getDashboardStats, getLowStockProducts, getRecentAuditLogs } from '@/lib/actions/products'
import { getOrderStats, getOrderChartData } from '@/lib/actions/orders'
import { createClient } from '@/lib/supabase/server'
import { type UserRole } from '@/lib/types/database'
import { Package, PackageX, AlertTriangle, ClipboardList, Clock, CheckCircle, Inbox, Plus } from 'lucide-react'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const roleLabels: Record<UserRole, string> = {
  employee: 'Сотрудник',
  manager: 'Менеджер',
  admin: 'Администратор',
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 6) return 'Доброй ночи'
  if (h < 12) return 'Доброе утро'
  if (h < 18) return 'Добрый день'
  return 'Добрый вечер'
}

function getDisplayName(name: string) {
  if (name.includes('@')) return name.split('@')[0]
  const first = name.split(/\s+/)[0]
  return first || name
}

function getDateParts() {
  const now = new Date()
  return {
    day: now.getDate(),
    month: now.toLocaleDateString('ru', { month: 'long' }),
    weekday: now.toLocaleDateString('ru', { weekday: 'long' }),
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()
  const userRole = (profile?.role ?? 'employee') as UserRole
  const userName = profile?.full_name ?? user.email ?? ''

  const [stats, lowStockProducts, logs, orderStats, chartData] = await Promise.all([
    getDashboardStats(),
    getLowStockProducts(),
    getRecentAuditLogs(),
    getOrderStats(user.id, userRole),
    getOrderChartData(user.id, userRole),
  ])

  const date = getDateParts()

  return (
    <>
      <Header title="Главная" description="Обзор склада" />

      <LowStockAlert count={stats.lowStock + stats.outOfStock} />

      <div className="p-4 sm:p-6 space-y-5 page-enter">

        {/* ── Welcome banner ── */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white px-6 py-5 text-zinc-900 dark:border-white/[0.06] dark:bg-zinc-950 dark:text-white">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.05] dark:opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '20px 20px' }}
          />
          <div className="absolute left-0 top-5 bottom-5 w-[3px] rounded-r-full bg-gradient-to-b from-indigo-500 via-violet-500 to-transparent" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 pl-3">
              <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-widest text-zinc-500 dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-400">
                {roleLabels[userRole]}
              </span>
              <h2 className="font-display mt-3 text-3xl sm:text-4xl font-normal leading-tight text-zinc-900 dark:text-white">
                {getGreeting()},<br />{getDisplayName(userName)}
              </h2>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {orderStats.new > 0
                  ? `${orderStats.new} ${orderStats.new === 1 ? 'новый заказ ждёт обработки' : 'новых заказов ждут обработки'}`
                  : 'Все заказы обработаны — отличная работа.'}
              </p>
              <div className="mt-4 flex items-center gap-2.5 flex-wrap">
                <Link href="/orders/new" className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 px-3 py-1.5 text-xs font-medium text-white transition-colors">
                  <Plus size={12} />Новый заказ
                </Link>
                <Link href="/catalog" className="inline-flex items-center rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors dark:border-white/10 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] dark:text-zinc-300">
                  Каталог
                </Link>
                {(userRole === 'manager' || userRole === 'admin') && (
                  <Link href="/products/new" className="inline-flex items-center rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors dark:border-white/10 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] dark:text-zinc-300">
                    + Товар
                  </Link>
                )}
              </div>
            </div>
            <div className="shrink-0 text-right hidden sm:block select-none">
              <div className="font-display text-6xl font-normal text-zinc-800/90 dark:text-white/80 leading-none tabular-nums">{date.day}</div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">{date.month}</div>
              <div className="mt-0.5 text-[10px] text-zinc-400 dark:text-zinc-600 capitalize">{date.weekday}</div>
            </div>
          </div>
        </div>

        {/* ── Metric strip ── */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
          {/* Orders group */}
          <Link href="/orders" className="group col-span-3 sm:col-span-1 flex flex-col gap-1 rounded-2xl border border-zinc-200/80 bg-white/80 px-4 py-3.5 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/[0.07] dark:bg-zinc-900/60">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">Заказов</span>
              <ClipboardList size={13} className="text-indigo-400" />
            </div>
            <span className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 transition-colors">{orderStats.total}</span>
          </Link>
          <Link href="/orders?status=new" className="group flex flex-col gap-1 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-3.5 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 dark:border-indigo-500/10 dark:bg-indigo-500/5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-indigo-400">Новые</span>
              <Inbox size={13} className="text-indigo-400" />
            </div>
            <span className="text-2xl font-bold tabular-nums text-indigo-700 dark:text-indigo-300">{orderStats.new}</span>
          </Link>
          <Link href="/orders?status=in_progress" className="group flex flex-col gap-1 rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3.5 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 dark:border-amber-500/10 dark:bg-amber-500/5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-amber-500">В работе</span>
              <Clock size={13} className="text-amber-400" />
            </div>
            <span className="text-2xl font-bold tabular-nums text-amber-700 dark:text-amber-300">{orderStats.inProgress}</span>
          </Link>
          <Link href="/orders?status=ready" className="group flex flex-col gap-1 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3.5 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 dark:border-emerald-500/10 dark:bg-emerald-500/5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-500">Готовы</span>
              <CheckCircle size={13} className="text-emerald-400" />
            </div>
            <span className="text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{orderStats.ready}</span>
          </Link>
          {/* Stock */}
          <Link href="/catalog" className="group flex flex-col gap-1 rounded-2xl border border-zinc-200/80 bg-white/80 px-4 py-3.5 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/[0.07] dark:bg-zinc-900/60">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">Товаров</span>
              <Package size={13} className="text-violet-400" />
            </div>
            <span className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100 group-hover:text-violet-600 transition-colors">{stats.total}</span>
          </Link>
          <div className="flex flex-col gap-2">
            <div className={`flex flex-1 items-center justify-between rounded-xl border px-3 py-2 ${stats.outOfStock > 0 ? 'border-red-100 bg-red-50/70 dark:border-red-500/10 dark:bg-red-500/5' : 'border-zinc-100 bg-zinc-50/60 dark:border-white/[0.05] dark:bg-white/[0.02]'}`}>
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-400">Нет</div>
                <div className={`text-lg font-bold tabular-nums ${stats.outOfStock > 0 ? 'text-red-600 dark:text-red-400' : 'text-zinc-500'}`}>{stats.outOfStock}</div>
              </div>
              <PackageX size={14} className={stats.outOfStock > 0 ? 'text-red-400' : 'text-zinc-300'} />
            </div>
            <div className={`flex flex-1 items-center justify-between rounded-xl border px-3 py-2 ${stats.lowStock > 0 ? 'border-amber-100 bg-amber-50/70 dark:border-amber-500/10 dark:bg-amber-500/5' : 'border-zinc-100 bg-zinc-50/60 dark:border-white/[0.05] dark:bg-white/[0.02]'}`}>
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-400">Мало</div>
                <div className={`text-lg font-bold tabular-nums ${stats.lowStock > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-500'}`}>{stats.lowStock}</div>
              </div>
              <AlertTriangle size={14} className={stats.lowStock > 0 ? 'text-amber-400' : 'text-zinc-300'} />
            </div>
          </div>
        </div>

        {/* ── Charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <OrdersTrendChart data={chartData.daily} />
          </div>
          <div className="lg:col-span-2">
            <StatusDonutChart data={chartData.statusBreakdown} />
          </div>
        </div>

        {/* ── Detail widgets ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LowStockWidget products={lowStockProducts} />
          <RecentChangesWidget logs={logs} />
        </div>

      </div>
    </>
  )
}
