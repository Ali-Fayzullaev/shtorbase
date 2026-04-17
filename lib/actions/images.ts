'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cloudinary } from '@/lib/cloudinary'
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

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) return { error: 'Неподдерживаемый формат' }

  // Convert File to Buffer for Cloudinary upload
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  let uploadResult: { secure_url: string; public_id: string }
  try {
    uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: `shtorbase/products/${productId}`,
          resource_type: 'image',
          // Auto-quality and format for best compression
          quality: 'auto',
          fetch_format: 'auto',
        },
        (error, result) => {
          if (error || !result) reject(error ?? new Error('Upload failed'))
          else resolve(result as { secure_url: string; public_id: string })
        }
      ).end(buffer)
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: 'Ошибка загрузки: ' + msg }
  }

  const admin = createAdminClient()
  const nextOrder = await getNextSortOrder(productId)

  const { error: dbError } = await admin
    .from('product_images')
    .insert({
      product_id: productId,
      storage_path: uploadResult.public_id, // Cloudinary public_id for deletion
      url: uploadResult.secure_url,
      sort_order: nextOrder,
    })

  if (dbError) return { error: 'Ошибка сохранения' }

  revalidatePath(`/catalog/${productId}`)
  revalidatePath('/catalog')
  return { success: true }
}

export async function addProductImageUrl(productId: string, imageUrl: string) {
  const user = await requireEditor()
  if (!user) return { error: 'Нет прав' }

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
  revalidatePath('/catalog')
  return { success: true }
}

export async function deleteProductImage(imageId: string, storagePath: string | null, productId: string) {
  const user = await requireEditor()
  if (!user) return { error: 'Нет прав' }

  // Delete from Cloudinary if we have a public_id (storage_path)
  if (storagePath && storagePath.startsWith('shtorbase/')) {
    try {
      await cloudinary.uploader.destroy(storagePath)
    } catch {
      // Non-critical — continue with DB deletion
    }
  }

  const admin = createAdminClient()
  await admin.from('product_images').delete().eq('id', imageId)

  revalidatePath(`/catalog/${productId}`)
  revalidatePath('/catalog')
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

  return data.map((img: { id: string; product_id: string; storage_path: string | null; url: string | null; sort_order: number; created_at: string }) => {
    let display_url = img.url ?? ''
    if (!display_url && img.storage_path) {
      // Legacy images uploaded before Cloudinary migration — compute Supabase public URL
      const { data: urlData } = admin.storage.from('product-images').getPublicUrl(img.storage_path)
      display_url = urlData.publicUrl
    }
    return { ...img, display_url }
  })
}
