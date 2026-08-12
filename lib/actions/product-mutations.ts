'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidateTag } from 'next/cache'
import { z } from 'zod'

/** Короткий код для товара без вручную указанного артикула */
function generateSku(): string {
  return `AUTO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
}

interface InsertableProduct {
  sku: string
  name: string
  description: string | null
  category_id: string
  price: number
  unit: string
  stock: number
  vat_included: boolean
  note: string | null
  variant_group_id: string | null
  created_by: string
  updated_by: string
}

/**
 * Первая вариация в группе создаётся с variant_group_id, указывающим на
 * САМ СЕБЯ ещё не существующий "якорный" товар (см. product-form.tsx) —
 * анкор так и остаётся с variant_group_id = null, если его никто не
 * обновит. Это делает его невидимым в списке "Другие варианты" у
 * собственных вариаций (getProductVariants ищет по variant_group_id
 * анкора, а тот null). Самопривязываем анкор при первой вариации: если
 * товар с id = groupId существует и ещё не в группе — присоединяем.
 * Безопасно и идемпотентно для случайного groupId (просто 0 строк).
 */
async function ensureGroupAnchor(admin: ReturnType<typeof createAdminClient>, groupId: string | null) {
  if (!groupId) return
  await admin.from('products').update({ variant_group_id: groupId }).eq('id', groupId).is('variant_group_id', null)
}

/** Вставляет товар, при пустом артикуле генерирует его и повторяет попытку при редкой коллизии */
async function insertProductRow(
  admin: ReturnType<typeof createAdminClient>,
  data: InsertableProduct,
): Promise<{ id: string } | { error: string; isSkuConflict?: boolean }> {
  const wasAutoSku = data.sku.length === 0
  let sku = wasAutoSku ? generateSku() : data.sku

  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: row, error } = await admin
      .from('products')
      .insert({ ...data, sku })
      .select('id')
      .single()

    if (!error && row) {
      await ensureGroupAnchor(admin, data.variant_group_id)
      return { id: row.id }
    }

    if (error?.code === '23505') {
      if (wasAutoSku) { sku = generateSku(); continue }
      return { error: 'Артикул уже существует', isSkuConflict: true }
    }
    return { error: error?.message ?? 'Не удалось создать товар' }
  }
  return { error: 'Артикул уже существует', isSkuConflict: true }
}

const ProductSchema = z.object({
  // Артикул необязателен — если не указан, генерируем автоматически (см. generateSku)
  sku: z.string().max(50).refine((v) => v.length === 0 || v.length >= 2, 'Мин. 2 символа'),
  name: z.string().min(2, 'Мин. 2 символа').max(200),
  description: z.string().max(2000).nullable(),
  category_id: z.string().min(1, 'Выберите категорию').regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Неверный формат категории'),
  price: z.coerce.number().positive('Цена должна быть > 0'),
  unit: z.string().min(1, 'Выберите единицу').max(50),
  stock: z.coerce.number().min(0, 'Остаток ≥ 0'),
  vat_included: z.coerce.boolean(),
  note: z.string().max(500).nullable(),
  variant_group_id: z.string().uuid().nullable(),
})

export type ProductFormState = {
  error?: string
  fieldErrors?: Record<string, string>
} | null

export async function createProductAction(
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  try {
    const raw = {
      sku: formData.get('sku'),
      name: formData.get('name'),
      description: formData.get('description') || null,
      category_id: formData.get('category_id'),
      price: formData.get('price'),
      unit: formData.get('unit'),
      stock: formData.get('stock'),
      vat_included: formData.get('vat_included') === 'on',
      note: formData.get('note') || null,
      variant_group_id: (formData.get('variant_group_id') as string) || null,
    }

    const parsed = ProductSchema.safeParse(raw)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0]?.toString()
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message
      })
      return { fieldErrors }
    }

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Не авторизован' }

    // Проверяем роль
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
      return { error: 'Нет прав для создания товаров' }
    }

    const admin = createAdminClient()

    const result = await insertProductRow(admin, {
      ...parsed.data,
      created_by: user.id,
      updated_by: user.id,
    })

    if ('error' in result) {
      if (result.isSkuConflict) return { fieldErrors: { sku: result.error } }
      return { error: `Не удалось создать товар: ${result.error}` }
    }
    const insertedProduct = result

    // Save image URLs if provided
    const imageUrls = formData.getAll('image_urls').filter((u) => typeof u === 'string' && (u as string).trim())
    if (imageUrls.length > 0) {
      const rows = imageUrls.map((url, i) => ({
        product_id: insertedProduct.id,
        url: url as string,
        sort_order: i,
      }))
      await admin.from('product_images').insert(rows)
    }

    // Save uploaded files
    const files = formData.getAll('image_files') as File[]
    let sortOffset = imageUrls.length
    for (const file of files) {
      if (!file || file.size === 0) continue
      if (file.size > 5 * 1024 * 1024) continue // skip too large
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const path = `${insertedProduct.id}/${crypto.randomUUID()}.${ext}`
      const { error: uploadErr } = await admin.storage
        .from('product-images')
        .upload(path, file, { contentType: file.type })
      if (!uploadErr) {
        await admin.from('product_images').insert({
          product_id: insertedProduct.id,
          storage_path: path,
          sort_order: sortOffset++,
        })
      }
    }

    // Save custom field values
    const cfEntries: { field_id: string; value: string }[] = []
    for (const [key, val] of formData.entries()) {
      if (key.startsWith('cf_') && typeof val === 'string' && val.trim()) {
        cfEntries.push({ field_id: key.slice(3), value: val })
      }
    }
    if (cfEntries.length > 0) {
      const { saveProductCustomValues } = await import('./settings-data')
      await saveProductCustomValues(insertedProduct.id, cfEntries)
    }
  } catch (err) {
    // Re-throw redirect errors (Next.js uses throw for redirects)
    if (err && typeof err === 'object' && 'digest' in err) throw err
    const message = err instanceof Error ? err.message : 'Неизвестная ошибка'
    return { error: `Ошибка: ${message}` }
  }

  revalidateTag('products', 'minutes')
  redirect('/catalog')
}

// ============================================
// Вариации товара (создание по одной, с прогрессом на клиенте)
// ============================================

async function requireProductEditor() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' } as const
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
    return { error: 'Нет прав для создания товаров' } as const
  }
  return { userId: user.id } as const
}

export interface VariantOptionInput {
  name: string
  values: string[]
}

/**
 * Готовит дополнительные поля под параметры вариаций (например «Цвет») —
 * находит существующее поле категории или создаёт новое (тип select).
 * Вызывается один раз перед циклом создания вариаций на клиенте.
 */
export async function prepareVariantFields(
  categoryId: string,
  options: VariantOptionInput[],
): Promise<{ fieldIds?: Record<string, string>; error?: string }> {
  const auth = await requireProductEditor()
  if ('error' in auth) return { error: auth.error }

  for (const opt of options) {
    if (opt.name.trim().length < 2) {
      return { error: `Название параметра «${opt.name}» слишком короткое — минимум 2 символа` }
    }
  }

  const admin = createAdminClient()
  const fieldIds: Record<string, string> = {}

  for (const opt of options) {
    const name = opt.name.trim()
    // Регистронезависимый поиск — иначе «цвет»/«Цвет»/«ЦВЕТ» заводят
    // отдельные поля с непересекающимися списками значений (был баг:
    // товар с сохранённым «Красный» не мог переключиться на «Белый»,
    // потому что тот жил в другом, «дублирующем» поле).
    const { data: existing } = await admin
      .from('custom_fields')
      .select('id, options')
      .ilike('name', name)
      .eq('category_id', categoryId)
      .maybeSingle()

    if (existing) {
      const merged = Array.from(new Set([...(existing.options ?? []), ...opt.values]))
      await admin.from('custom_fields').update({ options: merged }).eq('id', existing.id)
      fieldIds[opt.name] = existing.id
    } else {
      const { data: maxOrder } = await admin
        .from('custom_fields')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .single()
      const { data: created, error } = await admin
        .from('custom_fields')
        .insert({
          name,
          field_type: 'select',
          options: opt.values,
          is_required: false,
          category_id: categoryId,
          sort_order: (maxOrder?.sort_order ?? 0) + 1,
        })
        .select('id')
        .single()
      if (error || !created) return { error: `Не удалось создать параметр «${opt.name}»: ${error?.message ?? 'ошибка'}` }
      fieldIds[opt.name] = created.id
    }
  }

  return { fieldIds }
}

export interface CreateVariantInput {
  base: {
    sku: string
    name: string
    description: string | null
    category_id: string
    price: number
    unit: string
    stock: number
    vat_included: boolean
    note: string | null
  }
  comboLabel: string
  comboValues: { field_id: string; value: string }[]
  extraCfValues: { field_id: string; value: string }[]
  groupId: string
  variantIndex: number
}

/** Создаёт одну вариацию товара — вызывается по очереди с клиента, чтобы показывать прогресс */
export async function createOneVariantAction(input: CreateVariantInput): Promise<{ id?: string; error?: string }> {
  const auth = await requireProductEditor()
  if ('error' in auth) return { error: auth.error }

  const { base } = input
  if (!base.category_id || !base.name.trim() || !base.unit || !(base.price > 0) || !(base.stock >= 0)) {
    return { error: 'Проверьте обязательные поля товара' }
  }

  const admin = createAdminClient()
  const sku = base.sku.trim().length > 0 ? `${base.sku.trim()}-${input.variantIndex + 1}` : ''

  const result = await insertProductRow(admin, {
    ...base,
    sku,
    name: `${base.name} — ${input.comboLabel}`,
    variant_group_id: input.groupId,
    created_by: auth.userId,
    updated_by: auth.userId,
  })

  if ('error' in result) return { error: result.error }

  const cfValues = [...input.extraCfValues, ...input.comboValues]
  if (cfValues.length > 0) {
    const { saveProductCustomValues } = await import('./settings-data')
    await saveProductCustomValues(result.id, cfValues)
  }

  revalidateTag('products', 'minutes')
  return { id: result.id }
}

export async function updateProductAction(
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const productId = formData.get('product_id') as string
  if (!productId) return { error: 'ID товара не указан' }

  const raw = {
    sku: formData.get('sku'),
    name: formData.get('name'),
    description: formData.get('description') || null,
    category_id: formData.get('category_id'),
    price: formData.get('price'),
    unit: formData.get('unit'),
    stock: formData.get('stock'),
    vat_included: formData.get('vat_included') === 'on',
    note: formData.get('note') || null,
    variant_group_id: (formData.get('variant_group_id') as string) || null,
  }

  const parsed = ProductSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    parsed.error.issues.forEach((issue) => {
      const key = issue.path[0]?.toString()
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message
    })
    return { fieldErrors }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
    return { error: 'Нет прав для редактирования' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('products')
    .update({
      ...parsed.data,
      sku: parsed.data.sku.length === 0 ? generateSku() : parsed.data.sku,
      updated_by: user.id,
    })
    .eq('id', productId)

  if (error) {
    if (error.code === '23505') {
      return { fieldErrors: { sku: 'Артикул уже существует' } }
    }
    return { error: 'Не удалось обновить товар' }
  }

  // Save custom field values
  const cfEntries: { field_id: string; value: string }[] = []
  for (const [key, val] of formData.entries()) {
    if (key.startsWith('cf_') && typeof val === 'string') {
      cfEntries.push({ field_id: key.slice(3), value: val })
    }
  }
  const { saveProductCustomValues } = await import('./settings-data')
  await saveProductCustomValues(productId, cfEntries)

  revalidateTag('products', 'minutes')
  redirect(`/catalog/${productId}`)
}

export async function deleteProductAction(productId: string): Promise<ProductFormState> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'Только администратор может удалять товары' }
  }

  const { error } = await supabase
    .from('products')
    .update({
      status: 'discontinued',
      updated_by: user.id,
    })
    .eq('id', productId)

  if (error) {
    return { error: 'Не удалось удалить товар' }
  }

  revalidateTag('products', 'minutes')
  redirect('/catalog')
}
