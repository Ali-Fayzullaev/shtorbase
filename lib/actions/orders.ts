'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { type Order, type OrderStatus } from '@/lib/types/database'

// ============================================
// Helpers
// ============================================
async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Не авторизован')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  return { user, role: profile?.role ?? 'employee' }
}

// ============================================
// Получение заказов
// ============================================
export interface OrdersParams {
  status?: string
  search?: string
  page?: number
}

export async function getOrders(params: OrdersParams = {}) {
  const admin = createAdminClient()
  const perPage = 20
  const page = params.page ?? 1
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  let query = admin
    .from('orders')
    .select('*, client:clients(*)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  if (params.search) {
    query = query.or(`note.ilike.%${params.search}%,order_number.eq.${parseInt(params.search) || 0}`)
  }

  const { data, count, error } = await query

  if (error) {
    console.error('getOrders error:', error)
  }

  // FK assigned_to/created_by -> auth.users, not profiles.
  // Fetch profiles separately.
  const rows = data ?? []
  const userIds = [...new Set(rows.flatMap((r) => [r.assigned_to, r.created_by]).filter(Boolean))] as string[]
  let profileMap: Record<string, { id: string; full_name: string; role: string }> = {}
  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, full_name, role')
      .in('id', userIds)
    for (const p of profiles ?? []) {
      profileMap[p.id] = p
    }
  }

  const orders = rows.map((r) => ({
    ...r,
    assigned_user: r.assigned_to ? profileMap[r.assigned_to] ?? null : null,
    created_user: r.created_by ? profileMap[r.created_by] ?? null : null,
  }))

  return {
    orders: orders as Order[],
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / perPage),
  }
}

export async function getOrder(id: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('orders')
    .select('*, client:clients(*)')
    .eq('id', id)
    .single()

  if (!data) return null

  // Fetch profiles for assigned_to / created_by
  const userIds = [data.assigned_to, data.created_by].filter(Boolean) as string[]
  let profileMap: Record<string, { id: string; full_name: string; role: string }> = {}
  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, full_name, role')
      .in('id', userIds)
    for (const p of profiles ?? []) {
      profileMap[p.id] = p
    }
  }

  // Fetch items
  const { data: items } = await admin
    .from('order_items')
    .select('*, product:products(id, sku, name, unit, price)')
    .eq('order_id', id)
    .order('created_at')

  return {
    ...data,
    assigned_user: data.assigned_to ? profileMap[data.assigned_to] ?? null : null,
    created_user: data.created_by ? profileMap[data.created_by] ?? null : null,
    items: items ?? [],
  } as Order
}

// ============================================
// Dashboard stats
// ============================================
export async function getOrderStats() {
  const admin = createAdminClient()

  const { count: total } = await admin
    .from('orders')
    .select('*', { count: 'exact', head: true })

  const { count: newCount } = await admin
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'new')

  const { count: inProgress } = await admin
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'in_progress')

  const { count: ready } = await admin
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ready')

  return {
    total: total ?? 0,
    new: newCount ?? 0,
    inProgress: inProgress ?? 0,
    ready: ready ?? 0,
  }
}

// ============================================
// Создание заказа
// ============================================
const OrderItemSchema = z.object({
  product_id: z.string().min(1),
  quantity: z.coerce.number().positive('Кол-во > 0'),
  unit_price: z.coerce.number().min(0),
  note: z.string().max(500).optional(),
})

export type OrderFormState = {
  error?: string
  fieldErrors?: Record<string, string>
} | null

