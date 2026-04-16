'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { type Category, type Unit, type CustomField, type OrderStatusConfig } from '@/lib/types/database'

// ============================================
// Auth helper
// ============================================
async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Не авторизован')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') throw new Error('Только администратор')
  return user
}

// ============================================
// Categories CRUD
// ============================================
export async function getCategories() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('categories')
    .select('*')
    .order('sort_order')
  return (data ?? []) as Category[]
}

export async function createCategory(name: string) {
  await requireAdmin()
  const admin = createAdminClient()
  const slug = name.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, '-').replace(/^-|-$/g, '')

  const { data: maxOrder } = await admin
    .from('categories')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const { error } = await admin.from('categories').insert({
    name,
    slug: slug || 'category',
    sort_order: (maxOrder?.sort_order ?? 0) + 1,
  })

  if (error) {
    if (error.code === '23505') return { error: 'Категория уже существует' }
    return { error: error.message }
  }

  revalidatePath('/settings')
  return { success: true }
}

export async function updateCategory(id: string, name: string) {
  await requireAdmin()
  const admin = createAdminClient()
  const slug = name.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, '-').replace(/^-|-$/g, '')

  const { error } = await admin
    .from('categories')
    .update({ name, slug: slug || 'category' })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') return { error: 'Категория уже существует' }
    return { error: error.message }
  }

  revalidatePath('/settings')
  return { success: true }
}

export async function deleteCategory(id: string) {
  await requireAdmin()
  const admin = createAdminClient()

  // Check if category is in use
  const { count } = await admin
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id)
    .neq('status', 'discontinued')

  if (count && count > 0) {
    return { error: `Нельзя удалить: ${count} товаров используют эту категорию` }
  }

  const { error } = await admin.from('categories').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/settings')
  return { success: true }
}

// ============================================
// Units CRUD
// ============================================
export async function getUnits() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('units')
    .select('*')
    .order('sort_order')
  return (data ?? []) as Unit[]
}

export async function createUnit(name: string, shortName: string) {
  await requireAdmin()
  const admin = createAdminClient()

  const { data: maxOrder } = await admin
    .from('units')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const { error } = await admin.from('units').insert({
    name,
    short_name: shortName,
    sort_order: (maxOrder?.sort_order ?? 0) + 1,
  })

  if (error) {
    if (error.code === '23505') return { error: 'Единица уже существует' }
    return { error: error.message }
  }

  revalidatePath('/settings')
  return { success: true }
}

export async function updateUnit(id: string, name: string, shortName: string) {
  await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin
    .from('units')
    .update({ name, short_name: shortName })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/settings')
  return { success: true }
}

export async function deleteUnit(id: string) {
  await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin.from('units').delete().eq('id', id)
  if (error) {
    if (error.code === '23503') return { error: 'Нельзя удалить: единица используется товарами' }
    return { error: error.message }
  }

  revalidatePath('/settings')
  return { success: true }
}

// ============================================
// Custom Fields CRUD
// ============================================
export async function getCustomFields() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('custom_fields')
    .select('*')
    .order('sort_order')
  return (data ?? []) as CustomField[]
}

export async function createCustomField(
  name: string,
  fieldType: string,
  options: string[] | null,
  isRequired: boolean,
) {
  await requireAdmin()
  const admin = createAdminClient()

  const { data: maxOrder } = await admin
    .from('custom_fields')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const { error } = await admin.from('custom_fields').insert({
    name,
    field_type: fieldType,
    options: options && options.length > 0 ? options : null,
    is_required: isRequired,
    sort_order: (maxOrder?.sort_order ?? 0) + 1,
  })

  if (error) return { error: error.message }

  revalidatePath('/settings')
  return { success: true }
}

export async function updateCustomField(
  id: string,
  name: string,
  fieldType: string,
  options: string[] | null,
  isRequired: boolean,
) {
  await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin
    .from('custom_fields')
    .update({
      name,
      field_type: fieldType,
      options: options && options.length > 0 ? options : null,
      is_required: isRequired,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/settings')
  return { success: true }
}

export async function deleteCustomField(id: string) {
  await requireAdmin()
  const admin = createAdminClient()

  // Deletes cascade product_custom_values
  const { error } = await admin.from('custom_fields').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/settings')
  return { success: true }
}

// ============================================
// Product custom values
// ============================================
export async function getProductCustomValues(productId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('product_custom_values')
    .select('*')
    .eq('product_id', productId)
  return (data ?? []) as { id: string; product_id: string; field_id: string; value: string }[]
}

export async function saveProductCustomValues(
  productId: string,
  values: { field_id: string; value: string }[],
) {
  const admin = createAdminClient()

  // Delete old values
  await admin.from('product_custom_values').delete().eq('product_id', productId)

  // Insert new
  const rows = values
    .filter((v) => v.value.trim())
    .map((v) => ({
      product_id: productId,
      field_id: v.field_id,
      value: v.value,
    }))

  if (rows.length > 0) {
    await admin.from('product_custom_values').insert(rows)
  }
}

// ============================================
// Order Statuses CRUD
// ============================================
export async function getOrderStatuses() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('order_statuses')
    .select('*')
    .order('sort_order')
  return (data ?? []) as OrderStatusConfig[]
}

export async function createOrderStatus(slug: string, label: string, color: string, dotColor: string) {
  await requireAdmin()
  const admin = createAdminClient()

  const { data: maxOrder } = await admin
    .from('order_statuses')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const { error } = await admin.from('order_statuses').insert({
    slug: slug.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_|_$/g, ''),
    label,
    color,
    dot_color: dotColor,
    sort_order: (maxOrder?.sort_order ?? 0) + 1,
    is_default: false,
  })

  if (error) {
    if (error.code === '23505') return { error: 'Статус с таким slug уже существует' }
    return { error: error.message }
  }

  revalidatePath('/settings')
  revalidatePath('/orders')
  return { success: true }
}

export async function updateOrderStatus(id: string, label: string, color: string, dotColor: string) {
  await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin
    .from('order_statuses')
    .update({ label, color, dot_color: dotColor })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/settings')
  revalidatePath('/orders')
  return { success: true }
}

export async function deleteOrderStatus(id: string) {
  await requireAdmin()
  const admin = createAdminClient()

  // Get the status slug
  const { data: status } = await admin
    .from('order_statuses')
    .select('slug')
    .eq('id', id)
    .single()

  if (!status) return { error: 'Статус не найден' }

  // Check if any orders use this status
  const { count } = await admin
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', status.slug)

  if (count && count > 0) {
    return { error: `Нельзя удалить: ${count} заказов имеют этот статус` }
  }

  const { error } = await admin.from('order_statuses').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/settings')
  revalidatePath('/orders')
  return { success: true }
}

export async function reorderStatuses(orderedIds: string[]) {
  await requireAdmin()
  const admin = createAdminClient()

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await admin
      .from('order_statuses')
      .update({ sort_order: i + 1 })
      .eq('id', orderedIds[i])
    if (error) return { error: error.message }
  }

  revalidatePath('/settings')
  revalidatePath('/orders')
  return { success: true }
}
