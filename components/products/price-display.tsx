'use client'

import { type Product } from '@/lib/types/database'
import { formatPrice, unitLabel } from '@/lib/utils/format'

interface PriceDisplayProps {
  product: Product
  size?: 'sm' | 'lg'
}

export function PriceDisplay({ product, size = 'sm' }: PriceDisplayProps) {
  const tooltipText = `Цена ${unitLabel(product.unit)}${product.vat_included ? ', включая НДС 12%' : ', без НДС'}`

  return (
    <div className="group relative">
      <div className="flex items-baseline gap-1.5">
        <span className={size === 'lg' ? 'text-3xl font-bold text-foreground' : 'text-lg font-semibold text-foreground'}>
          {formatPrice(product.price)} ₸
        </span>
      </div>
      <p className={`text-muted ${size === 'lg' ? 'text-sm mt-0.5' : 'text-xs'}`}>
        {unitLabel(product.unit)}{product.vat_included ? ' · с НДС' : ' · без НДС'}
      </p>
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
