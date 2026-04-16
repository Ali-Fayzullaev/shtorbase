import { Header } from '@/components/layout/header'
import { StatCard } from '@/components/dashboard/stat-card'
import { LowStockWidget } from '@/components/dashboard/low-stock-widget'
import { RecentChangesWidget } from '@/components/dashboard/recent-changes-widget'
import { LowStockAlert } from '@/components/ui/low-stock-alert'
import { getDashboardStats, getLowStockProducts, getRecentAuditLogs } from '@/lib/actions/products'
import { getOrderStats } from '@/lib/actions/orders'
import { createClient } from '@/lib/supabase/server'
import { type UserRole } from '@/lib/types/database'
import { Package, PackageCheck, PackageX, AlertTriangle, ClipboardList, Clock, CheckCircle, Inbox } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const userRole = (profile?.role ?? 'employee') as UserRole

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

      <div className="p-4 sm:p-6 space-y-6">
        {/* Order stats */}
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            {userRole === 'employee' ? 'Мои заказы' : 'Заказы'}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard label="Всего" value={orderStats.total} icon={ClipboardList} color="indigo" />
            <StatCard label="Новые" value={orderStats.new} icon={Inbox} color="indigo" />
            <StatCard label="В работе" value={orderStats.inProgress} icon={Clock} color="amber" />
            <StatCard label="Готовы" value={orderStats.ready} icon={CheckCircle} color="emerald" />
          </div>
        </div>

        {/* Product stats */}
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Склад</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard label="Всего товаров" value={stats.total} icon={Package} color="indigo" />
            <StatCard label="Активных" value={stats.active} icon={PackageCheck} color="emerald" />
            <StatCard label="Нет в наличии" value={stats.outOfStock} icon={PackageX} color="red" />
            <StatCard label="Заканчиваются" value={stats.lowStock} icon={AlertTriangle} color="amber" />
          </div>
        </div>

        {/* Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LowStockWidget products={lowStockProducts} />
          <RecentChangesWidget logs={logs} />
        </div>
      </div>
    </>
  )
}
