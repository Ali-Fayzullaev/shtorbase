'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getCompanyBranding } from '@/lib/data/branding'

export type { CompanyBranding } from '@/lib/data/branding'

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') return null
  return user
}

async function upsertSetting(key: string, value: unknown) {
  const admin = createAdminClient()
  const { error } = await admin
    .from('app_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
  if (error) throw new Error(error.message)
}

function invalidateBranding() {
  updateTag('branding')
  revalidatePath('/', 'layout')
}

export async function uploadCompanyLogo(
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const user = await requireAdmin()
  if (!user) return { error: 'Нет прав' }

  const file = formData.get('logo') as File
  if (!file || file.size === 0) return { error: 'Выберите файл' }
  if (file.size > 2 * 1024 * 1024) return { error: 'Файл слишком большой (макс. 2MB)' }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  const allowed = ['png', 'jpg', 'jpeg', 'webp', 'svg']
  if (!allowed.includes(ext)) return { error: 'Поддерживаются PNG, JPG, WEBP, SVG' }

  const path = `branding/logo-${Date.now()}.${ext}`
  const admin = createAdminClient()

  const current = await getCompanyBranding()
  if (current.logo_path) {
    await admin.storage.from('product-images').remove([current.logo_path])
  }

  const { error: uploadError } = await admin.storage
    .from('product-images')
    .upload(path, file, { cacheControl: '3600', upsert: true, contentType: file.type })
  if (uploadError) return { error: `Ошибка загрузки: ${uploadError.message}` }

  const { data: urlData } = admin.storage.from('product-images').getPublicUrl(path)

  try {
    await upsertSetting('company_logo', urlData.publicUrl)
    await upsertSetting('company_logo_path', path)
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Не удалось сохранить настройки' }
  }

  invalidateBranding()
  return { success: true }
}

export async function removeCompanyLogo(): Promise<{ error?: string; success?: boolean }> {
  const user = await requireAdmin()
  if (!user) return { error: 'Нет прав' }

  const current = await getCompanyBranding()
  const admin = createAdminClient()

  if (current.logo_path) {
    await admin.storage.from('product-images').remove([current.logo_path])
  }

  try {
    await upsertSetting('company_logo', null)
    await upsertSetting('company_logo_path', null)
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Не удалось обновить настройки' }
  }

  invalidateBranding()
  return { success: true }
}

export async function updateCompanyName(
  name: string,
): Promise<{ error?: string; success?: boolean }> {
  const user = await requireAdmin()
  if (!user) return { error: 'Нет прав' }

  const trimmed = name.trim().slice(0, 60)

  try {
    await upsertSetting('company_name', trimmed || null)
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Не удалось обновить настройки' }
  }

  invalidateBranding()
  return { success: true }
}
