'use client'

import { type Product } from '@/lib/types/database'
import { UnitBadge } from './unit-badge'
import { PriceDisplay } from './price-display'
import { StockDisplay } from './stock-display'
import { formatPrice, formatStock, unitLabel } from '@/lib/utils/format'
import { MessageSquareText, Copy, Printer } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface ProductCardProps {
  product: Product
  compact?: boolean
}

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const handleCopyPrice = () => {
    const text = `${product.name} — ${formatPrice(product.price)} ₸ ${unitLabel(product.unit)}`
    navigator.clipboard.writeText(text)
    toast.success('Скопировано!')
  }

  if (compact) {
    return (
      <Link
        href={`/catalog/${product.id}`}
        className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md hover:border-primary/30"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-muted">{product.sku}</span>
            {product.category && (
              <span className="text-xs text-muted bg-background rounded-full px-2 py-0.5">{product.category.name}</span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-foreground truncate">{product.name}</h3>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <PriceDisplay product={product} size="sm" />
          <UnitBadge unit={product.unit} size="sm" />
          <StockDisplay product={product} size="sm" />
        </div>
      </Link>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden transition-all hover:shadow-lg">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-border">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono text-muted bg-background rounded-md px-2 py-0.5">
                {product.sku}
              </span>
              {product.category && (
                <span className="text-xs text-muted">{product.category.name}</span>
              )}
            </div>
            <h2 className="text-xl font-bold text-foreground">{product.name}</h2>
            {product.description && (
              <p className="text-sm text-muted mt-1">{product.description}</p>
            )}
          </div>
          <UnitBadge unit={product.unit} size="lg" />
        </div>
      </div>

      {/* Price & Stock */}
      <div className="grid grid-cols-2 gap-0">
        {/* Price Block */}
        <div className={`p-6 border-r border-border ${product.unit === 'meter' ? 'bg-blue-50/50' : 'bg-emerald-50/50'}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-2 h-2 rounded-full ${product.unit === 'meter' ? 'bg-unit-meter' : 'bg-unit-piece'}`} />
            <span className="text-xs font-medium text-muted uppercase tracking-wider">Цена</span>
          </div>
          <PriceDisplay product={product} size="lg" />
        </div>

        {/* Stock Block */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-muted" />
            <span className="text-xs font-medium text-muted uppercase tracking-wider">Остаток</span>
          </div>
          <StockDisplay product={product} size="lg" />
        </div>
      </div>

      {/* Note */}
      {product.note && (
        <div className="px-6 py-4 border-t border-border bg-amber-50/40">
          <div className="flex items-start gap-2">
            <MessageSquareText size={16} className="text-accent mt-0.5 shrink-0" />
            <p className="text-sm text-foreground/80">{product.note}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-6 py-3 border-t border-border flex items-center gap-2">
        <button
          onClick={handleCopyPrice}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted hover:bg-background hover:text-foreground transition-colors"
        >
          <Copy size={14} /> Скопировать
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted hover:bg-background hover:text-foreground transition-colors"
        >
          <Printer size={14} /> Печать
        </button>
      </div>
    </div>
  )
}
