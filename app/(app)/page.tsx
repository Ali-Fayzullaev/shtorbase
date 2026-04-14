import { Header } from '@/components/layout/header'
import { StatCard } from '@/components/dashboard/stat-card'
import { LowStockWidget } from '@/components/dashboard/low-stock-widget'
import { RecentChangesWidget } from '@/components/dashboard/recent-changes-widget'
import { LowStockAlert } from '@/components/ui/low-stock-alert'
import { getDashboardStats, getLowStockProducts, getRecentAuditLogs } from '@/lib/actions/products'
import { Package, PackageCheck, PackageX, AlertTriangle } from 'lucide-react'

export default async function DashboardPage() {
  const [stats, lowStockProducts, logs] = await Promise.all([
    getDashboardStats(),
    getLowStockProducts(),
    getRecentAuditLogs(),
  ])

  return (
    <>
      <Header title="Главная" description="Обзор склада" />

      <LowStockAlert count={stats.lowStock + stats.outOfStock} />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="Всего товаров" value={stats.total} icon={Package} color="indigo" />
          <StatCard label="Активных" value={stats.active} icon={PackageCheck} color="emerald" />
          <StatCard label="Нет в наличии" value={stats.outOfStock} icon={PackageX} color="red" />
          <StatCard label="Заканчиваются" value={stats.lowStock} icon={AlertTriangle} color="amber" />
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
