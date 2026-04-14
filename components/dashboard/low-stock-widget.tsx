import { type Product } from '@/lib/types/database'
import { formatStock, cn } from '@/lib/utils/format'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface LowStockWidgetProps {
  products: Product[]
}

export function LowStockWidget({ products }: LowStockWidgetProps) {
  const lowStock = products
    .filter((p) => p.stock < 10 && p.status === 'active')
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 6)

  if (lowStock.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white p-5">
        <h3 className="text-[13px] font-semibold text-slate-700 mb-3">Заканчиваются</h3>
        <p className="text-[13px] text-slate-400">Всё в порядке — остатки в норме</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5">
      <h3 className="text-[13px] font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
        <AlertTriangle size={14} className="text-amber-500" />
        Заканчиваются
      </h3>
      <div className="space-y-1">
        {lowStock.map((product, idx) => (
          <Link
            key={product.id}
            href={`/catalog/${product.id}`}
            className={cn(
              'flex items-center justify-between rounded-lg px-2.5 py-2 -mx-1 hover:bg-slate-50 transition-colors',
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-slate-700 truncate">{product.name}</p>
              <p className="text-[11px] text-slate-400 font-mono">{product.sku}</p>
            </div>
            <span
              className={cn(
                'text-[13px] font-semibold tabular-nums ml-3 shrink-0',
                product.stock === 0 ? 'text-red-500' : 'text-amber-600'
              )}
            >
              {product.stock === 0 ? 'Нет' : formatStock(product.stock, product.unit)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
