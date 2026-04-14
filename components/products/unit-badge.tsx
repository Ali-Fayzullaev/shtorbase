'use client'

import { type ProductUnit } from '@/lib/types/database'
import { cn } from '@/lib/utils/format'
import { Ruler, Package } from 'lucide-react'

interface UnitBadgeProps {
  unit: ProductUnit
  size?: 'sm' | 'md' | 'lg'
}

export function UnitBadge({ unit, size = 'md' }: UnitBadgeProps) {
  const isMeter = unit === 'meter'

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-1.5 text-base gap-2 font-semibold',
  }

  const iconSize = { sm: 12, md: 14, lg: 18 }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium text-white uppercase tracking-wide',
        isMeter ? 'bg-unit-meter' : 'bg-unit-piece',
        sizeClasses[size]
      )}
    >
      {isMeter ? (
        <Ruler size={iconSize[size]} />
      ) : (
        <Package size={iconSize[size]} />
      )}
      {isMeter ? 'Метр' : 'Штука'}
    </span>
  )
}
