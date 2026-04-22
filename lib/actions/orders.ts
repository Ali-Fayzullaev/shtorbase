'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { type Order, type OrderStatus } from '@/lib/types/database'
import { createNotification } from './notifications'

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

/** Reduce stock for each item in an order */
async function deductStock(
  admin: ReturnType<typeof createAdminClient>,
  items: { product_id: string; quantity: number }[]
) {
  for (const item of items) {
    const { data: product } = await admin
      .from('products')
      .select('stock')
      .eq('id', item.product_id)
      .single()
    if (product) {
      const newStock = Math.max(0, product.stock - item.quantity)
      await admin.from('products').update({ stock: newStock }).eq('id', item.product_id)
    }
  }
}

/** Restore stock for each item in an order */
async function restoreStock(
  admin: ReturnType<typeof createAdminClient>,
  orderId: string
) {
  const { data: items } = await admin
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', orderId)
  if (!items?.length) return
  for (const item of items) {
    const { data: product } = await admin
      .from('products')
      .select('stock')
      .eq('id', item.product_id)
      .single()
    if (product) {
      await admin.from('products').update({ stock: product.stock + item.quantity }).eq('id', item.product_id)
    }
  }
}

/** Check stock availability, return errors for insufficient items */
async function checkStock(
  admin: ReturnType<typeof createAdminClient>,
  items: { product_id: string; quantity: number }[]
): Promise<string[]> {
  const errors: string[] = []
  for (const item of items) {
    const { data: product } = await admin
      .from('products')
      .select('stock, name')
      .eq('id', item.product_id)
      .single()
    if (product && item.quantity > product.stock) {
      errors.push(`«${product.name}»: запрошено ${item.quantity}, на складе ${product.stock}`)
    }
  }
  return errors
}

/** Log an order history event */
async function logOrderHistory(
  admin: ReturnType<typeof createAdminClient>,
  orderId: string,
  userId: string,
  action: string,
  oldValue?: string | null,
  newValue?: string | null
) {
  await admin.from('order_history').insert({
    order_id: orderId,
    user_id: userId,
    action,
    old_value: oldValue ?? null,
    new_value: newValue ?? null,
  })
}

// ============================================
// Получение заказов
// ============================================
export interface OrdersParams {
  status?: string
  search?: string
  page?: number
  assignedTo?: string
  /** When role=employee, only show orders assigned to or created by this user */
  userId?: string
  userRole?: string
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

  // Employees see only their own orders (assigned or created)
  if (params.userRole === 'employee' && params.userId) {
    query = query.or(`assigned_to.eq.${params.userId},created_by.eq.${params.userId}`)
  }

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  if (params.search) {
    query = query.or(`note.ilike.%${params.search}%,order_number.eq.${parseInt(params.search) || 0}`)
  }

  // Filter by executor
  if (params.assignedTo) {
    query = query.eq('assigned_to', params.assignedTo)
  }

  const { data, count, error } = await query

  if (error) {
    console.error('getOrders error:', error)
  }

  // FK assigned_to/created_by -> auth.users, not profiles.
  // Fetch profiles separately.
  const rows = data ?? []
  const userIds = [...new Set(rows.flatMap((r) => [r.assigned_to, r.created_by]).filter(Boolean))] as string[]
  let profileMap: Record<string, { id: string; full_name: string; role: string; phone: string | null }> = {}
  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, full_name, role, phone')
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
  let profileMap: Record<string, { id: string; full_name: string; role: string; phone: string | null }> = {}
  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, full_name, role, phone')
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

  // Fetch history
  const { data: history } = await admin
    .from('order_history')
    .select('*')
    .eq('order_id', id)
    .order('created_at', { ascending: false })

  // Add history user profiles to profileMap
  const historyUserIds = [...new Set((history ?? []).map(h => h.user_id).filter(Boolean))] as string[]
  const missingIds = historyUserIds.filter(id => !profileMap[id])
  if (missingIds.length > 0) {
    const { data: extraProfiles } = await admin
      .from('profiles')
      .select('id, full_name, role, phone')
      .in('id', missingIds)
    for (const p of extraProfiles ?? []) {
      profileMap[p.id] = p
    }
  }

