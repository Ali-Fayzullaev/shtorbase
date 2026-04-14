'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const ProductSchema = z.object({
  sku: z.string().min(2, 'Мин. 2 символа').max(50),
  name: z.string().min(2, 'Мин. 2 символа').max(200),
  description: z.string().max(2000).nullable(),
  category_id: z.string().uuid('Выберите категорию'),
  price: z.coerce.number().positive('Цена должна быть > 0'),
  unit: z.enum(['meter', 'piece'], { message: 'Выберите единицу' }),
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
    // DEBUG: log all form entries
    const entries: Record<string, unknown> = {}
    formData.forEach((v, k) => { entries[k] = v })
    console.log('[createProduct] formData entries:', JSON.stringify(entries))

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
      console.log('[createProduct] validation errors:', JSON.stringify(fieldErrors))
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
