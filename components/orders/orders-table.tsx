'use client'

import Link from 'next/link'
import { useState, useTransition, useMemo } from 'react'
import { type Order, type OrderStatus, type OrderStatusConfig, type UserRole } from '@/lib/types/database'
import { updateOrderStatus, deleteOrder } from '@/lib/actions/orders'
import { cn } from '@/lib/utils/format'
import { ClipboardList, User, Calendar, ChevronDown, Loader2, Check, Phone, Trash2, MoreHorizontal, ExternalLink } from 'lucide-react'

const defaultBadge = { label: '???', color: 'bg-slate-50 text-slate-500 border-slate-200', dot: 'bg-slate-400' }

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
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
          <div className="absolute top-full left-0 mt-1.5 z-40 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-200/50 animate-in fade-in slide-in-from-top-1 duration-150">
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
                      ? 'bg-slate-100 text-slate-800'
                      : 'text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <span className={cn('h-2 w-2 rounded-full', cfg.dot)} />
                  <span className="flex-1 text-left">{cfg.label}</span>
                  {isActive && <Check size={13} className="text-slate-400" />}
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
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      await deleteOrder(order.id)
      setOpen(false)
      setConfirmDelete(false)
    })
  }

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(!open)
          setConfirmDelete(false)
        }}
        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
      >
        <MoreHorizontal size={15} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false) }} />
          <div className="absolute top-full right-0 mt-1 z-40 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-200/50 animate-in fade-in slide-in-from-top-1 duration-150">
            <Link
              href={`/orders/${order.id}`}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={13} />
              Открыть заказ
            </Link>

            {order.client?.phone && (
              <a
                href={`tel:${order.client.phone}`}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Phone size={13} />
                Позвонить клиенту
              </a>
            )}

            {userRole === 'admin' && (
              <>
                <div className="my-1 border-t border-slate-100" />
                {!confirmDelete ? (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setConfirmDelete(true)
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={13} />
                    Удалить заказ
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleDelete()
                    }}
                    disabled={isPending}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    Подтвердить удаление
                  </button>
                )}
              </>
            )}
          </div>
        </>
      )}
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
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <ClipboardList size={40} className="text-slate-300 mb-3" />
        <p className="text-sm font-medium text-slate-500">Заказов пока нет</p>
        <p className="text-xs text-slate-400 mt-1">Создайте первый заказ</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden">
      {/* Desktop header */}
      <div className="hidden lg:grid grid-cols-[70px_1fr_140px_120px_130px_90px_36px] gap-3 px-4 py-2.5 bg-slate-50/50 border-b border-slate-100 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
        <span>№</span>
        <span>Клиент</span>
        <span>Статус</span>
        <span>Исполнитель</span>
        <span>Дата</span>
        <span className="text-right">Сумма</span>
        <span></span>
      </div>

      {orders.map((order) => {
        const status = statusMap[order.status] ?? defaultBadge

        return (
          <div
            key={order.id}
            className="group grid lg:grid-cols-[70px_1fr_140px_120px_130px_90px_36px] gap-2 lg:gap-3 px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
          >
            {/* Order number */}
            <div className="flex items-center gap-2 lg:gap-0">
              <Link href={`/orders/${order.id}`} className="text-sm font-bold text-slate-700 hover:text-indigo-600 transition-colors">
                #{order.order_number}
              </Link>
              {/* Mobile: show status badge inline */}
              {!canChangeStatus && (
                <span className={cn('lg:hidden inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border', status.color)}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                  {status.label}
                </span>
              )}
            </div>

            {/* Client + Phone + Note */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Link href={`/orders/${order.id}`} className="min-w-0">
                  {order.client ? (
                    <p className="text-[13px] font-medium text-slate-800 truncate hover:text-indigo-600 transition-colors">{order.client.name}</p>
                  ) : (
                    <p className="text-[13px] text-slate-400 italic">Без клиента</p>
                  )}
                </Link>
                {order.client?.phone && (
                  <a
                    href={`tel:${order.client.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-shrink-0 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                    title={`Позвонить: ${order.client.phone}`}
                  >
                    <Phone size={11} />
                    <span className="hidden sm:inline">{order.client.phone}</span>
                  </a>
                )}
              </div>
              {order.note && (
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{order.note}</p>
              )}
            </div>

            {/* Status (desktop) */}
            <div className="hidden lg:flex items-center">
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
            <div className="hidden lg:flex items-center gap-1.5 text-[12px] text-slate-500">
              {order.assigned_user ? (
                <>
                  <User size={12} className="text-slate-400" />
                  <span className="truncate">{order.assigned_user.full_name}</span>
                </>
              ) : (
                <span className="text-slate-300">—</span>
              )}
            </div>

            {/* Date */}
            <div className="hidden lg:flex items-center gap-1 text-[12px] text-slate-400">
              <Calendar size={12} />
              {formatDate(order.created_at)}
            </div>

            {/* Amount */}
            <div className="hidden lg:flex items-center justify-end">
              <span className="text-sm font-semibold text-slate-800">{formatPrice(order.total_amount)}</span>
            </div>

            {/* Actions menu */}
            <div className="hidden lg:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <RowActions order={order} userRole={userRole} />
            </div>

            {/* Mobile row: status + phone + date + assigned + amount + actions */}
            <div className="flex items-center gap-3 lg:hidden text-[11px] text-slate-400 flex-wrap">
              {canChangeStatus && <StatusDropdown order={order} statuses={statuses} statusMap={statusMap} />}
              <span className="font-semibold text-slate-700">{formatPrice(order.total_amount)}</span>
              <span>{formatDate(order.created_at)}</span>
              {order.assigned_user && (
                <span className="flex items-center gap-1">
                  <User size={10} /> {order.assigned_user.full_name}
                </span>
              )}
              <div className="ml-auto">
                <RowActions order={order} userRole={userRole} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