  return {
    ...data,
    assigned_user: data.assigned_to ? profileMap[data.assigned_to] ?? null : null,
    created_user: data.created_by ? profileMap[data.created_by] ?? null : null,
    items: items ?? [],
    history: (history ?? []).map(h => ({ ...h, user: profileMap[h.user_id] ?? null })),
  } as Order
}

// ============================================
// Dashboard stats
// ============================================
export async function getOrderStats(userId?: string, userRole?: string) {
  const admin = createAdminClient()

  function baseQuery() {
    let q = admin.from('orders').select('*', { count: 'exact', head: true })
    if (userRole === 'employee' && userId) {
      q = q.or(`assigned_to.eq.${userId},created_by.eq.${userId}`)
    }
    return q
  }

  const { count: total } = await baseQuery()

  const { count: newCount } = await baseQuery()
    .eq('status', 'new')

  const { count: inProgress } = await baseQuery()
    .eq('status', 'in_progress')

  const { count: ready } = await baseQuery()
    .eq('status', 'ready')

  return {
    total: total ?? 0,
    new: newCount ?? 0,
    inProgress: inProgress ?? 0,
    ready: ready ?? 0,
  }
}

// ============================================
// Данные для графиков дашборда
// ============================================
export async function getOrderChartData(userId?: string, userRole?: string) {
  const admin = createAdminClient()

  const since = new Date()
  since.setDate(since.getDate() - 6)
  since.setHours(0, 0, 0, 0)

  let query = admin
    .from('orders')
    .select('created_at, status')
    .gte('created_at', since.toISOString())

  if (userRole === 'employee' && userId) {
    query = query.or(`assigned_to.eq.${userId},created_by.eq.${userId}`)
  }

  const { data: rows } = await query

  // Daily counts for last 7 days
  const daily: { day: string; date: string; count: number }[] = []
  const weekdayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    const key = d.toISOString().slice(0, 10)
    daily.push({ day: weekdayNames[d.getDay()], date: key, count: 0 })
  }

  // Status breakdown
  const statusCounts: Record<string, number> = { new: 0, in_progress: 0, ready: 0, delivered: 0, cancelled: 0 }

  for (const row of rows ?? []) {
    const key = (row.created_at as string).slice(0, 10)
    const bucket = daily.find((b) => b.date === key)
    if (bucket) bucket.count += 1
    const st = row.status as string
    if (st in statusCounts) statusCounts[st] += 1
    else statusCounts[st] = 1
  }

  const statusBreakdown = [
    { name: 'Новые', value: statusCounts.new ?? 0, key: 'new' },
    { name: 'В работе', value: statusCounts.in_progress ?? 0, key: 'in_progress' },
    { name: 'Готовы', value: statusCounts.ready ?? 0, key: 'ready' },
    { name: 'Доставлены', value: statusCounts.delivered ?? 0, key: 'delivered' },
  ].filter((s) => s.value > 0)

  return { daily, statusBreakdown }
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
    const phone = formData.get('phone') as string
    const phoneDigits = phone?.replace(/\D/g, '')
    if (!phoneDigits || phoneDigits.length !== 11) return { error: 'Укажите полный номер телефона' }

    // Сотрудники автоматически назначаются исполнителями
    const finalAssignedTo = role === 'employee' ? user.id : (assignedTo || null)
    const note = formData.get('note') as string
    const deadline = formData.get('deadline') as string

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

    // Check stock availability
    const stockErrors = await checkStock(admin, items)
    if (stockErrors.length > 0) {
      return { error: `Недостаточно на складе:\n${stockErrors.join('\n')}` }
    }

    // Create order
    const { data: order, error: orderErr } = await admin
      .from('orders')
      .insert({
        client_id: clientId || null,
        assigned_to: finalAssignedTo,
        note: note?.trim() || null,
        phone: phone?.trim() || null,
        deadline: deadline || null,
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
      await admin.from('orders').delete().eq('id', order.id)
      return { error: `Ошибка добавления позиций: ${itemsErr.message}` }
    }

    // Deduct stock
    await deductStock(admin, items)

    // Log history
    await logOrderHistory(admin, order.id, user.id, 'created', null, 'new')

    // Notify assigned employee
    if (finalAssignedTo && finalAssignedTo !== user.id) {
      await createNotification(finalAssignedTo, 'Новый заказ', `Вам назначен новый заказ #${order.id.slice(0, 8)}`, `/orders/${order.id}`)
    }

    revalidatePath('/orders')
    revalidatePath('/catalog')
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
  note?: string,
  phone?: string,
  clientId?: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    const { user, role } = await requireAuth()

    if (!items.length) return { error: 'Добавьте хотя бы одну позицию' }
    const phoneDigits = phone?.replace(/\D/g, '')
    if (!phoneDigits || phoneDigits.length !== 11) return { error: 'Укажите полный номер телефона' }

    const validated = z.array(OrderItemSchema).parse(items)

    const admin = createAdminClient()

    // Check stock availability
    const stockErrors = await checkStock(admin, validated)
    if (stockErrors.length > 0) {
      return { error: `Недостаточно на складе:\n${stockErrors.join('\n')}` }
    }

    const { data: order, error: orderErr } = await admin
      .from('orders')
      .insert({
        note: note?.trim() || null,
        phone: phone!.trim(),
        client_id: clientId || null,
        created_by: user.id,
        assigned_to: role === 'employee' ? user.id : null,
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

    // Deduct stock
    await deductStock(admin, validated)

    // Log history
    await logOrderHistory(admin, order.id, user.id, 'created', null, 'new')

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

  // Restore stock when cancelling an active order
  const cancelledSlugs = ['cancelled']
  const wasCancelled = cancelledSlugs.includes(order.status)
  const nowCancelled = cancelledSlugs.includes(newStatus)

  if (!wasCancelled && nowCancelled) {
    // Order is being cancelled → restore stock
    await restoreStock(admin, orderId)
  } else if (wasCancelled && !nowCancelled) {
    // Order is being un-cancelled → deduct stock again
    const { data: items } = await admin.from('order_items').select('product_id, quantity').eq('order_id', orderId)
    if (items?.length) await deductStock(admin, items)
  }

  const { error } = await admin
    .from('orders')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (error) return { error: `Не удалось обновить статус: ${error.message}` }

  await logOrderHistory(admin, orderId, user.id, 'status_change', order.status, newStatus)

  // Notify assigned employee about status change
  const { data: fullOrder } = await admin.from('orders').select('assigned_to').eq('id', orderId).single()
  if (fullOrder?.assigned_to && fullOrder.assigned_to !== user.id) {
    await createNotification(fullOrder.assigned_to, 'Статус заказа изменён', `Заказ #${orderId.slice(0, 8)} — ${newStatus}`, `/orders/${orderId}`)
  }

  revalidatePath('/orders')
  revalidatePath(`/orders/${orderId}`)
  return { success: true }
}

// ============================================
// Назначение заказа сотруднику
// ============================================
export async function assignOrder(orderId: string, userId: string | null) {
  const { user, role } = await requireAuth()
  if (role === 'employee') return { error: 'Нет прав' }

  const admin = createAdminClient()

  // Get current assigned_to for history
  const { data: order } = await admin.from('orders').select('assigned_to').eq('id', orderId).single()

  const { error } = await admin
    .from('orders')
    .update({ assigned_to: userId, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (error) return { error: `Ошибка: ${error.message}` }

  await logOrderHistory(admin, orderId, user.id, 'assigned', order?.assigned_to ?? null, userId)

  // Notify assigned employee
  if (userId) {
    await createNotification(userId, 'Назначен заказ', `Вам назначен заказ #${orderId.slice(0, 8)}`, `/orders/${orderId}`)
  }

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
    .eq('role', 'employee')
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

  // Check if order was not cancelled — if so, restore stock
  const { data: order } = await admin.from('orders').select('status').eq('id', orderId).single()
  if (order && order.status !== 'cancelled') {
    await restoreStock(admin, orderId)
  }

  const { error } = await admin.from('orders').delete().eq('id', orderId)
  if (error) return { error: `Ошибка: ${error.message}` }

  revalidatePath('/orders')
  revalidatePath('/catalog')
  return { success: true }
}
