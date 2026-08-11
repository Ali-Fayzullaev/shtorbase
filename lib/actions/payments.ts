'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { requireAuth, logOrderHistory } from './orders'

// ============================================
// Платежи по заказу (история оплат — вместо одного числа)
// ============================================

export async function addPayment(orderId: string, amount: number, note?: string) {
  const { user, role } = await requireAuth()
  if (role === 'employee') return { error: 'Нет прав' }

  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: 'Некорректная сумма' }
  }

  const admin = createAdminClient()
  const { data: order } = await admin
    .from('orders')
    .select('total_amount, discount_amount, paid_amount')
    .eq('id', orderId)
    .single()

  if (!order) return { error: 'Заказ не найден' }

  const payable = Math.max(order.total_amount - order.discount_amount, 0)
  const remaining = payable - order.paid_amount
  if (amount > remaining + 0.01) {
    return { error: `Сумма превышает остаток к оплате (${remaining.toFixed(0)} ₸)` }
  }

  const { error } = await admin.from('payments').insert({
    order_id: orderId,
    amount,
    note: note?.trim() || null,
    created_by: user.id,
  })

  if (error) return { error: `Не удалось записать оплату: ${error.message}` }

  await logOrderHistory(admin, orderId, user.id, 'payment_added', null, String(amount))

  revalidatePath('/orders')
  revalidatePath(`/orders/${orderId}`)
  return { success: true }
}

export async function deletePayment(paymentId: string) {
  const { user, role } = await requireAuth()
  if (role !== 'admin') return { error: 'Только администратор может удалять оплаты' }

  const admin = createAdminClient()
  const { data: payment } = await admin
    .from('payments')
    .select('order_id, amount')
    .eq('id', paymentId)
    .single()

  if (!payment) return { error: 'Оплата не найдена' }

  const { error } = await admin.from('payments').delete().eq('id', paymentId)
  if (error) return { error: `Не удалось удалить оплату: ${error.message}` }

  await logOrderHistory(admin, payment.order_id, user.id, 'payment_removed', String(payment.amount), null)

  revalidatePath('/orders')
  revalidatePath(`/orders/${payment.order_id}`)
  return { success: true }
}
