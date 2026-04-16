'use client'

import { useTransition, useState } from 'react'
import { type Order, type OrderStatus, type UserRole } from '@/lib/types/database'
import { updateOrderStatus, assignOrder, deleteOrder } from '@/lib/actions/orders'
import { cn } from '@/lib/utils/format'
import {
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Package,
  ChevronRight,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

const statusConfig: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  new: { label: 'Новый', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  in_progress: { label: 'В работе', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  ready: { label: 'Готов', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  delivered: { label: 'Выдан', color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200' },
  cancelled: { label: 'Отменён', color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
}

const statusActions: Record<OrderStatus, { label: string; next: OrderStatus; style: string }[]> = {
  new: [
    { label: 'Взять в работу', next: 'in_progress', style: 'bg-amber-500 hover:bg-amber-600 text-white' },
    { label: 'Отменить', next: 'cancelled', style: 'bg-white border border-red-200 text-red-600 hover:bg-red-50' },
  ],
  in_progress: [
    { label: 'Готов', next: 'ready', style: 'bg-emerald-500 hover:bg-emerald-600 text-white' },
    { label: 'Отменить', next: 'cancelled', style: 'bg-white border border-red-200 text-red-600 hover:bg-red-50' },
  ],
  ready: [
    { label: 'Выдать', next: 'delivered', style: 'bg-primary hover:bg-primary/90 text-white' },
    { label: 'Вернуть в работу', next: 'in_progress', style: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50' },
  ],
  delivered: [],
  cancelled: [
    { label: 'Восстановить', next: 'new', style: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50' },
  ],
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(amount)
}

interface OrderDetailProps {
  order: Order
  employees: { id: string; full_name: string; role: string }[]
  userRole: UserRole
}

export function OrderDetail({ order, employees, userRole }: OrderDetailProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [showDelete, setShowDelete] = useState(false)

  const isManager = userRole === 'manager' || userRole === 'admin'
  const status = statusConfig[order.status] ?? statusConfig.new
  const actions = isManager ? (statusActions[order.status] ?? []) : []

  function handleStatusChange(newStatus: OrderStatus) {
    setError('')
    startTransition(async () => {
      const result = await updateOrderStatus(order.id, newStatus)
      if (result?.error) setError(result.error)
      else router.refresh()
    })
  }

  function handleAssign(userId: string) {
    startTransition(async () => {
      const result = await assignOrder(order.id, userId || null)
      if (result?.error) setError(result.error)
      else router.refresh()
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteOrder(order.id)
      if (result?.error) setError(result.error)
      else router.push('/orders')
    })
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Status + Actions */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className={cn('inline-flex rounded-full px-3 py-1 text-sm font-semibold border', status.bg, status.color)}>
              {status.label}
            </span>
            <span className="text-sm text-slate-400">{formatDate(order.created_at)}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
              <button
                key={action.next}
                onClick={() => handleStatusChange(action.next)}
                disabled={pending}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-50',
                  action.style
                )}
              >
                <ChevronRight size={14} />
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Items */}
        <div className="lg:col-span-2 space-y-5">
          {/* Order items */}
          <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
              <Package size={16} className="text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-900">Позиции заказа</h3>
              <span className="text-xs text-slate-400">({order.items?.length ?? 0})</span>
            </div>

            {order.items && order.items.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {order.items.map((item) => (
                  <div key={item.id} className="px-5 py-3 grid grid-cols-[1fr_80px_100px_100px] gap-3 items-center">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-slate-800 truncate">
                        {item.product?.name ?? 'Удалённый товар'}
                      </p>
                      {item.product?.sku && (
                        <p className="text-[11px] text-slate-400 font-mono">{item.product.sku}</p>
                      )}
                      {item.note && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{item.note}</p>
                      )}
                    </div>
                    <p className="text-[13px] text-slate-600 text-right">
                      {item.quantity} {item.product?.unit ?? 'шт'}
                    </p>
                    <p className="text-[13px] text-slate-500 text-right">
                      {formatPrice(item.unit_price)}
                    </p>
                    <p className="text-[13px] font-semibold text-slate-800 text-right">
                      {formatPrice(item.total_price)}
                    </p>
                  </div>
                ))}
                {/* Total */}
                <div className="px-5 py-3 bg-slate-50/50 grid grid-cols-[1fr_100px] gap-3">
                  <p className="text-sm font-semibold text-slate-700 text-right">Итого:</p>
                  <p className="text-sm font-bold text-slate-900 text-right">{formatPrice(order.total_amount)}</p>
                </div>
              </div>
            ) : (
              <div className="px-5 py-8 text-center text-sm text-slate-400">Нет позиций</div>
            )}
          </div>

          {/* Note */}
          {order.note && (
            <div className="rounded-xl border border-slate-200/80 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Заметка</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{order.note}</p>
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div className="space-y-5">
          {/* Client */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Клиент</h3>
            {order.client ? (
              <div className="space-y-2">
                <p className="text-[13px] font-medium text-slate-800">{order.client.name}</p>
                {order.client.phone && (
                  <p className="flex items-center gap-1.5 text-[12px] text-slate-500">
                    <Phone size={12} /> {order.client.phone}
                  </p>
                )}
                {order.client.email && (
                  <p className="flex items-center gap-1.5 text-[12px] text-slate-500">
                    <Mail size={12} /> {order.client.email}
                  </p>
                )}
                {order.client.address && (
                  <p className="flex items-center gap-1.5 text-[12px] text-slate-500">
                    <MapPin size={12} /> {order.client.address}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">Клиент не указан</p>
            )}
          </div>

          {/* Assigned to */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Исполнитель</h3>
            {isManager ? (
              <select
                value={order.assigned_to ?? ''}
                onChange={(e) => handleAssign(e.target.value)}
                disabled={pending}
                className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
              >
                <option value="">Не назначен</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-slate-600">
                {order.assigned_user ? order.assigned_user.full_name : <span className="text-slate-400 italic">Не назначен</span>}
              </p>
            )}
          </div>

          {/* Meta info */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 space-y-2">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Информация</h3>
            <p className="flex items-center gap-1.5 text-[12px] text-slate-500">
              <Calendar size={12} />
              Создан: {formatDate(order.created_at)}
            </p>
            <p className="flex items-center gap-1.5 text-[12px] text-slate-500">
              <Calendar size={12} />
              Обновлён: {formatDate(order.updated_at)}
            </p>
            {order.created_user && (
              <p className="flex items-center gap-1.5 text-[12px] text-slate-500">
                <User size={12} />
                Автор: {order.created_user.full_name}
              </p>
            )}
          </div>

          {/* Delete — только админ */}
          {userRole === 'admin' && (
          <div className="rounded-xl border border-red-200/80 bg-white p-5">
            {!showDelete ? (
              <button
                onClick={() => setShowDelete(true)}
                className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors"
              >
                <Trash2 size={14} />
                Удалить заказ
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertTriangle size={14} />
                  Удалить заказ #{order.order_number}?
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={pending}
                    className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    Удалить
                  </button>
                  <button
                    onClick={() => setShowDelete(false)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  )
}
