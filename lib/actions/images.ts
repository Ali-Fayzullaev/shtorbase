'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function requireEditor() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['manager', 'admin'].includes(profile.role)) return null
  return user
}

async function getNextSortOrder(productId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('product_images')
    .select('sort_order')
    .eq('product_id', productId)
    .order('sort_order', { ascending: false })
    .limit(1)
  return (data?.[0]?.sort_order ?? -1) + 1
}

export async function uploadProductImage(productId: string, formData: FormData) {
  const user = await requireEditor()
  if (!user) return { error: 'Нет прав' }

  const file = formData.get('image') as File
  if (!file || file.size === 0) return { error: 'Выберите файл' }

  if (file.size > 5 * 1024 * 1024) return { error: 'Файл слишком большой (макс. 5MB)' }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif']
  if (!allowedExts.includes(ext)) return { error: 'Неподдерживаемый формат' }

  const path = `${productId}/${crypto.randomUUID()}.${ext}`

  const admin = createAdminClient()
  const { error: uploadError } = await admin.storage
    .from('product-images')
    .upload(path, file, { contentType: file.type })

  if (uploadError) return { error: 'Ошибка загрузки: ' + uploadError.message }

  const nextOrder = await getNextSortOrder(productId)

  const { error: dbError } = await admin
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

export async function addProductImageUrl(productId: string, imageUrl: string) {
  const user = await requireEditor()
  if (!user) return { error: 'Нет прав' }

  // Basic URL validation
  try {
    new URL(imageUrl)
  } catch {
    return { error: 'Некорректный URL' }
  }

  const admin = createAdminClient()
  const nextOrder = await getNextSortOrder(productId)

  const { error } = await admin
    .from('product_images')
    .insert({
      product_id: productId,
      url: imageUrl,
      sort_order: nextOrder,
    })

  if (error) return { error: 'Ошибка сохранения: ' + error.message }

  revalidatePath(`/catalog/${productId}`)
  return { success: true }
}

export async function deleteProductImage(imageId: string, storagePath: string | null, productId: string) {
  const user = await requireEditor()
  if (!user) return { error: 'Нет прав' }

  const admin = createAdminClient()

  if (storagePath) {
    await admin.storage.from('product-images').remove([storagePath])
  }

  await admin.from('product_images').delete().eq('id', imageId)

  revalidatePath(`/catalog/${productId}`)
  return { success: true }
}

export async function getProductImages(productId: string) {
  const admin = createAdminClient()

  const { data } = await admin
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order')

  if (!data) return []

  // Return with resolved URLs
  return data.map((img: { id: string; product_id: string; storage_path: string | null; url: string | null; sort_order: number; created_at: string }) => ({
    ...img,
    display_url: img.url ?? admin.storage.from('product-images').getPublicUrl(img.storage_path!).data.publicUrl,
  }))
}
