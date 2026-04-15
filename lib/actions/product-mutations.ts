'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const ProductSchema = z.object({
  sku: z.string().min(2, 'Мин. 2 символа').max(50),
  name: z.string().min(2, 'Мин. 2 символа').max(200),
  description: z.string().max(2000).nullable(),
  category_id: z.string().min(1, 'Выберите категорию').regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Неверный формат категории'),
  price: z.coerce.number().positive('Цена должна быть > 0'),
  unit: z.string().min(1, 'Выберите единицу').max(50),
  stock: z.coerce.number().min(0, 'Остаток ≥ 0'),
  vat_included: z.coerce.boolean(),
  note: z.string().max(500).nullable(),
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
    const { data: insertedProduct, error } = await admin.from('products').insert({
      ...parsed.data,
      created_by: user.id,
      updated_by: user.id,
    }).select('id').single()

    if (error) {
      if (error.code === '23505') {
        return { fieldErrors: { sku: 'Артикул уже существует' } }
      }
      return { error: `Не удалось создать товар: ${error.message} (${error.code})` }
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

  redirect('/catalog')
}
