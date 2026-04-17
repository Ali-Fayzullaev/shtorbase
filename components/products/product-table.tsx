'use client'

import { type Product } from '@/lib/types/database'
import { formatPrice, formatStock, cn } from '@/lib/utils/format'
import { AlertTriangle, ChevronRight, ImageIcon } from 'lucide-react'
import Link from 'next/link'

interface ProductWithThumb extends Product {
  thumbnail?: string | null
}

interface ProductTableProps {
  products: ProductWithThumb[]
}

export function ProductTable({ products }: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-slate-100 p-4 mb-4">
          <AlertTriangle size={24} className="text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-600">Товары не найдены</p>
        <p className="text-xs text-slate-400 mt-1">Попробуйте изменить фильтры</p>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Товар</th>
            <th className="hidden sm:table-cell px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Категория</th>
            <th className="hidden sm:table-cell px-4 py-2.5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Цена</th>
            <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Остаток</th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, idx) => {
            const isLow = product.stock < 10 && product.stock > 0
            const isOut = product.stock === 0
            const isLast = idx === products.length - 1

            return (
              <tr
                key={product.id}
                className={cn(
                  'group transition-colors hover:bg-slate-50/80',
                  !isLast && 'border-b border-slate-100/80'
                )}
              >
                {/* Товар */}
                <td className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    {product.thumbnail ? (
                      <img
                        src={product.thumbnail}
                        alt={product.name}
                        className="mt-0.5 h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-slate-200/60"
                      />
                    ) : (
                      <div
                        className={cn(
                          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                          product.unit === 'meter'
                            ? 'bg-blue-50 text-blue-400'
                            : 'bg-emerald-50 text-emerald-400'
                        )}
                      >
                        <ImageIcon size={16} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <Link
                        href={`/catalog/${product.id}`}
                        className="text-[13px] font-medium text-slate-800 hover:text-indigo-600 transition-colors leading-tight"
                      >
                        {product.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[11px] text-slate-400">{product.sku}</span>
                        {product.note && (
                          <span className="text-[11px] text-amber-500 truncate max-w-[200px]" title={product.note}>
                            · {product.note}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Категория */}
                <td className="hidden sm:table-cell px-4 py-3">
                  <span className="inline-block rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200/60">
                    {product.category?.name}
                  </span>
                </td>

                {/* Цена */}
                <td className="hidden sm:table-cell px-4 py-3 text-right">
                  <span className="text-[13px] font-semibold text-slate-800 tabular-nums">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-[11px] text-slate-400 ml-0.5">₸</span>
                  <div className="text-[10px] text-slate-400">
                    {product.vat_included ? 'с НДС' : 'без НДС'}
                  </div>
                </td>

                {/* Остаток */}
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {isLow && <AlertTriangle size={12} className="text-amber-500" />}
                    <span
                      className={cn(
                        'text-[13px] font-medium tabular-nums',
                        isOut && 'text-red-500',
                        isLow && 'text-amber-600',
                        !isLow && !isOut && 'text-slate-700'
                      )}
                    >
                      {isOut ? 'Нет' : formatStock(product.stock, product.unit)}
                    </span>
                  </div>
                </td>

                {/* Arrow */}
                <td className="pr-3 py-3">
                  <Link
                    href={`/catalog/${product.id}`}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-300 group-hover:text-indigo-500 group-hover:bg-indigo-50 transition-all"
                  >
                    <ChevronRight size={14} />
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
