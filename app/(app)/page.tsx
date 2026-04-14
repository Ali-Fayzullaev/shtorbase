import { Header } from '@/components/layout/header'
import { StatCard } from '@/components/dashboard/stat-card'
import { LowStockWidget } from '@/components/dashboard/low-stock-widget'
import { RecentChangesWidget } from '@/components/dashboard/recent-changes-widget'
import { LowStockAlert } from '@/components/ui/low-stock-alert'
import { getDashboardStats, getLowStockProducts, getRecentAuditLogs } from '@/lib/actions/products'
import { Package, PackageCheck, PackageX, AlertTriangle, Search } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const [stats, lowStockProducts, logs] = await Promise.all([
    getDashboardStats(),
    getLowStockProducts(),
    getRecentAuditLogs(),
  ])

  return (
    <>
      <Header title="Главная" description="Обзор" />

      <LowStockAlert count={stats.lowStock + stats.outOfStock} />

      <div className="p-5 space-y-5">
        {/* Quick Search */}
        <Link
          href="/catalog"
          className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-4 hover:border-indigo-200 hover:shadow-sm transition-all group"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
            <Search size={18} />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-slate-800">Найти товар</p>
            <p className="text-[12px] text-slate-400">Поиск по названию, артикулу или категории</p>
          </div>
        </Link>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Всего" value={stats.total} icon={Package} color="indigo" />
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
