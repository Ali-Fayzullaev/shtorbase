'use client'

import { type Product } from '@/lib/types/database'
import { UnitBadge } from './unit-badge'
import { formatPrice, formatStock, cn } from '@/lib/utils/format'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface ProductTableProps {
  products: Product[]
}

export function ProductTable({ products }: ProductTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border bg-background/60">
            <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Артикул</th>
            <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Название</th>
            <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Категория</th>
            <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider text-right">Цена ₸</th>
            <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider text-center">Ед. изм.</th>
            <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider text-right">Остаток</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {products.map((product) => {
            const isLow = product.stock < 10 && product.stock > 0
            const isOut = product.stock === 0

            return (
              <tr
                key={product.id}
                className="hover:bg-primary/[0.02] transition-colors"
              >
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-muted">{product.sku}</span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/catalog/${product.id}`}
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {product.name}
                  </Link>
                  {product.note && (
                    <p className="text-xs text-muted mt-0.5 truncate max-w-xs" title={product.note}>
                      💡 {product.note}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-muted bg-background rounded-full px-2.5 py-1">
                    {product.category?.name}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-semibold tabular-nums">{formatPrice(product.price)}</span>
                  <span className="text-xs text-muted ml-1">
                    {product.vat_included ? 'с НДС' : 'без НДС'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <UnitBadge unit={product.unit} size="sm" />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {isLow && <AlertTriangle size={14} className="text-warning" />}
                    <span
                      className={cn(
                        'text-sm font-medium tabular-nums',
                        isOut && 'text-danger',
                        isLow && 'text-warning',
                        !isLow && !isOut && 'text-foreground'
                      )}
                    >
                      {isOut ? 'Нет' : formatStock(product.stock, product.unit)}
                    </span>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
