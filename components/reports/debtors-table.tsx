'use client'

import { useState } from 'react'
import Link from 'next/link'
import { type Debtor } from '@/lib/actions/reports'
import { formatPrice, formatDateShort, cn } from '@/lib/utils/format'
import { Users, Phone, MessageCircle, ChevronDown, ExternalLink, Package } from 'lucide-react'

interface DebtorsTableProps {
  debtors: Debtor[]
}

function whatsappLink(phone: string): string {
  return `https://wa.me/${phone.replace(/\D/g, '')}`
}

export function DebtorsTable({ debtors }: DebtorsTableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggle(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="rounded-2xl glass-card overflow-hidden">
      <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
        <Users size={16} className="text-red-400" />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Должники</h3>
        <span className="text-xs text-zinc-400">({debtors.length})</span>
      </div>

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
                  <span className="shrink-0 text-sm font-bold tabular-nums text-red-600 dark:text-red-400">
                    {formatPrice(d.debt)} ₸
                  </span>
                </button>

                {isOpen && (
                  <div className="px-5 pb-3 space-y-2 bg-zinc-50/40 dark:bg-zinc-900/40">
                    {d.orders.map((o) => (
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

                        <div className="flex items-center gap-3 text-[11px] tabular-nums">
                          <span className="text-zinc-500 dark:text-zinc-400">Сумма: {formatPrice(o.total)} ₸</span>
                          <span className="text-emerald-600">Оплачено: {formatPrice(o.paid)} ₸</span>
                          <span className="text-red-600 font-semibold">Долг: {formatPrice(o.debt)} ₸</span>
                        </div>
                      </Link>
                    ))}
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
