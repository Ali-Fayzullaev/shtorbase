'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { type Order } from '@/lib/types/database'
import { acceptOrder, completeOrder } from '@/lib/actions/orders'
import { cn } from '@/lib/utils/format'
import { PaymentBadge } from './payment-badge'
import { Inbox, Wrench, History, Calendar, Clock, AlertTriangle, User, Phone, CheckCircle2, Loader2 } from 'lucide-react'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Almaty',
  })
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(amount)
}

function isOverdue(deadline: string | null, status: string): boolean {
  if (!deadline) return false
  if (['delivered', 'cancelled'].includes(status)) return false
  return new Date(deadline) < new Date()
}

const doneStatusLabel: Record<string, { label: string; cls: string }> = {
  ready: { label: 'Готов', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  delivered: { label: 'Выдан', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  cancelled: { label: 'Отменён', cls: 'bg-red-50 text-red-600 border-red-200' },
}

interface EmployeeOrderBoardProps {
  queueOrders: Order[]
  activeOrders: Order[]
  doneOrders: Order[]
}

export function EmployeeOrderBoard({ queueOrders, activeOrders, doneOrders }: EmployeeOrderBoardProps) {
  return (
    <div className="space-y-8">
      <Section
        icon={<Inbox size={16} className="text-indigo-500" />}
        title="Общая очередь"
        hint="Заказы без исполнителя — принять может любой сотрудник"
        count={queueOrders.length}
      >
        {queueOrders.length === 0 ? (
          <EmptyState text="Новых заказов нет" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {queueOrders.map((order) => (
              <OrderActionCard key={order.id} order={order} mode="accept" />
            ))}
          </div>
        )}
      </Section>

      <Section
        icon={<Wrench size={16} className="text-amber-500" />}
        title="В работе у меня"
        hint="Отметьте «Готово», когда заказ выполнен"
        count={activeOrders.length}
      >
        {activeOrders.length === 0 ? (
          <EmptyState text="Нет заказов в работе" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeOrders.map((order) => (
              <OrderActionCard key={order.id} order={order} mode="complete" />
            ))}
          </div>
        )}
      </Section>

      {doneOrders.length > 0 && (
        <Section
          icon={<History size={16} className="text-zinc-400" />}
          title="Недавно завершённые"
          count={doneOrders.length}
        >
          <div className="glass-card rounded-xl overflow-hidden divide-y divide-slate-50 dark:divide-zinc-800">
            {doneOrders.map((order) => {
              const badge = doneStatusLabel[order.status] ?? { label: order.status, cls: 'bg-zinc-50 text-zinc-500 border-zinc-200' }
              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200 truncate">
                      #{order.order_number} · {order.client?.name ?? 'Без клиента'}
                    </p>
                    <p className="text-[11px] text-zinc-400">{formatDate(order.updated_at)}</p>
                  </div>
                  <span className={cn('shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium', badge.cls)}>
                    {badge.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </Section>
      )}
    </div>
  )
}

function Section({ icon, title, hint, count, children }: { icon: React.ReactNode; title: string; hint?: string; count: number; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{title}</h2>
        <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">{count}</span>
        {hint && <span className="hidden sm:inline text-[12px] text-zinc-400">— {hint}</span>}
      </div>
      {children}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 py-8 text-center text-[13px] text-zinc-400">
      {text}
    </div>
  )
}

function OrderActionCard({ order, mode }: { order: Order; mode: 'accept' | 'complete' }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const overdue = isOverdue(order.deadline, order.status)

  function handleAction(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setError('')
    startTransition(async () => {
      const result = mode === 'accept' ? await acceptOrder(order.id) : await completeOrder(order.id)
      if (result?.error) setError(result.error)
      else router.refresh()
    })
  }

  return (
    <Link
      href={`/orders/${order.id}`}
      className={cn(
        'flex flex-col rounded-2xl glass-card overflow-hidden transition-all active:scale-[0.99]',
        overdue && '!border-red-300/50 dark:!border-red-500/25'
      )}
    >
      <div className="px-4 py-3 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 tabular-nums">#{order.order_number}</span>
          <PaymentBadge status={order.payment_status} paidAmount={order.paid_amount} totalAmount={order.total_amount} />
        </div>

        {order.client ? (
          <p className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">{order.client.name}</p>
        ) : (
          <p className="text-[14px] text-zinc-400 italic">Без клиента</p>
        )}

        {(order.phone || order.client?.phone) && (
          <p className="flex items-center gap-1 text-[12px] text-zinc-500 dark:text-zinc-400">
            <Phone size={11} /> {order.phone || order.client?.phone}
          </p>
        )}

        {order.note && <p className="text-[12px] text-zinc-500 dark:text-zinc-400 line-clamp-2">{order.note}</p>}

        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-zinc-400">
          <span className="flex items-center gap-1">
            <Calendar size={11} /> {formatDate(order.created_at)}
          </span>
          {order.deadline && (
            <span className={cn('flex items-center gap-1', overdue && 'text-red-500 font-medium')}>
              {overdue ? <AlertTriangle size={11} /> : <Clock size={11} />}
              {formatDate(order.deadline)}
            </span>
          )}
          {mode === 'complete' && order.assigned_user && (
            <span className="flex items-center gap-1">
              <User size={11} /> {order.assigned_user.full_name}
            </span>
          )}
        </div>

        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 pt-0.5">{formatPrice(order.total_amount)}</p>

        {error && <p className="text-[11px] text-red-600">{error}</p>}
      </div>

      <button
        type="button"
        onClick={handleAction}
        disabled={pending}
        className={cn(
          'btn-press flex items-center justify-center gap-2 h-14 text-[14px] font-semibold text-white transition-colors disabled:opacity-60',
          mode === 'accept' ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-emerald-600 hover:bg-emerald-500'
        )}
      >
        {pending ? (
          <Loader2 size={16} className="animate-spin" />
        ) : mode === 'accept' ? (
          <CheckCircle2 size={16} />
        ) : (
          <CheckCircle2 size={16} />
        )}
        {mode === 'accept' ? 'Принять заказ' : 'Готово'}
      </button>
    </Link>
  )
}
