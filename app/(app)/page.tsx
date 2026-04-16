import { Header } from '@/components/layout/header'
import { StatCard } from '@/components/dashboard/stat-card'
import { LowStockWidget } from '@/components/dashboard/low-stock-widget'
import { RecentChangesWidget } from '@/components/dashboard/recent-changes-widget'
import { LowStockAlert } from '@/components/ui/low-stock-alert'
import { getDashboardStats, getLowStockProducts, getRecentAuditLogs } from '@/lib/actions/products'
import { getOrderStats } from '@/lib/actions/orders'
import { createClient } from '@/lib/supabase/server'
import { type UserRole } from '@/lib/types/database'
import { Package, PackageCheck, PackageX, AlertTriangle, ClipboardList, Clock, CheckCircle, Inbox, Sparkles } from 'lucide-react'
import { redirect } from 'next/navigation'

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

  const [stats, lowStockProducts, logs, orderStats] = await Promise.all([
    getDashboardStats(),
    getLowStockProducts(),
    getRecentAuditLogs(),
    getOrderStats(user.id, userRole),
  ])

  return (
    <>
      <Header title="Главная" description="Обзор склада" />

      <LowStockAlert count={stats.lowStock + stats.outOfStock} />

      <div className="p-4 sm:p-6 space-y-6 page-enter">
        {/* Welcome banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 p-6 text-white shadow-lg shadow-indigo-500/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={16} className="text-indigo-200" />
              <span className="text-xs font-medium text-indigo-200 uppercase tracking-wider">{roleLabels[userRole]}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold">
              {getGreeting()}, {getDisplayName(userName)}!
            </h2>
            <p className="text-sm text-indigo-100 mt-1.5">
              {orderStats.new > 0
                ? `У вас ${orderStats.new} ${orderStats.new === 1 ? 'новый заказ' : 'новых заказов'} сегодня`
                : 'Все заказы обработаны. Отличная работа!'}
            </p>
          </div>
        </div>

        {/* Order stats */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-5 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500" />
            <h2 className="text-sm font-semibold text-zinc-700">
              {userRole === 'employee' ? 'Мои заказы' : 'Заказы'}
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 stagger-children">
            <StatCard label="Всего" value={orderStats.total} icon={ClipboardList} color="indigo" />
            <StatCard label="Новые" value={orderStats.new} icon={Inbox} color="indigo" />
            <StatCard label="В работе" value={orderStats.inProgress} icon={Clock} color="amber" />
            <StatCard label="Готовы" value={orderStats.ready} icon={CheckCircle} color="emerald" />
          </div>
        </section>

        {/* Product stats */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-5 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-teal-500" />
            <h2 className="text-sm font-semibold text-zinc-700">Склад</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 stagger-children">
            <StatCard label="Всего товаров" value={stats.total} icon={Package} color="indigo" />
            <StatCard label="Активных" value={stats.active} icon={PackageCheck} color="emerald" />
            <StatCard label="Нет в наличии" value={stats.outOfStock} icon={PackageX} color="red" />
            <StatCard label="Заканчиваются" value={stats.lowStock} icon={AlertTriangle} color="amber" />
          </div>
        </section>

        {/* Widgets */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-5 w-1 rounded-full bg-gradient-to-b from-amber-500 to-orange-500" />
            <h2 className="text-sm font-semibold text-zinc-700">Детали</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LowStockWidget products={lowStockProducts} />
            <RecentChangesWidget logs={logs} />
          </div>
        </section>
      </div>
    </>
  )
}
