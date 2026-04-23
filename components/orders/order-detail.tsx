'use client'

import { useTransition, useState, useMemo, useEffect } from 'react'
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
  MessageCircle,
  History,
  Clock,
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
    timeZone: 'Asia/Almaty',
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
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

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
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Статус</span>
          <span className="text-sm text-slate-300 dark:text-zinc-600">·</span>
          <span className="text-sm text-slate-400 dark:text-zinc-500">{formatDate(order.created_at)}</span>
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
                      ? 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-600 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer'
                      : 'bg-white dark:bg-zinc-800 border-slate-100 dark:border-zinc-800 text-slate-300 dark:text-zinc-600 cursor-default',
                  pending && !isLoading && 'opacity-50'
                )}
              >
                {isLoading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <span className={cn('h-2 w-2 rounded-full', isActive ? cfg.dot_color : 'bg-slate-300 dark:bg-zinc-600')} />
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
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-2">
              <Package size={16} className="text-slate-400 dark:text-zinc-500" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">Позиции заказа</h3>
              <span className="text-xs text-slate-400 dark:text-zinc-500">({order.items?.length ?? 0})</span>
            </div>

            {order.items && order.items.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {order.items.map((item) => (
                  <div key={item.id} className="px-5 py-3 grid grid-cols-[1fr_80px_100px_100px] gap-3 items-center">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-slate-800 dark:text-zinc-200 truncate">
                        {item.product?.name ?? 'Удалённый товар'}
                      </p>
                      {item.product?.sku && (
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono">{item.product.sku}</p>
                      )}
                      {item.note && (
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">{item.note}</p>
                      )}
                    </div>
                    <p className="text-[13px] text-slate-600 dark:text-zinc-300 text-right">
                      {item.quantity} {item.product?.unit ?? 'шт'}
                    </p>
                    <p className="text-[13px] text-slate-500 dark:text-zinc-400 text-right">
                      {formatPrice(item.unit_price)}
                    </p>
                    <p className="text-[13px] font-semibold text-slate-800 dark:text-zinc-200 text-right">
                      {formatPrice(item.total_price)}
                    </p>
                  </div>
                ))}
                {/* Total */}
                <div className="px-5 py-3 bg-slate-50/50 dark:bg-zinc-800/50 grid grid-cols-[1fr_100px] gap-3">
                  <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300 text-right">Итого:</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 text-right">{formatPrice(order.total_amount)}</p>
                </div>
              </div>
            ) : (
              <div className="px-5 py-8 text-center text-sm text-slate-400 dark:text-zinc-500">Нет позиций</div>
            )}
          </div>

          {/* Note */}
          {order.note && (
            <div className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 mb-2">Заметка</h3>
              <p className="text-sm text-slate-600 dark:text-zinc-300 whitespace-pre-wrap">{order.note}</p>
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div className="space-y-5">
          {/* Client */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 mb-3">Контакт</h3>
            {order.phone && (
              <div className="flex items-center gap-2 mb-3">
                <a href={`tel:${order.phone}`} className="flex items-center gap-1.5 text-[13px] text-emerald-600 hover:text-emerald-700">
                  <Phone size={13} /> {order.phone}
                </a>
                <a
                  href={`https://wa.me/${order.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-600 hover:bg-green-100 transition-colors"
                >
                  <MessageCircle size={11} /> WhatsApp
                </a>
              </div>
            )}
            <h4 className="text-xs font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Клиент</h4>
            {order.client ? (
              <div className="space-y-2">
                <p className="text-[13px] font-medium text-slate-800 dark:text-zinc-200">{order.client.name}</p>
                {order.client.phone && (
                  <div className="flex items-center gap-2">
                    <a href={`tel:${order.client.phone}`} className="flex items-center gap-1.5 text-[12px] text-slate-500 dark:text-zinc-400">
                      <Phone size={12} /> {order.client.phone}
                    </a>
                    <a
                      href={`https://wa.me/${order.client.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-green-600 hover:text-green-700"
                    >
                      WA
                    </a>
                  </div>
                )}
                {order.client.email && (
                  <p className="flex items-center gap-1.5 text-[12px] text-slate-500 dark:text-zinc-400">
                    <Mail size={12} /> {order.client.email}
                  </p>
                )}
                {order.client.address && (
                  <p className="flex items-center gap-1.5 text-[12px] text-slate-500 dark:text-zinc-400">
                    <MapPin size={12} /> {order.client.address}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400 dark:text-zinc-500 italic">Клиент не указан</p>
            )}
          </div>

          {/* Assigned to */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 mb-3">Исполнитель</h3>
            {isManager ? (
              <select
                value={order.assigned_to ?? ''}
                onChange={(e) => handleAssign(e.target.value)}
                disabled={pending}
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
              >
                <option value="">Не назначен</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-slate-600 dark:text-zinc-300">
                {order.assigned_user ? order.assigned_user.full_name : <span className="text-slate-400 dark:text-zinc-500 italic">Не назначен</span>}
              </p>
            )}
          </div>

          {/* Meta info */}
          <div className="glass-card rounded-xl p-5 space-y-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 mb-3">Информация</h3>
            <p className="flex items-center gap-1.5 text-[12px] text-slate-500 dark:text-zinc-400">
              <Calendar size={12} />
              Создан: {formatDate(order.created_at)}
            </p>
            <p className="flex items-center gap-1.5 text-[12px] text-slate-500 dark:text-zinc-400">
              <Calendar size={12} />
              Обновлён: {formatDate(order.updated_at)}
            </p>
            {order.deadline && (() => {
              const overdue = mounted && new Date(order.deadline) < new Date() && !['delivered', 'cancelled'].includes(order.status)
              return (
                <p className={cn(
                  'flex items-center gap-1.5 text-[12px]',
                  overdue ? 'text-red-500 font-medium' : 'text-slate-500 dark:text-zinc-400'
                )}>
                  <Clock size={12} />
                  Срок: {formatDate(order.deadline)}
                  {overdue && (
                    <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">Просрочен</span>
                  )}
                </p>
              )
            })()}
            {order.created_user && (
              <p className="flex items-center gap-1.5 text-[12px] text-slate-500 dark:text-zinc-400">
                <User size={12} />
                Автор: {order.created_user.full_name}
              </p>
            )}
          </div>

          {/* History */}
          {order.history && order.history.length > 0 && (
            <div className="glass-card rounded-xl p-5">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-zinc-100 mb-3">
                <History size={14} /> История
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {order.history.map((h) => (
                  <div key={h.id} className="flex items-start gap-2 text-[12px]">
                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-600 mt-1.5" />
                    <div className="min-w-0">
                      <span className="font-medium text-slate-700 dark:text-zinc-300">{h.user?.full_name ?? 'Система'}</span>
                      {' '}
                      <span className="text-slate-500 dark:text-zinc-400">
                        {h.action === 'created' && 'создал заказ'}
                        {h.action === 'status_change' && `изменил статус: ${h.old_value} → ${h.new_value}`}
                        {h.action === 'assigned' && (h.new_value ? `назначил исполнителя` : 'снял исполнителя')}
                      </span>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500">{formatDate(h.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delete — только админ */}
          {userRole === 'admin' && (
          <div className="rounded-xl border border-red-200/80 bg-white dark:bg-zinc-800 p-5">
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
                    className="rounded-lg border border-slate-200 dark:border-zinc-700 px-3 py-1.5 text-sm text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
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
