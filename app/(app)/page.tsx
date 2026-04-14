import { Header } from '@/components/layout/header'
import { StatCard } from '@/components/dashboard/stat-card'
import { LowStockWidget } from '@/components/dashboard/low-stock-widget'
import { RecentChangesWidget } from '@/components/dashboard/recent-changes-widget'
import { demoProducts, demoAuditLogs } from '@/lib/demo-data'
import { Package, PackageCheck, PackageX, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Search } from 'lucide-react'

export default function DashboardPage() {
  const products = demoProducts
  const logs = demoAuditLogs

  const totalProducts = products.length
  const activeProducts = products.filter((p) => p.status === 'active').length
  const outOfStock = products.filter((p) => p.stock === 0).length
  const lowStock = products.filter((p) => p.stock > 0 && p.stock < 10).length

  return (
    <>
      <Header title="Главная" description="Обзор системы и быстрый доступ" />

      <div className="p-6 space-y-6">
        {/* Quick Search */}
        <Link
          href="/catalog"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
            <Search size={22} />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">Найти товар</p>
            <p className="text-sm text-muted">Поиск по названию, артикулу или категории</p>
          </div>
        </Link>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Всего товаров" value={totalProducts} icon={Package} color="text-primary" />
          <StatCard label="Активных" value={activeProducts} icon={PackageCheck} color="text-success" />
          <StatCard label="Нет в наличии" value={outOfStock} icon={PackageX} color="text-danger" />
          <StatCard label="Заканчиваются" value={lowStock} icon={AlertTriangle} color="text-warning" />
        </div>

        {/* Widgets */}
        <div className="grid grid-cols-2 gap-6">
          <LowStockWidget products={products} />
          <RecentChangesWidget logs={logs} />
        </div>
      </div>
    </>
  )
}
