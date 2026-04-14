'use client'

import { type Product } from '@/lib/types/database'
import { formatStock } from '@/lib/utils/format'
import { cn } from '@/lib/utils/format'
import { AlertTriangle } from 'lucide-react'

interface StockDisplayProps {
  product: Product
  size?: 'sm' | 'lg'
}

export function StockDisplay({ product, size = 'sm' }: StockDisplayProps) {
  const isLow = product.stock < 10
  const isOut = product.stock === 0

  const tooltipText = isOut
    ? 'Нет в наличии'
    : `Доступно ${formatStock(product.stock, product.unit)} на складе`

  return (
    <div className="group relative">
      <div className="flex items-center gap-1.5">
        {isLow && !isOut && <AlertTriangle size={size === 'lg' ? 18 : 14} className="text-warning" />}
        <span
          className={cn(
            size === 'lg' ? 'text-xl font-semibold' : 'text-sm font-medium',
            isOut && 'text-danger',
            isLow && !isOut && 'text-warning',
            !isLow && 'text-foreground'
          )}
        >
          {isOut ? 'Нет в наличии' : formatStock(product.stock, product.unit)}
        </span>
      </div>
      {/* Tooltip */}
      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10">
        <div className="rounded-lg bg-foreground px-3 py-2 text-xs text-white shadow-lg whitespace-nowrap">
          {tooltipText}
          <div className="absolute top-full left-4 border-4 border-transparent border-t-foreground" />
        </div>
      </div>
    </div>
  )
}
