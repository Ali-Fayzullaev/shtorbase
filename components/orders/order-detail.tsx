'use client'

import { useTransition, useState, useMemo } from 'react'
import { type Order, type OrderStatus, type OrderStatusConfig, type UserRole } from '@/lib/types/database'
import { updateOrderStatus, assignOrder, deleteOrder } from '@/lib/actions/orders'
import { cn } from '@/lib/utils/format'
import {
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Package,
  Trash2,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

const defaultBadge = { label: '???', color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200' }

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
  statuses: OrderStatusConfig[]
}

export function OrderDetail({ order, employees, userRole, statuses }: OrderDetailProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [showDelete, setShowDelete] = useState(false)

  const [changingTo, setChangingTo] = useState<string | null>(null)

  const isManager = userRole === 'manager' || userRole === 'admin'

  const statusMap = useMemo(() => {
    const map: Record<string, { label: string; color: string; bg: string; dot_color: string }> = {}
    for (const s of statuses) {
      map[s.slug] = { label: s.label, color: s.color.replace('bg-', 'text-').split(' ').find(c => c.startsWith('text-')) ?? 'text-slate-500', bg: s.color, dot_color: s.dot_color }
    }
    return map
  }, [statuses])

  const status = statusMap[order.status] ?? defaultBadge

  function handleStatusChange(newStatus: OrderStatus) {
    if (newStatus === order.status) return
    setError('')
    setChangingTo(newStatus)
    startTransition(async () => {
      const result = await updateOrderStatus(order.id, newStatus)
      if (result?.error) setError(result.error)
      else router.refresh()
      setChangingTo(null)
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
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Статус</span>
          <span className="text-sm text-slate-300">·</span>
          <span className="text-sm text-slate-400">{formatDate(order.created_at)}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => {
            const cfg = statusMap[s.slug] ?? defaultBadge
            const isActive = order.status === s.slug
            const isLoading = changingTo === s.slug
            return (
              <button
                key={s.slug}
                onClick={() => isManager && handleStatusChange(s.slug)}
                disabled={pending || !isManager}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium border transition-all',
                  isActive
                    ? cn(cfg.bg, 'ring-2 ring-offset-1 ring-primary/30 shadow-sm')
                    : isManager
                      ? 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 cursor-pointer'
                      : 'bg-white border-slate-100 text-slate-300 cursor-default',
                  pending && !isLoading && 'opacity-50'
                )}
              >
                {isLoading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <span className={cn('h-2 w-2 rounded-full', isActive ? cfg.dot_color : 'bg-slate-300')} />
                )}
                {cfg.label}
              </button>
            )
          })}
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
