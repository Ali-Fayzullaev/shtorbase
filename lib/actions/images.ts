'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadProductImage(productId: string, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['manager', 'admin'].includes(profile.role)) {
    return { error: 'Нет прав' }
  }

  const file = formData.get('image') as File
  if (!file || file.size === 0) return { error: 'Выберите файл' }

  if (file.size > 5 * 1024 * 1024) return { error: 'Файл слишком большой (макс. 5MB)' }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif']
  if (!allowedExts.includes(ext)) return { error: 'Неподдерживаемый формат' }

  const path = `${productId}/${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(path, file, { contentType: file.type })

  if (uploadError) return { error: 'Ошибка загрузки: ' + uploadError.message }

  // Get current max sort_order
  const { data: existing } = await supabase
    .from('product_images')
    .select('sort_order')
    .eq('product_id', productId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

  const { error: dbError } = await supabase
    .from('product_images')
    .insert({
      product_id: productId,
      storage_path: path,
      sort_order: nextOrder,
    })

  if (dbError) return { error: 'Ошибка сохранения' }

  revalidatePath(`/catalog/${productId}`)
  return { success: true }
}

export async function deleteProductImage(imageId: string, storagePath: string, productId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['manager', 'admin'].includes(profile.role)) {
    return { error: 'Нет прав' }
  }

  await supabase.storage.from('product-images').remove([storagePath])

  await supabase.from('product_images').delete().eq('id', imageId)

  revalidatePath(`/catalog/${productId}`)
  return { success: true }
}

export async function getProductImages(productId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order')

  return data ?? []
}
