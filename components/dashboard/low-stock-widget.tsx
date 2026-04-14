import { type Product } from '@/lib/types/database'
import { formatStock, cn } from '@/lib/utils/format'
import { AlertTriangle, TrendingDown } from 'lucide-react'
import Link from 'next/link'

interface LowStockWidgetProps {
  products: Product[]
}

export function LowStockWidget({ products }: LowStockWidgetProps) {
  const lowStock = products
    .filter((p) => p.stock < 10 && p.status === 'active')
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 6)

  return (
    <div className="rounded-xl bg-white border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100">
        <TrendingDown size={15} className="text-amber-500" />
        <h3 className="text-sm font-semibold text-slate-900">Заканчиваются</h3>
        {lowStock.length > 0 && (
          <span className="ml-auto text-xs font-medium text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">{lowStock.length}</span>
        )}
      </div>
      <div className="divide-y divide-slate-50">
        {lowStock.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-slate-400">Все остатки в норме</p>
          </div>
        ) : (
          lowStock.map((product) => (
            <Link
              key={product.id}
              href={`/catalog/${product.id}`}
              className="flex items-center justify-between px-5 py-2.5 hover:bg-slate-50 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800 truncate">{product.name}</p>
                <p className="text-xs text-slate-400 font-mono">{product.sku}</p>
              </div>
              <span
                className={cn(
                  'text-sm font-semibold tabular-nums ml-4 shrink-0',
                  product.stock === 0 ? 'text-red-600' : 'text-amber-600'
                )}
              >
                {product.stock === 0 ? 'Нет' : formatStock(product.stock, product.unit)}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
