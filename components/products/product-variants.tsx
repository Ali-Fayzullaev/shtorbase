import Link from 'next/link'
import { type Product } from '@/lib/types/database'
import { formatPrice, unitLabel, cn } from '@/lib/utils/format'
import { Layers, Plus } from 'lucide-react'

type VariantRow = Pick<Product, 'id' | 'sku' | 'name' | 'price' | 'unit' | 'stock' | 'status'>

interface ProductVariantsProps {
  variants: VariantRow[]
  sourceProductId: string
  canEdit: boolean
}

export function ProductVariants({ variants, sourceProductId, canEdit }: ProductVariantsProps) {
  if (variants.length === 0 && !canEdit) return null

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-slate-400 dark:text-zinc-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">Другие варианты</h3>
          {variants.length > 0 && <span className="text-xs text-slate-400 dark:text-zinc-500">({variants.length})</span>}
        </div>
        {canEdit && (
          <Link
            href={`/products/new?variant_of=${sourceProductId}`}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-zinc-700 px-2.5 py-1 text-[12px] font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Plus size={12} />
            Добавить вариацию
          </Link>
        )}
      </div>

      {variants.length > 0 ? (
        <div className="divide-y divide-slate-50 dark:divide-zinc-800">
          {variants.map((v) => (
            <Link
              key={v.id}
              href={`/catalog/${v.id}`}
              className="flex items-center justify-between gap-3 px-5 py-2.5 hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-slate-800 dark:text-zinc-200 truncate">{v.name}</p>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono">{v.sku}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[13px] font-semibold text-slate-700 dark:text-zinc-300">
                  {formatPrice(v.price)} ₸ <span className="text-slate-400 dark:text-zinc-500 font-normal">{unitLabel(v.unit)}</span>
                </p>
                <p className={cn('text-[11px]', v.status === 'active' ? 'text-slate-400 dark:text-zinc-500' : 'text-amber-500')}>
                  {v.status === 'active' ? `Остаток: ${v.stock}` : 'Скрыт'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="px-5 py-6 text-center text-[13px] text-slate-400 dark:text-zinc-500">
          У этого товара пока нет других вариаций
        </div>
      )}
    </div>
  )
}
