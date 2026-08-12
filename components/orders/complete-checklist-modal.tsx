'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { type OrderItem } from '@/lib/types/database'
import { cn } from '@/lib/utils/format'
import { CheckCircle2, Circle, Loader2, ClipboardCheck, X } from 'lucide-react'

interface CompleteChecklistModalProps {
  orderNumber: number
  items: OrderItem[]
  pending: boolean
  onConfirm: () => void
  onClose: () => void
}

/**
 * Перед тем как отметить заказ «Готово», сотрудник должен явно отметить
 * каждую позицию — так меньше шанс отдать заказ с недоделанной/забытой
 * позицией (особенно когда у позиций разные цвета/размеры).
 */
export function CompleteChecklistModal({ orderNumber, items, pending, onConfirm, onClose }: CompleteChecklistModalProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allChecked = items.length === 0 || checked.size === items.length

  if (typeof window === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 backdrop-blur-sm p-4 animate-fade-in"
      onClick={(e) => { e.stopPropagation(); onClose() }}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 p-5 shadow-2xl animate-scale-in max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm">
            <ClipboardCheck size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Проверьте позиции заказа #{orderNumber}</h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">Отметьте каждую позицию, чтобы завершить заказ</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-3 flex-1 overflow-y-auto space-y-2 -mx-1 px-1">
          {items.length === 0 ? (
            <p className="text-sm text-zinc-400 py-6 text-center">В заказе нет позиций</p>
          ) : (
            items.map((item) => {
              const isChecked = checked.has(item.id)
              const attrs = item.custom_attributes ? Object.entries(item.custom_attributes) : []
              return (
                <label
                  key={item.id}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors',
                    isChecked
                      ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10'
                      : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  )}
                >
                  <input type="checkbox" checked={isChecked} onChange={() => toggle(item.id)} className="sr-only" />
                  {isChecked ? (
                    <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-500" />
                  ) : (
                    <Circle size={18} className="shrink-0 mt-0.5 text-zinc-300 dark:text-zinc-600" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">
                      {item.product?.name ?? 'Товар'} · {item.quantity} {item.product?.unit === 'meter' ? 'м' : 'шт'}
                    </p>
                    {attrs.length > 0 && (
                      <p className="flex flex-wrap gap-x-2 mt-0.5 text-[12px] text-zinc-500 dark:text-zinc-400">
                        {attrs.map(([k, v]) => (
                          <span key={k}><span className="text-zinc-400 dark:text-zinc-500">{k}:</span> {v}</span>
                        ))}
                      </p>
                    )}
                    {item.note && <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">{item.note}</p>}
                  </div>
                </label>
              )
            })
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!allChecked || pending}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {pending && <Loader2 size={14} className="animate-spin" />}
            Готово
          </button>
        </div>
        {items.length > 0 && !allChecked && (
          <p className="mt-2 text-center text-[11px] text-zinc-400">Отмечено {checked.size} из {items.length}</p>
        )}
      </div>
    </div>,
    document.body
  )
}
