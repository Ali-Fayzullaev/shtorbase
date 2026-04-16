'use client'

import Link from 'next/link'
import { type Order, type OrderStatus } from '@/lib/types/database'
import { cn } from '@/lib/utils/format'
import { ClipboardList, User, Calendar } from 'lucide-react'

const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
  new: { label: 'Новый', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  in_progress: { label: 'В работе', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  ready: { label: 'Готов', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  delivered: { label: 'Выдан', color: 'bg-slate-50 text-slate-500 border-slate-200' },
  cancelled: { label: 'Отменён', color: 'bg-red-50 text-red-600 border-red-200' },
}

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

interface OrdersTableProps {
  orders: Order[]
}

export function OrdersTable({ orders }: OrdersTableProps) {
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
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            className="grid sm:grid-cols-[80px_1fr_140px_120px_140px_100px] gap-2 sm:gap-3 px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
          >
            {/* Order number */}
            <div className="flex items-center gap-2 sm:gap-0">
              <span className="text-sm font-bold text-slate-700">#{order.order_number}</span>
              {/* Mobile: show status badge inline */}
              <span className={cn('sm:hidden inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium border', status.color)}>
                {status.label}
              </span>
            </div>

            {/* Client + Note */}
            <div className="min-w-0">
              {order.client ? (
                <p className="text-[13px] font-medium text-slate-800 truncate">{order.client.name}</p>
              ) : (
                <p className="text-[13px] text-slate-400 italic">Без клиента</p>
              )}
              {order.note && (
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{order.note}</p>
              )}
            </div>

            {/* Status (desktop) */}
            <div className="hidden sm:flex items-center">
              <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium border', status.color)}>
                {status.label}
              </span>
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
            <div className="text-right">
              <span className="text-sm font-semibold text-slate-800">{formatPrice(order.total_amount)}</span>
            </div>

            {/* Mobile row: date + assigned */}
            <div className="flex items-center gap-3 sm:hidden text-[11px] text-slate-400">
              <span>{formatDate(order.created_at)}</span>
              {order.assigned_user && (
                <span className="flex items-center gap-1">
                  <User size={10} /> {order.assigned_user.full_name}
                </span>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
