'use client'

import Link from 'next/link'
import { useState, useTransition, useMemo } from 'react'
import { type Order, type OrderStatus, type OrderStatusConfig, type UserRole } from '@/lib/types/database'
import { updateOrderStatus, deleteOrder } from '@/lib/actions/orders'
import { cn } from '@/lib/utils/format'
import { ClipboardList, User, Calendar, ChevronDown, Loader2, Check, Phone, Trash2, MoreHorizontal, ExternalLink, Clock, AlertTriangle } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

const defaultBadge = { label: '???', color: 'bg-zinc-50 text-zinc-500 border-zinc-200', dot: 'bg-zinc-400' }

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

function whatsappLink(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return `https://wa.me/${digits}`
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(amount)
}

// ============================================
// Status dropdown for managers/admins
// ============================================
function StatusDropdown({ order, statuses, statusMap }: { order: Order; statuses: OrderStatusConfig[]; statusMap: Record<string, { label: string; color: string; dot: string }> }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const current = statusMap[order.status] ?? defaultBadge

  function handleChange(newStatus: OrderStatus) {
    if (newStatus === order.status) {
      setOpen(false)
      return
    }
    startTransition(async () => {
      await updateOrderStatus(order.id, newStatus)
      setOpen(false)
    })
  }

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(!open)
        }}
        disabled={isPending}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-all hover:shadow-sm',
          current.color,
          isPending && 'opacity-60'
        )}
      >
        {isPending ? (
          <Loader2 size={11} className="animate-spin" />
        ) : (
          <span className={cn('h-1.5 w-1.5 rounded-full', current.dot)} />
        )}
        {current.label}
        <ChevronDown size={11} className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false) }} />
          <div className="absolute top-full left-0 mt-1.5 z-40 w-44 rounded-xl glass-dropdown p-1.5">
            {statuses.map((s) => {
              const cfg = statusMap[s.slug] ?? defaultBadge
              const isActive = order.status === s.slug
              return (
                <button
                  key={s.slug}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleChange(s.slug)
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium transition-colors',
                    isActive
                      ? 'bg-zinc-100 text-zinc-800'
                      : 'text-zinc-600 hover:bg-zinc-50'
                  )}
                >
                  <span className={cn('h-2 w-2 rounded-full', cfg.dot)} />
                  <span className="flex-1 text-left">{cfg.label}</span>
                  {isActive && <Check size={13} className="text-zinc-400" />}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ============================================
// Row actions menu
// ============================================
function RowActions({ order, userRole }: { order: Order; userRole: UserRole }) {
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      await deleteOrder(order.id)
      setConfirmOpen(false)
      setOpen(false)
    })
  }

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(!open)
        }}
        className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/50"
      >
        <MoreHorizontal size={15} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false) }} />
          <div className="absolute top-full right-0 mt-1 z-40 w-48 rounded-xl glass-dropdown p-1.5">
            <Link
              href={`/orders/${order.id}`}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={13} />
              Открыть заказ
            </Link>

            {(order.phone || order.client?.phone) && (
              <>
              <a
                href={`tel:${order.phone || order.client?.phone}`}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Phone size={13} />
                Позвонить
              </a>
              <a
                href={whatsappLink(order.phone || order.client!.phone!)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-green-600 hover:bg-green-50 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Phone size={13} />
                WhatsApp
              </a>
              </>
            )}

            {userRole === 'admin' && (
              <>
                <div className="my-1 border-t border-zinc-100" />
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setOpen(false)
                    setConfirmOpen(true)
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={13} />
                  Удалить заказ
                </button>
              </>
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Удалить заказ?"
        description={`Заказ #${order.order_number} будет удалён безвозвратно. Остатки товаров будут восстановлены.`}
        confirmLabel="Удалить"
        tone="danger"
        loading={isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}

// ============================================
// Table
// ============================================
interface OrdersTableProps {
  orders: Order[]
  userRole: UserRole
  statuses: OrderStatusConfig[]
}

export function OrdersTable({ orders, userRole, statuses }: OrdersTableProps) {
  const canChangeStatus = userRole === 'admin' || userRole === 'manager'

  const statusMap = useMemo(() => {
    const map: Record<string, { label: string; color: string; dot: string }> = {}
    for (const s of statuses) {
      map[s.slug] = { label: s.label, color: s.color, dot: s.dot_color }
    }
    return map
  }, [statuses])

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl glass-card py-16 text-center animate-fade-in-up">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 mb-4">
          <ClipboardList size={28} className="text-zinc-400" />
        </div>
        <p className="text-sm font-semibold text-zinc-600">Заказов пока нет</p>
        <p className="text-xs text-zinc-400 mt-1">Создайте первый заказ</p>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {/* Desktop table */}
      <div className="hidden md:block relative">
        <div className="overflow-x-auto rounded-2xl">
        <div className="rounded-2xl glass-card !p-0 overflow-hidden min-w-[820px]">
        {/* Header */}
        <div className="grid grid-cols-[60px_1fr_120px_130px_140px_120px_90px_36px] gap-2 px-5 py-3 bg-white/30 dark:bg-white/[0.03] text-[11px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-white/30 dark:border-white/[0.05] rounded-t-2xl">
          <span className="sticky left-0">№</span>
          <span>Клиент</span>
          <span>Телефон</span>
          <span>Статус</span>
          <span>Исполнитель</span>
          <span>Дата</span>
          <span className="text-right">Сумма</span>
          <span></span>
        </div>

        {orders.map((order, idx) => {
          const status = statusMap[order.status] ?? defaultBadge
          const overdue = isOverdue(order.deadline, order.status)

          return (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className={cn(
                'group grid grid-cols-[60px_1fr_120px_130px_140px_120px_90px_36px] gap-2 px-5 py-3.5 border-b border-white/20 dark:border-white/[0.04] last:border-0 transition-all duration-200 hover:bg-white/30 dark:hover:bg-white/[0.04]',
                overdue && 'bg-red-50/30 dark:bg-red-950/10',
                idx % 2 === 1 && 'bg-white/20 dark:bg-white/[0.02]'
              )}
            >
              {/* Order number */}
              <div className="flex items-center">
                <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-600 transition-colors tabular-nums">
                  #{order.order_number}
                </span>
              </div>

              {/* Client + Note */}
              <div className="flex flex-col justify-center min-w-0">
                {order.client ? (
                  <p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200 truncate group-hover:text-indigo-600 transition-colors">{order.client.name}</p>
                ) : (
                  <p className="text-[13px] text-zinc-400 italic">Без клиента</p>
                )}
                {order.note && (
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">{order.note}</p>
                )}
              </div>

              {/* Phone */}
              <div className="flex items-center gap-1.5">
                {(order.phone || order.client?.phone) ? (
                  <>
                    <span
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `tel:${order.phone || order.client?.phone}` }}
                      className="inline-flex items-center gap-1 text-[12px] text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                      title={`Позвонить: ${order.phone || order.client?.phone}`}
                    >
                      <Phone size={11} />
                      <span className="truncate">{order.phone || order.client?.phone}</span>
                    </span>
                    <span
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(whatsappLink(order.phone || order.client!.phone!), '_blank') }}
                      className="shrink-0 text-[10px] text-green-600 hover:text-green-700 transition-colors cursor-pointer font-medium"
                      title="WhatsApp"
                    >
                      WA
                    </span>
                  </>
                ) : (
                  <span className="text-zinc-300 text-[12px]">—</span>
                )}
              </div>

              {/* Status */}
              <div className="flex items-center" onClick={(e) => { e.preventDefault(); e.stopPropagation() }}>
                {canChangeStatus ? (
                  <StatusDropdown order={order} statuses={statuses} statusMap={statusMap} />
                ) : (
                  <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium border', status.color)}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                    {status.label}
                  </span>
                )}
              </div>

              {/* Assigned */}
              <div className="flex flex-col justify-center min-w-0">
                {order.assigned_user ? (
                  <>
                    <span className="flex items-center gap-1.5 text-[12px] text-zinc-600 truncate">
                      <User size={12} className="text-zinc-400 flex-shrink-0" />
                      {order.assigned_user.full_name}
                    </span>
                    {order.assigned_user.phone && (
                      <span
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `tel:${order.assigned_user!.phone}` }}
                        className="flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700 ml-[18px] transition-colors cursor-pointer"
                      >
                        <Phone size={10} />
                        {order.assigned_user.phone}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-zinc-300 text-[12px]">—</span>
                )}
              </div>

              {/* Date + Deadline */}
              <div className="flex flex-col justify-center">
                <span className="flex items-center gap-1 text-[12px] text-zinc-400">
                  <Calendar size={12} />
                  {formatDate(order.created_at)}
                </span>
                {order.deadline && (
                  <span className={cn(
                    'flex items-center gap-1 text-[11px] mt-0.5',
                    overdue ? 'text-red-500 font-medium' : 'text-zinc-400'
                  )}>
                    {overdue ? <AlertTriangle size={10} /> : <Clock size={10} />}
                    {formatDate(order.deadline)}
                  </span>
                )}
              </div>

              {/* Amount */}
              <div className="flex items-center justify-end">
                <span className="text-sm font-bold text-zinc-800 tabular-nums">{formatPrice(order.total_amount)}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.preventDefault(); e.stopPropagation() }}>
                <RowActions order={order} userRole={userRole} />
              </div>
            </Link>
          )
        })}
      </div>
        </div>
        {/* Scroll-right fade gradient */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 rounded-r-2xl bg-gradient-to-l from-white/50 to-transparent dark:from-zinc-900/40" />
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3 stagger-children">
        {orders.map((order) => {
          const status = statusMap[order.status] ?? defaultBadge
          const overdue = isOverdue(order.deadline, order.status)

          return (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className={cn(
                'block rounded-2xl glass-card overflow-hidden transition-all duration-200 active:scale-[0.98]',
                overdue && '!border-red-300/40 dark:!border-red-500/20'
              )}
            >
              {/* Card header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/20 dark:border-white/[0.04]">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 tabular-nums">#{order.order_number}</span>
                  <div onClick={(e) => { e.preventDefault(); e.stopPropagation() }}>
                    {canChangeStatus ? (
                      <StatusDropdown order={order} statuses={statuses} statusMap={statusMap} />
                    ) : (
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border', status.color)}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                        {status.label}
                      </span>
                    )}
                  </div>
                  {overdue && (
                    <span className="flex items-center gap-0.5 text-[10px] font-medium text-red-500">
                      <AlertTriangle size={10} />
                      Просрочен
                    </span>
                  )}
                </div>
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 tabular-nums">{formatPrice(order.total_amount)}</span>
              </div>

              {/* Card body */}
              <div className="px-4 py-3 space-y-2">
                {/* Client */}
                <div className="flex items-center justify-between">
                  {order.client ? (
                    <p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200 truncate">{order.client.name}</p>
                  ) : (
                    <p className="text-[13px] text-zinc-400 italic">Без клиента</p>
                  )}
                </div>

                {/* Info row */}
                <div className="flex items-center gap-3 text-[11px] text-zinc-400 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {formatDate(order.created_at)}
                  </span>
                  {order.assigned_user && (
                    <span className="flex items-center gap-1">
                      <User size={11} />
                      {order.assigned_user.full_name}
                    </span>
                  )}
                  {order.deadline && !overdue && (
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {formatDate(order.deadline)}
                    </span>
                  )}
                </div>

                {order.note && (
                  <p className="text-[11px] text-zinc-400 truncate">{order.note}</p>
                )}
              </div>

              {/* Card footer — contact actions */}
              {(order.phone || order.client?.phone) && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-white/20 dark:bg-white/[0.03] border-t border-white/20 dark:border-white/[0.04]" onClick={(e) => { e.preventDefault(); e.stopPropagation() }}>
                  <span
                    onClick={() => { window.location.href = `tel:${order.phone || order.client?.phone}` }}
                    className="btn-press inline-flex items-center gap-1.5 rounded-lg bg-white border border-zinc-200 px-3 py-1.5 text-[11px] font-medium text-zinc-600 hover:bg-zinc-50 transition-colors shadow-sm cursor-pointer"
                  >
                    <Phone size={11} className="text-emerald-500" />
                    {order.phone || order.client?.phone}
                  </span>
                  <span
                    onClick={() => { window.open(whatsappLink(order.phone || order.client!.phone!), '_blank') }}
                    className="btn-press inline-flex items-center gap-1 rounded-lg bg-green-50 border border-green-200/60 px-3 py-1.5 text-[11px] font-medium text-green-700 hover:bg-green-100 transition-colors cursor-pointer"
                  >
                    <Phone size={11} />
                    WA
                  </span>
                  <div className="ml-auto">
                    <RowActions order={order} userRole={userRole} />
                  </div>
                </div>
              )}
              {!(order.phone || order.client?.phone) && (
                <div className="flex items-center justify-end px-4 py-2.5 bg-white/20 dark:bg-white/[0.03] border-t border-white/20 dark:border-white/[0.04]" onClick={(e) => { e.preventDefault(); e.stopPropagation() }}>
                  <RowActions order={order} userRole={userRole} />
                </div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
