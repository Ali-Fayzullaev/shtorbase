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

    // Вариации (например, по цвету) — вместо одного товара создаём набор карточек
    const variantOptionsRaw = formData.get('variant_options') as string | null
    if (variantOptionsRaw) {
      return await createProductVariantsBatch(admin, parsed.data, variantOptionsRaw, user.id, formData)
    }

    const wasAutoSku = parsed.data.sku.length === 0
    let skuToUse = wasAutoSku ? generateSku() : parsed.data.sku

    let insertedProduct: { id: string } | null = null
    let insertError: { code?: string; message: string } | null = null

    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await admin.from('products').insert({
        ...parsed.data,
        sku: skuToUse,
        created_by: user.id,
        updated_by: user.id,
      }).select('id').single()

      if (!error) { insertedProduct = data; insertError = null; break }
      insertError = error
      // Коллизия автогенерированного артикула — маловероятно, но пробуем ещё раз с новым кодом
      if (error.code === '23505' && wasAutoSku) {
        skuToUse = generateSku()
        continue
      }
      break
    }

    if (insertError) {
      if (insertError.code === '23505') {
        return { fieldErrors: { sku: 'Артикул уже существует' } }
      }
      return { error: `Не удалось создать товар: ${insertError.message}` }
    }

    // Save image URLs if provided
    if (insertedProduct) {
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

/**
 * Создаёт набор товаров-вариаций одним заходом: менеджер один раз указывает
 * параметр (например «Цвет») и значения через запятую, здесь строится
 * декартово произведение и на каждую комбинацию создаётся отдельная карточка
 * с общим variant_group_id. Каждый параметр по пути автоматически заводится
 * (или переиспользуется) как обычное дополнительное поле категории — так
 * значение «Цвет: Красный» видно в карточке как любая другая характеристика.
 */
async function createProductVariantsBatch(
  admin: ReturnType<typeof createAdminClient>,
  base: z.infer<typeof ProductSchema>,
  optionsRaw: string,
  userId: string,
  formData: FormData,
): Promise<ProductFormState> {
  let options: { name: string; values: string[] }[]
  try {
    options = JSON.parse(optionsRaw)
    if (!Array.isArray(options) || options.length === 0) throw new Error('empty')
  } catch {
    return { error: 'Некорректные параметры вариаций' }
  }

  // Декартово произведение значений всех параметров
  let combos: { name: string; value: string }[][] = [[]]
  for (const opt of options) {
    const next: { name: string; value: string }[][] = []
    for (const combo of combos) {
      for (const value of opt.values) {
        next.push([...combo, { name: opt.name, value }])
      }
    }
    combos = next
  }

  if (combos.length === 0) return { error: 'Добавьте хотя бы одно значение параметра' }
  if (combos.length > 60) {
    return { error: `Слишком много комбинаций (${combos.length}). Уменьшите количество значений или параметров.` }
  }

  const groupId = crypto.randomUUID()

  // Находим/создаём дополнительное поле под каждый параметр вариации в этой категории
  const fieldIdByOptionName = new Map<string, string>()
  for (const opt of options) {
    const { data: existing } = await admin
      .from('custom_fields')
      .select('id, options')
      .eq('name', opt.name)
      .eq('category_id', base.category_id)
      .maybeSingle()

    if (existing) {
      const merged = Array.from(new Set([...(existing.options ?? []), ...opt.values]))
      await admin.from('custom_fields').update({ options: merged }).eq('id', existing.id)
      fieldIdByOptionName.set(opt.name, existing.id)
    } else {
      const { data: maxOrder } = await admin
        .from('custom_fields')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .single()
      const { data: created, error: cfErr } = await admin
        .from('custom_fields')
        .insert({
          name: opt.name,
          field_type: 'select',
          options: opt.values,
          is_required: false,
          category_id: base.category_id,
          sort_order: (maxOrder?.sort_order ?? 0) + 1,
        })
        .select('id')
        .single()
      if (cfErr || !created) return { error: `Не удалось создать параметр «${opt.name}»: ${cfErr?.message ?? 'ошибка'}` }
      fieldIdByOptionName.set(opt.name, created.id)
    }
  }

  // Обычные доп. поля, введённые в форме один раз — клонируем на каждую вариацию
  const baseCfEntries: { field_id: string; value: string }[] = []
  for (const [key, val] of formData.entries()) {
    if (key.startsWith('cf_') && typeof val === 'string' && val.trim()) {
      baseCfEntries.push({ field_id: key.slice(3), value: val })
    }
  }

  const { saveProductCustomValues } = await import('./settings-data')

  for (const [index, combo] of combos.entries()) {
    const suffix = combo.map((c) => c.value).join(' / ')
    const sku = base.sku.length > 0 ? `${base.sku}-${index + 1}` : generateSku()

    const { data: inserted, error } = await admin
      .from('products')
      .insert({
        ...base,
        sku,
        name: `${base.name} — ${suffix}`,
        variant_group_id: groupId,
        created_by: userId,
        updated_by: userId,
      })
      .select('id')
      .single()

    if (error || !inserted) {
      return { error: `Не удалось создать вариацию «${suffix}»: ${error?.message ?? 'ошибка'} (создано ${index} из ${combos.length})` }
    }

    const cfValues = [
      ...baseCfEntries,
      ...combo.map((c) => ({ field_id: fieldIdByOptionName.get(c.name)!, value: c.value })),
    ]
    await saveProductCustomValues(inserted.id, cfValues)
  }

  revalidateTag('products', 'minutes')
  redirect('/catalog')
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
