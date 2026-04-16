'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { type Order, type OrderStatus, type UserRole } from '@/lib/types/database'
import { updateOrderStatus } from '@/lib/actions/orders'
import { cn } from '@/lib/utils/format'
import { ClipboardList, User, Calendar, ChevronDown, Loader2, Check } from 'lucide-react'

const statusConfig: Record<OrderStatus, { label: string; color: string; dot: string }> = {
  new: { label: 'Новый', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  in_progress: { label: 'В работе', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  ready: { label: 'Готов', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  delivered: { label: 'Выдан', color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  cancelled: { label: 'Отменён', color: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-500' },
}

const allStatuses: OrderStatus[] = ['new', 'in_progress', 'ready', 'delivered', 'cancelled']

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
function StatusDropdown({ order }: { order: Order }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const current = statusConfig[order.status] ?? statusConfig.new

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
            {allStatuses.map((s) => {
              const cfg = statusConfig[s]
              const isActive = order.status === s
              return (
                <button
                  key={s}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleChange(s)
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
// Table
// ============================================
interface OrdersTableProps {
  orders: Order[]
  userRole: UserRole
}

export function OrdersTable({ orders, userRole }: OrdersTableProps) {
  const canChangeStatus = userRole === 'admin' || userRole === 'manager'

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
      <div className="hidden sm:grid grid-cols-[80px_1fr_140px_120px_140px_100px] gap-3 px-4 py-2.5 bg-slate-50/50 border-b border-slate-100 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
        <span>№</span>
        <span>Клиент / Заметка</span>
        <span>Статус</span>
        <span>Исполнитель</span>
        <span>Дата</span>
        <span className="text-right">Сумма</span>
      </div>

      {orders.map((order) => {
        const status = statusConfig[order.status] ?? statusConfig.new

        return (
          <div
            key={order.id}
            className="grid sm:grid-cols-[80px_1fr_140px_120px_140px_100px] gap-2 sm:gap-3 px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
          >
            {/* Order number */}
            <div className="flex items-center gap-2 sm:gap-0">
              <Link href={`/orders/${order.id}`} className="text-sm font-bold text-slate-700 hover:text-indigo-600 transition-colors">
                #{order.order_number}
              </Link>
              {/* Mobile: show status badge inline */}
              {!canChangeStatus && (
                <span className={cn('sm:hidden inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border', status.color)}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                  {status.label}
                </span>
              )}
            </div>

            {/* Client + Note */}
            <Link href={`/orders/${order.id}`} className="min-w-0">
              {order.client ? (
                <p className="text-[13px] font-medium text-slate-800 truncate hover:text-indigo-600 transition-colors">{order.client.name}</p>
              ) : (
                <p className="text-[13px] text-slate-400 italic">Без клиента</p>
              )}
              {order.note && (
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{order.note}</p>
              )}
            </Link>

            {/* Status (desktop) */}
            <div className="hidden sm:flex items-center">
              {canChangeStatus ? (
                <StatusDropdown order={order} />
              ) : (
                <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium border', status.color)}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                  {status.label}
                </span>
              )}
            </div>

            {/* Assigned */}
            <div className="hidden sm:flex items-center gap-1.5 text-[12px] text-slate-500">
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
            <div className="hidden sm:flex items-center gap-1 text-[12px] text-slate-400">
              <Calendar size={12} />
              {formatDate(order.created_at)}
            </div>

            {/* Amount */}
            <Link href={`/orders/${order.id}`} className="text-right">
              <span className="text-sm font-semibold text-slate-800">{formatPrice(order.total_amount)}</span>
            </Link>

            {/* Mobile row: status + date + assigned */}
            <div className="flex items-center gap-3 sm:hidden text-[11px] text-slate-400">
              {canChangeStatus && <StatusDropdown order={order} />}
              <span>{formatDate(order.created_at)}</span>
              {order.assigned_user && (
                <span className="flex items-center gap-1">
                  <User size={10} /> {order.assigned_user.full_name}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
