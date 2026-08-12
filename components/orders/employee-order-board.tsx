'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { type Order } from '@/lib/types/database'
import { acceptOrder, completeOrder } from '@/lib/actions/orders'
import { cn } from '@/lib/utils/format'
import { CompleteChecklistModal } from './complete-checklist-modal'
import { Inbox, Wrench, History, Calendar, Clock, AlertTriangle, CheckCircle2, Loader2, ClipboardList } from 'lucide-react'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Almaty',
  })
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
    <div className="overflow-x-auto pb-1">
      <div className="grid min-w-[900px] grid-flow-col auto-cols-[minmax(0,1fr)] gap-4">
        <KanbanColumn
          icon={<Inbox size={16} className="text-indigo-500" />}
          title="Общая очередь"
          hint="Заказы без исполнителя — принять может любой сотрудник"
          count={queueOrders.length}
        >
          {queueOrders.length === 0 ? (
            <EmptyState text="Новых заказов нет" />
          ) : (
            queueOrders.map((order) => <OrderActionCard key={order.id} order={order} mode="accept" />)
          )}
        </KanbanColumn>

        <KanbanColumn
          icon={<Wrench size={16} className="text-amber-500" />}
          title="В работе у меня"
          hint="Проверьте позиции и отметьте «Готово»"
          count={activeOrders.length}
        >
          {activeOrders.length === 0 ? (
            <EmptyState text="Нет заказов в работе" />
          ) : (
            activeOrders.map((order) => <OrderActionCard key={order.id} order={order} mode="complete" />)
          )}
        </KanbanColumn>

        <KanbanColumn
          icon={<History size={16} className="text-zinc-400" />}
          title="Недавно завершённые"
          count={doneOrders.length}
        >
          {doneOrders.length === 0 ? (
            <EmptyState text="Пока пусто" />
          ) : (
            doneOrders.map((order) => {
              const badge = doneStatusLabel[order.status] ?? { label: order.status, cls: 'bg-zinc-50 text-zinc-500 border-zinc-200' }
              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="block rounded-lg border border-zinc-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 px-3.5 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200 truncate">
                      #{order.order_number} · {order.client?.name ?? 'Без клиента'}
                    </p>
                    <span className={cn('shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium', badge.cls)}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{formatDate(order.updated_at)}</p>
                </Link>
              )
            })
          )}
        </KanbanColumn>
      </div>
    </div>
  )
}

function KanbanColumn({
  icon,
  title,
  hint,
  count,
  children,
}: {
  icon: React.ReactNode
  title: string
  hint?: string
  count: number
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-[420px] flex-col rounded-xl border border-zinc-200/70 bg-white/80 p-3 shadow-sm backdrop-blur dark:border-white/[0.06] dark:bg-zinc-950/65">
      <div className="mb-3 flex items-center gap-2 rounded-lg border border-zinc-200/70 bg-zinc-50/80 px-3 py-2 dark:border-white/[0.05] dark:bg-white/[0.03]">
        {icon}
        <span className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-100">{title}</span>
        <span className="ml-auto rounded-full bg-zinc-200/70 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-300">
          {count}
        </span>
      </div>
      {hint && <p className="mb-2 px-0.5 text-[11px] text-zinc-400">{hint}</p>}
      <div className="flex-1 space-y-2.5">{children}</div>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 py-8 text-center text-[13px] text-zinc-400">
      {text}
    </div>
  )
}

function OrderActionCard({ order, mode }: { order: Order; mode: 'accept' | 'complete' }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [showChecklist, setShowChecklist] = useState(false)
  const overdue = isOverdue(order.deadline, order.status)

  function runAccept(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setError('')
    startTransition(async () => {
      const result = await acceptOrder(order.id)
      if (result?.error) setError(result.error)
      else router.refresh()
    })
  }

  function handleButtonClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (mode === 'accept') runAccept(e)
    else setShowChecklist(true)
  }

  function confirmComplete() {
    setError('')
    startTransition(async () => {
      const result = await completeOrder(order.id)
      if (result?.error) {
        setError(result.error)
        setShowChecklist(false)
      } else {
        setShowChecklist(false)
        router.refresh()
      }
    })
  }

  return (
    <Link
      href={`/orders/${order.id}`}
      className={cn(
        'flex flex-col rounded-lg glass-card overflow-hidden transition-all active:scale-[0.99]',
        overdue && '!border-red-300/50 dark:!border-red-500/25'
      )}
    >
      <div className="px-4 py-3 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 tabular-nums">#{order.order_number}</span>
          {mode === 'complete' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 dark:bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              <ClipboardList size={11} /> {order.items?.length ?? 0} поз.
            </span>
          )}
        </div>

        {order.client ? (
          <p className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">{order.client.name}</p>
        ) : (
          <p className="text-[14px] text-zinc-400 italic">Без клиента</p>
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
        </div>

        {error && <p className="text-[11px] text-red-600">{error}</p>}
      </div>

      <button
        type="button"
        onClick={handleButtonClick}
        disabled={pending}
        className={cn(
          'btn-press flex items-center justify-center gap-2 h-14 text-[14px] font-semibold text-white transition-colors disabled:opacity-60',
          mode === 'accept' ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-emerald-600 hover:bg-emerald-500'
        )}
      >
        {pending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
        {mode === 'accept' ? 'Принять заказ' : 'Готово'}
      </button>

      {showChecklist && (
        <CompleteChecklistModal
          orderNumber={order.order_number}
          items={order.items ?? []}
          pending={pending}
          onConfirm={confirmComplete}
          onClose={() => setShowChecklist(false)}
        />
      )}
    </Link>
  )
}
