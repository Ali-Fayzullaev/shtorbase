'use client'

import { type Product } from '@/lib/types/database'
import { formatPrice, formatStock, unitLabel, cn } from '@/lib/utils/format'
import { MessageSquareText, Copy, Printer, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const handleCopyPrice = () => {
    const text = `${product.name} — ${formatPrice(product.price)} ₸ ${unitLabel(product.unit)}`
    navigator.clipboard.writeText(text)
    toast.success('Скопировано!')
  }

  const isLow = product.stock < 10 && product.stock > 0
  const isOut = product.stock === 0
  const isMeter = product.unit === 'meter'

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-[11px] text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-800/50 rounded px-1.5 py-0.5 ring-1 ring-slate-200/60 dark:ring-zinc-700/60">
                {product.sku}
              </span>
              {product.category && (
                <span className="text-[11px] text-slate-400 dark:text-zinc-500">{product.category.name}</span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-200">{product.name}</h2>
            {product.description && (
              <p className="text-[13px] text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">{product.description}</p>
            )}
          </div>
          <div
            className={cn(
              'shrink-0 flex h-10 items-center rounded-lg px-3 text-[12px] font-bold uppercase tracking-wider',
              isMeter
                ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
                : 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200'
            )}
          >
            {isMeter ? 'Метр' : 'Штука'}
          </div>
        </div>
      </div>

      {/* Price & Stock */}
      <div className="grid grid-cols-2 border-t border-slate-100 dark:border-zinc-800">
        <div className={cn('p-5 border-r border-slate-100 dark:border-zinc-800', isMeter ? 'bg-blue-50/30' : 'bg-emerald-50/30')}>
          <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Цена</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-zinc-200 tabular-nums">
            {formatPrice(product.price)} <span className="text-base font-semibold text-slate-400 dark:text-zinc-500">₸</span>
          </p>
          <p className="text-[12px] text-slate-400 dark:text-zinc-500 mt-0.5">
            {unitLabel(product.unit)} · {product.vat_included ? 'с НДС' : 'без НДС'}
          </p>
        </div>
        <div className="p-5">
          <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Остаток</p>
          <div className="flex items-center gap-1.5">
            {isLow && <AlertTriangle size={16} className="text-amber-500" />}
            <p
              className={cn(
                'text-2xl font-bold tabular-nums',
                isOut && 'text-red-500',
                isLow && 'text-amber-600',
                !isLow && !isOut && 'text-slate-800 dark:text-zinc-200'
              )}
            >
              {isOut ? 'Нет' : formatStock(product.stock, product.unit)}
            </p>
          </div>
          <p className="text-[12px] text-slate-400 dark:text-zinc-500 mt-0.5">
            {isOut ? 'Нет в наличии' : isLow ? 'Заканчивается' : 'В наличии'}
          </p>
        </div>
      </div>

      {/* Note */}
      {product.note && (
        <div className="px-5 py-3 border-t border-slate-100 dark:border-zinc-800 bg-amber-50/40">
          <div className="flex items-start gap-2">
            <MessageSquareText size={14} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[13px] text-slate-600 dark:text-zinc-300">{product.note}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-5 py-2.5 border-t border-slate-100 dark:border-zinc-800 flex items-center gap-1">
        <button
          onClick={handleCopyPrice}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium text-slate-400 dark:text-zinc-500 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
        >
          <Copy size={13} /> Скопировать
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium text-slate-400 dark:text-zinc-500 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
        >
          <Printer size={13} /> Печать
        </button>
      </div>
    </div>
  )
}
