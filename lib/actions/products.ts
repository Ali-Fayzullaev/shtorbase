'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { type Product, type Category, type AuditLog } from '@/lib/types/database'

// ============================================
// Статистика для дашборда
// ============================================
export async function getDashboardStats() {
  const supabase = await createClient()

  const [
    { count: total },
    { count: active },
    { count: outOfStock },
    { count: lowStock },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'active').eq('stock', 0),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'active').gt('stock', 0).lt('stock', 10),
  ])

  return {
    total: total ?? 0,
    active: active ?? 0,
    outOfStock: outOfStock ?? 0,
    lowStock: lowStock ?? 0,
  }
}

// ============================================
// Товары с низким остатком
// ============================================
export async function getLowStockProducts(limit = 6) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('status', 'active')
    .lt('stock', 10)
    .order('stock', { ascending: true })
    .limit(limit)

  return (data ?? []) as Product[]
}

// ============================================
// Последние изменения
// ============================================
export async function getRecentAuditLogs(limit = 6) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('audit_log')
    .select('*, user:profiles(*), product:products(id, sku, name)')
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []) as AuditLog[]
}

// ============================================
// Полный аудит-лог с фильтрами и пагинацией
// ============================================
export interface AuditParams {
  field?: string
  action?: string
  page?: number
  pageSize?: number
}

export async function getAuditLogs(params: AuditParams = {}) {
  const { field, action, page = 1, pageSize = 30 } = params
  const supabase = await createClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('audit_log')
    .select('*, user:profiles(*), product:products(id, sku, name)', { count: 'exact' })

  if (field) {
    query = query.eq('field_name', field)
  }

  if (action) {
    query = query.eq('action', action)
  }

  const { data, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  return {
    logs: (data ?? []) as AuditLog[],
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

// ============================================
// Каталог с поиском, фильтрами и пагинацией
// ============================================
export interface CatalogParams {
  search?: string
  category?: string
  unit?: string
  stock?: string
  page?: number
  pageSize?: number
}

export async function getCatalogProducts(params: CatalogParams = {}) {
  const { search, category, unit, stock, page = 1, pageSize = 25 } = params
  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select('*, category:categories(*)', { count: 'exact' })
    .neq('status', 'discontinued')

  // Поиск
  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`)
  }

  // Фильтры
  if (category) {
    query = query.eq('category_id', category)
  }
  if (unit) {
    query = query.eq('unit', unit)
  }
  if (stock === 'in-stock') {
    query = query.gte('stock', 10)
  } else if (stock === 'low') {
    query = query.gt('stock', 0).lt('stock', 10)
  } else if (stock === 'out') {
    query = query.eq('stock', 0)
  }

  // Пагинация
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  query = query.order('updated_at', { ascending: false }).range(from, to)

  const { data, count } = await query
  const products = (data ?? []) as Product[]

  // Fetch ALL images for each product (for hover gallery)
  const imageMap: Record<string, string[]> = {}
  if (products.length > 0) {
    const admin = createAdminClient()
    const ids = products.map((p) => p.id)
    const { data: images, error: imgError } = await admin
      .from('product_images')
      .select('product_id, storage_path, url')
      .in('product_id', ids)
      .order('sort_order', { ascending: true })

    if (imgError) {
      console.error('[getCatalogProducts] Failed to fetch images:', imgError.message)
    }

    if (images) {
      console.log(`[getCatalogProducts] Found ${images.length} image rows for ${ids.length} products`)
      for (const img of images) {
        let url: string | null = null
        if (img.url) {
          url = img.url
        } else if (img.storage_path) {
          const { data: urlData } = admin.storage.from('product-images').getPublicUrl(img.storage_path)
          url = urlData.publicUrl
        }
        console.log(`[getCatalogProducts] img ${img.product_id}: url=${url?.slice(0, 80)}`)
        if (url) {
          if (!imageMap[img.product_id]) imageMap[img.product_id] = []
          imageMap[img.product_id].push(url)
        }
      }
    }
  }

  // Attach images array + thumbnail (first image) to each product
  const productsWithThumbs = products.map((p) => ({
    ...p,
    images: imageMap[p.id] ?? [],
    thumbnail: imageMap[p.id]?.[0] ?? null,
  }))

  return {
    products: productsWithThumbs,
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

// ============================================
// Одиночный товар
// ============================================
export async function getProductById(id: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('id', id)
    .single()

  return data as Product | null
}

// ============================================
// Логи товара
// ============================================
export async function getProductAuditLogs(productId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('audit_log')
    .select('*, user:profiles(id, full_name)')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(50)

  return (data ?? []) as AuditLog[]
}

// ============================================
// Категории
// ============================================
export async function getCategories() {
  const admin = createAdminClient()

  const { data } = await admin
    .from('categories')
    .select('*')
    .order('sort_order')

  return (data ?? []) as Category[]
}