export async function createOrderAction(
  _prevState: OrderFormState,
  formData: FormData
): Promise<OrderFormState> {
  try {
    const { user, role } = await requireAuth()

    const clientId = formData.get('client_id') as string
    const assignedTo = formData.get('assigned_to') as string

    // Сотрудники не могут назначать исполнителей
    const finalAssignedTo = role === 'employee' ? null : (assignedTo || null)
    const note = formData.get('note') as string

    // Parse items from form
    const itemsJson = formData.get('items') as string
    let items: z.infer<typeof OrderItemSchema>[] = []
    try {
      const parsed = JSON.parse(itemsJson || '[]')
      items = z.array(OrderItemSchema).parse(parsed)
    } catch {
      return { error: 'Добавьте хотя бы одну позицию в заказ' }
    }

    if (items.length === 0) {
      return { error: 'Добавьте хотя бы одну позицию в заказ' }
    }

    const admin = createAdminClient()

    // Create order
    const { data: order, error: orderErr } = await admin
      .from('orders')
      .insert({
        client_id: clientId || null,
        assigned_to: finalAssignedTo,
        note: note?.trim() || null,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (orderErr) return { error: `Не удалось создать заказ: ${orderErr.message}` }

    // Create items
    const rows = items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      note: item.note || null,
    }))

    const { error: itemsErr } = await admin.from('order_items').insert(rows)
    if (itemsErr) {
      // Cleanup order if items failed
      await admin.from('orders').delete().eq('id', order.id)
      return { error: `Ошибка добавления позиций: ${itemsErr.message}` }
    }

    revalidatePath('/orders')
  } catch (err) {
    if (err && typeof err === 'object' && 'digest' in err) throw err
    return { error: err instanceof Error ? err.message : 'Неизвестная ошибка' }
  }

  redirect('/orders')
}

// ============================================
// Быстрый заказ из каталога (без redirect)
// ============================================
export async function createQuickOrder(
  items: { product_id: string; quantity: number; unit_price: number }[],
  note?: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    const { user } = await requireAuth()

    if (!items.length) return { error: 'Добавьте хотя бы одну позицию' }

    const validated = z.array(OrderItemSchema).parse(items)

    const admin = createAdminClient()

    const { data: order, error: orderErr } = await admin
      .from('orders')
      .insert({
        note: note?.trim() || null,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (orderErr) return { error: `Не удалось создать заказ: ${orderErr.message}` }

    const rows = validated.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      note: item.note || null,
    }))

    const { error: itemsErr } = await admin.from('order_items').insert(rows)
    if (itemsErr) {
      await admin.from('orders').delete().eq('id', order.id)
      return { error: `Ошибка добавления позиций: ${itemsErr.message}` }
    }

    revalidatePath('/orders')
    revalidatePath('/catalog')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Неизвестная ошибка' }
  }
}

// ============================================
// Обновление статуса
// ============================================
export async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
  const { user, role } = await requireAuth()

  // Только менеджер и админ могут менять статусы
  if (role === 'employee') {
    return { error: 'Только менеджер или админ может изменять статус заказа' }
  }

  const admin = createAdminClient()
  const { data: order } = await admin
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single()

  if (!order) return { error: 'Заказ не найден' }

  if (order.status === newStatus) return { success: true }

  const { error } = await admin
    .from('orders')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (error) return { error: `Не удалось обновить статус: ${error.message}` }

  revalidatePath('/orders')
  revalidatePath(`/orders/${orderId}`)
  return { success: true }
}

// ============================================
// Назначение заказа сотруднику
// ============================================
export async function assignOrder(orderId: string, userId: string | null) {
  const { role } = await requireAuth()
  if (role === 'employee') return { error: 'Нет прав' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('orders')
    .update({ assigned_to: userId, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (error) return { error: `Ошибка: ${error.message}` }

  revalidatePath('/orders')
  revalidatePath(`/orders/${orderId}`)
  return { success: true }
}

// ============================================
// Получение сотрудников для назначения
// ============================================
export async function getEmployees() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('id, full_name, role')
    .eq('is_active', true)
    .order('full_name')
  return (data ?? []) as { id: string; full_name: string; role: string }[]
}

// ============================================
// Удаление заказа
// ============================================
export async function deleteOrder(orderId: string) {
  const { role } = await requireAuth()
  if (role !== 'admin') return { error: 'Только администратор может удалять заказы' }

  const admin = createAdminClient()
  const { error } = await admin.from('orders').delete().eq('id', orderId)
  if (error) return { error: `Ошибка: ${error.message}` }

  revalidatePath('/orders')
  return { success: true }
}
