import { type Product } from '@/lib/types/database'
import { formatStock, cn } from '@/lib/utils/format'
import { UnitBadge } from '@/components/products/unit-badge'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface LowStockWidgetProps {
  products: Product[]
}

export function LowStockWidget({ products }: LowStockWidgetProps) {
  const lowStock = products
    .filter((p) => p.stock < 10 && p.status === 'active')
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 8)

  if (lowStock.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">⚠️ Заканчиваются</h3>
        <p className="text-sm text-muted">Все товары в достаточном количестве ✓</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <AlertTriangle size={16} className="text-warning" />
        Заканчиваются
      </h3>
      <div className="space-y-3">
        {lowStock.map((product) => (
          <Link
            key={product.id}
            href={`/catalog/${product.id}`}
            className="flex items-center justify-between rounded-xl p-2.5 -mx-2 hover:bg-background transition-colors"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
              <p className="text-xs text-muted font-mono">{product.sku}</p>
            </div>
            <div className="flex items-center gap-2 ml-3 shrink-0">
              <span
                className={cn(
                  'text-sm font-semibold tabular-nums',
                  product.stock === 0 ? 'text-danger' : 'text-warning'
                )}
              >
                {product.stock === 0 ? 'Нет' : formatStock(product.stock, product.unit)}
              </span>
              <UnitBadge unit={product.unit} size="sm" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
