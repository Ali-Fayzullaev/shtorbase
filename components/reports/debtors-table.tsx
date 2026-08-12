'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type Debtor } from '@/lib/actions/reports'
import { addPayment } from '@/lib/actions/payments'
import { formatPrice, formatDateShort, cn } from '@/lib/utils/format'
import { Users, Phone, MessageCircle, ChevronDown, ExternalLink, Package, CheckCheck, Loader2 } from 'lucide-react'

interface DebtorsTableProps {
  debtors: Debtor[]
}

function whatsappLink(phone: string): string {
  return `https://wa.me/${phone.replace(/\D/g, '')}`
}

export function DebtorsTable({ debtors }: DebtorsTableProps) {
  const router = useRouter()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [closingKey, setClosingKey] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function toggle(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function closeOrderDebt(e: React.MouseEvent, orderId: string, amount: number) {
    e.preventDefault()
    e.stopPropagation()
    if (amount <= 0) return
    setError('')
    setClosingKey(orderId)
    startTransition(async () => {
      const result = await addPayment(orderId, amount, 'Полное закрытие долга')
      if (result?.error) setError(result.error)
      else router.refresh()
      setClosingKey(null)
    })
  }

  function closeClientDebt(e: React.MouseEvent, debtor: Debtor, key: string) {
    e.preventDefault()
    e.stopPropagation()
    setError('')
    setClosingKey(key)
    startTransition(async () => {
      for (const o of debtor.orders) {
        if (o.debt <= 0) continue
        const result = await addPayment(o.id, o.debt, 'Полное закрытие долга')
        if (result?.error) { setError(`Заказ #${o.orderNumber}: ${result.error}`); setClosingKey(null); return }
      }
      router.refresh()
      setClosingKey(null)
    })
  }

  return (
    <div className="rounded-2xl glass-card overflow-hidden">
      <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
        <Users size={16} className="text-red-400" />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Должники</h3>
        <span className="text-xs text-zinc-400">({debtors.length})</span>
      </div>

      {error && (
        <div className="mx-5 mt-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/20 px-3 py-2 text-[12px] text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {debtors.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm font-medium text-zinc-500">Долгов нет</p>
          <p className="text-xs text-zinc-400 mt-1">Все заказы оплачены полностью</p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
          {debtors.map((d, i) => {
            const key = d.clientId ?? `${d.clientName}-${i}`
            const isOpen = expanded.has(key)
            const isClosingClient = pending && closingKey === key
            return (
              <div key={key}>
                <button
                  type="button"
                  onClick={() => toggle(key)}
                  className="w-full flex items-center justify-between gap-3 px-5 py-3 text-left hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <ChevronDown
                      size={14}
                      className={cn('shrink-0 text-zinc-400 transition-transform', isOpen && 'rotate-180')}
                    />
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200 truncate">{d.clientName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {d.phone && (
                          <>
                            <a
                              href={`tel:${d.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700"
                            >
                              <Phone size={10} /> {d.phone}
                            </a>
                            <a
                              href={whatsappLink(d.phone)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 text-[11px] text-green-600 hover:text-green-700"
                            >
                              <MessageCircle size={10} /> WA
                            </a>
                          </>
                        )}
                        <span className="text-[11px] text-zinc-400">
                          {d.orderCount} {d.orderCount === 1 ? 'заказ' : 'заказа'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-sm font-bold tabular-nums text-red-600 dark:text-red-400">
                      {formatPrice(d.debt)} ₸
                    </span>
                    <button
                      type="button"
                      onClick={(e) => closeClientDebt(e, d, key)}
                      disabled={pending}
                      title="Отметить весь долг клиента оплаченным"
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                    >
                      {isClosingClient ? <Loader2 size={11} className="animate-spin" /> : <CheckCheck size={11} />}
                      Закрыть
                    </button>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-3 space-y-2 bg-zinc-50/40 dark:bg-zinc-900/40">
                    {d.orders.map((o) => {
                      const isClosingOrder = pending && closingKey === o.id
                      return (
                        <Link
                          key={o.id}
                          href={`/orders/${o.id}`}
                          className="block rounded-xl border border-zinc-200/70 dark:border-white/6 bg-white dark:bg-zinc-950/60 p-3 hover:border-zinc-300 dark:hover:border-white/12 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">
                              Заказ #{o.orderNumber} · {formatDateShort(o.createdAt)}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] text-indigo-500">
                              Открыть <ExternalLink size={10} />
                            </span>
                          </div>

                          {o.items.length > 0 && (
                            <div className="flex items-start gap-1.5 mb-1.5">
                              <Package size={12} className="shrink-0 mt-0.5 text-zinc-400" />
                              <p className="text-[12px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                {o.items.map((item, idx) => {
                                  const attrs = Object.values(item.attributes).filter(Boolean).join(', ')
                                  return (
                                    <span key={idx}>
                                      {idx > 0 && ', '}
                                      {item.productName}
                                      {attrs && <span className="text-zinc-400"> ({attrs})</span>}
                                      {' × '}{item.quantity} {item.unit}
                                    </span>
                                  )
                                })}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 text-[11px] tabular-nums">
                              <span className="text-zinc-500 dark:text-zinc-400">Сумма: {formatPrice(o.total)} ₸</span>
                              <span className="text-emerald-600">Оплачено: {formatPrice(o.paid)} ₸</span>
                              <span className="text-red-600 font-semibold">Долг: {formatPrice(o.debt)} ₸</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => closeOrderDebt(e, o.id, o.debt)}
                              disabled={pending}
                              className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                            >
                              {isClosingOrder ? <Loader2 size={11} className="animate-spin" /> : <CheckCheck size={11} />}
                              Закрыть
                            </button>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
