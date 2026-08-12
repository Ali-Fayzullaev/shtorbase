'use client'

import { useTransition, useState, useMemo, useEffect } from 'react'
import { type Order, type OrderStatus, type OrderStatusConfig, type UserRole } from '@/lib/types/database'
import { updateOrderStatus, assignOrder, deleteOrder, updateOrderDiscount, acceptOrder, completeOrder } from '@/lib/actions/orders'
import { addPayment, deletePayment } from '@/lib/actions/payments'
import { cn, getPayable } from '@/lib/utils/format'
import { PaymentBadge } from './payment-badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { CompleteChecklistModal } from './complete-checklist-modal'
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
  Wallet,
  Percent,
  Plus,
  X,
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
  currentUserId: string
}

export function OrderDetail({ order, employees, userRole, statuses, currentUserId }: OrderDetailProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [showDelete, setShowDelete] = useState(false)
  const [selfActionPending, startSelfActionTransition] = useTransition()

  const [changingTo, setChangingTo] = useState<string | null>(null)
  const [deliverConfirmStatus, setDeliverConfirmStatus] = useState<string | null>(null)

  const [editingDiscount, setEditingDiscount] = useState(false)
  const [discountInput, setDiscountInput] = useState('')
  const [discountPending, startDiscountTransition] = useTransition()

  const [showChecklist, setShowChecklist] = useState(false)

  const [showAddPayment, setShowAddPayment] = useState(false)
  const [paymentAmountInput, setPaymentAmountInput] = useState('')
  const [paymentNoteInput, setPaymentNoteInput] = useState('')
  const [paymentPending, startPaymentTransition] = useTransition()
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null)
  const [deletePaymentPending, startDeletePaymentTransition] = useTransition()

  const payable = getPayable(order)
  const remaining = Math.max(payable - order.paid_amount, 0)

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
    if (newStatus === 'delivered' && order.payment_status !== 'paid') {
      setDeliverConfirmStatus(newStatus)
      return
    }
    performStatusChange(newStatus)
  }

  function performStatusChange(newStatus: OrderStatus) {
    setError('')
    setChangingTo(newStatus)
    startTransition(async () => {
      const result = await updateOrderStatus(order.id, newStatus)
      if (result?.error) setError(result.error)
      else router.refresh()
      setChangingTo(null)
    })
  }

  function handleSaveDiscount() {
    const amount = parseFloat(discountInput)
    if (!Number.isFinite(amount) || amount < 0) {
      setError('Некорректная сумма скидки')
      return
    }
    setError('')
    startDiscountTransition(async () => {
      const result = await updateOrderDiscount(order.id, amount)
      if (result?.error) setError(result.error)
      else {
        setEditingDiscount(false)
        router.refresh()
      }
    })
  }

  function handleAddPayment() {
    const amount = parseFloat(paymentAmountInput)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Некорректная сумма оплаты')
      return
    }
    setError('')
    startPaymentTransition(async () => {
      const result = await addPayment(order.id, amount, paymentNoteInput)
      if (result?.error) setError(result.error)
      else {
        setShowAddPayment(false)
        setPaymentAmountInput('')
        setPaymentNoteInput('')
        router.refresh()
      }
    })
  }

  function handleDeletePayment(paymentId: string) {
    setError('')
    setDeletingPaymentId(paymentId)
    startDeletePaymentTransition(async () => {
      const result = await deletePayment(paymentId)
      if (result?.error) setError(result.error)
      else router.refresh()
      setDeletingPaymentId(null)
    })
  }

  const canAccept = userRole === 'employee' && order.status === 'new' && !order.assigned_to
  const canComplete = userRole === 'employee' && order.status === 'in_progress' && order.assigned_to === currentUserId

  function handleSelfAction(action: 'accept' | 'complete') {
    setError('')
    startSelfActionTransition(async () => {
      const result = action === 'accept' ? await acceptOrder(order.id) : await completeOrder(order.id)
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

      {/* Крупное действие для сотрудника — принять/завершить заказ */}
      {(canAccept || canComplete) && (
        <button
          onClick={() => canAccept ? handleSelfAction('accept') : setShowChecklist(true)}
          disabled={selfActionPending}
          className={cn(
            'btn-press flex w-full items-center justify-center gap-2 rounded-xl h-14 text-[15px] font-semibold text-white shadow-sm transition-colors disabled:opacity-60',
            canAccept ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-emerald-600 hover:bg-emerald-500'
          )}
        >
          {selfActionPending && <Loader2 size={16} className="animate-spin" />}
          {canAccept ? '✅ Принять заказ' : '✔️ Готово'}
        </button>
      )}

      {showChecklist && (
        <CompleteChecklistModal
          orderNumber={order.order_number}
          items={order.items ?? []}
          pending={selfActionPending}
          onConfirm={() => { setShowChecklist(false); handleSelfAction('complete') }}
          onClose={() => setShowChecklist(false)}
        />
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
                      <p className="text-[13px] font-medium text-slate-800 dark:text-zinc-200">
                        {item.product?.name ?? 'Удалённый товар'}
                      </p>
                      {item.product?.sku && (
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono">{item.product.sku}</p>
                      )}
                      {item.custom_attributes && Object.keys(item.custom_attributes).length > 0 && (
                        <p className="flex flex-wrap gap-x-2 text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                          {Object.entries(item.custom_attributes).map(([k, v]) => (
                            <span key={k}>
                              <span className="text-slate-400 dark:text-zinc-500">{k}:</span> {v}
                            </span>
                          ))}
                        </p>
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
                <div className="px-5 py-3 bg-slate-50/50 dark:bg-zinc-800/50 space-y-1">
                  {order.discount_amount > 0 && (
                    <>
                      <div className="grid grid-cols-[1fr_100px] gap-3">
                        <p className="text-[12px] text-slate-500 dark:text-zinc-400 text-right">Сумма товаров:</p>
                        <p className="text-[12px] text-slate-500 dark:text-zinc-400 text-right">{formatPrice(order.total_amount)}</p>
                      </div>
                      <div className="grid grid-cols-[1fr_100px] gap-3">
                        <p className="text-[12px] text-amber-600 text-right">Скидка:</p>
                        <p className="text-[12px] text-amber-600 text-right">−{formatPrice(order.discount_amount)}</p>
                      </div>
                    </>
                  )}
                  <div className="grid grid-cols-[1fr_100px] gap-3">
                    <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300 text-right">Итого к оплате:</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 text-right">{formatPrice(payable)}</p>
                  </div>
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
          {/* Client — менеджеру/админу нужен контакт клиента, сотруднику нет */}
          {isManager && (
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
          )}

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

          {/* Payment — сотруднику эти детали не нужны, это работа менеджера */}
          {isManager && (
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-zinc-100">
                <Wallet size={14} /> Оплата
              </h3>
              <PaymentBadge status={order.payment_status} paidAmount={order.paid_amount} totalAmount={payable} />
            </div>
            <p className="text-[13px] text-slate-600 dark:text-zinc-300">
              {formatPrice(order.paid_amount)} из {formatPrice(payable)}
              {remaining > 0 && <span className="text-red-500 font-medium"> · долг {formatPrice(remaining)}</span>}
            </p>

            {/* Скидка */}
            {isManager && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-1.5 text-[12px] text-slate-500 dark:text-zinc-400 mb-1.5">
                  <Percent size={12} /> Скидка
                </div>
                {editingDiscount ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={discountInput}
                      onChange={(e) => setDiscountInput(e.target.value)}
                      autoFocus
                      className="h-8 w-28 rounded-md border border-slate-200 dark:border-zinc-700 bg-transparent px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                    <button
                      onClick={handleSaveDiscount}
                      disabled={discountPending}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[12px] font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {discountPending && <Loader2 size={12} className="animate-spin" />}
                      Сохранить
                    </button>
                    <button
                      onClick={() => setEditingDiscount(false)}
                      disabled={discountPending}
                      className="rounded-lg border border-slate-200 dark:border-zinc-700 px-2.5 py-1.5 text-[12px] text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                    >
                      Отмена
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setDiscountInput(String(order.discount_amount)); setEditingDiscount(true) }}
                    className="text-[12px] font-medium text-primary hover:underline"
                  >
                    {order.discount_amount > 0 ? `${formatPrice(order.discount_amount)} — изменить` : 'Добавить скидку'}
                  </button>
                )}
              </div>
            )}

            {/* История платежей */}
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] text-slate-500 dark:text-zinc-400">Платежи {order.payments?.length ? `(${order.payments.length})` : ''}</span>
                {isManager && remaining > 0 && !showAddPayment && (
                  <button
                    onClick={() => { setPaymentAmountInput(String(remaining)); setShowAddPayment(true) }}
                    className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
                  >
                    <Plus size={12} /> Добавить оплату
                  </button>
                )}
              </div>

              {showAddPayment && (
                <div className="space-y-2 mb-3 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 p-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={paymentAmountInput}
                      onChange={(e) => setPaymentAmountInput(e.target.value)}
                      autoFocus
                      placeholder="Сумма"
                      className="h-8 w-28 rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                    <input
                      type="text"
                      value={paymentNoteInput}
                      onChange={(e) => setPaymentNoteInput(e.target.value)}
                      placeholder="Комментарий (необязательно)"
                      className="h-8 flex-1 min-w-0 rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddPayment}
                      disabled={paymentPending}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[12px] font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {paymentPending && <Loader2 size={12} className="animate-spin" />}
                      Записать оплату
                    </button>
                    <button
                      onClick={() => setShowAddPayment(false)}
                      disabled={paymentPending}
                      className="rounded-lg border border-slate-200 dark:border-zinc-700 px-2.5 py-1.5 text-[12px] text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              )}

              {order.payments && order.payments.length > 0 ? (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {order.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-2 text-[12px]">
                      <div className="min-w-0">
                        <span className="font-medium text-slate-700 dark:text-zinc-300 tabular-nums">{formatPrice(p.amount)}</span>
                        <span className="text-slate-400 dark:text-zinc-500"> · {p.user?.full_name ?? 'Система'} · {formatDate(p.created_at)}</span>
                        {p.note && <span className="text-slate-400 dark:text-zinc-500"> · {p.note}</span>}
                      </div>
                      {userRole === 'admin' && (
                        <button
                          onClick={() => handleDeletePayment(p.id)}
                          disabled={deletePaymentPending && deletingPaymentId === p.id}
                          className="shrink-0 text-slate-300 dark:text-zinc-600 hover:text-red-500 transition-colors disabled:opacity-50"
                          title="Удалить оплату"
                        >
                          {deletePaymentPending && deletingPaymentId === p.id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-slate-400 dark:text-zinc-500 italic">Оплат ещё не было</p>
              )}
            </div>
          </div>
          )}

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
                        {h.action === 'payment_added' && `добавил оплату: ${formatPrice(Number(h.new_value ?? 0))}`}
                        {h.action === 'payment_removed' && `удалил оплату: ${formatPrice(Number(h.old_value ?? 0))}`}
                        {h.action === 'discount_update' && `изменил скидку: ${formatPrice(Number(h.old_value ?? 0))} → ${formatPrice(Number(h.new_value ?? 0))}`}
                        {h.action === 'payment_update' && `изменил оплату: ${formatPrice(Number(h.old_value ?? 0))} → ${formatPrice(Number(h.new_value ?? 0))}`}
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

      <ConfirmDialog
        open={!!deliverConfirmStatus}
        title="Заказ оплачен не полностью"
        description={`Оплачено ${formatPrice(order.paid_amount)} из ${formatPrice(payable)}. Всё равно выдать заказ?`}
        confirmLabel="Всё равно выдать"
        tone="danger"
        loading={pending}
        onConfirm={() => {
          const status = deliverConfirmStatus
          setDeliverConfirmStatus(null)
          if (status) performStatusChange(status)
        }}
        onCancel={() => setDeliverConfirmStatus(null)}
      />
    </div>
  )
}
