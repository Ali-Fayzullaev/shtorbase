'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface CompanyBranding {
  logo_url: string | null
  logo_path: string | null
  company_name: string | null
}

export async function getCompanyBranding(): Promise<CompanyBranding> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('app_settings')
    .select('key, value')
    .in('key', ['company_logo', 'company_logo_path', 'company_name'])

  const map: Record<string, unknown> = {}
  for (const row of data ?? []) map[row.key] = row.value

  return {
    logo_url: typeof map.company_logo === 'string' ? map.company_logo : null,
    logo_path: typeof map.company_logo_path === 'string' ? map.company_logo_path : null,
    company_name: typeof map.company_name === 'string' ? map.company_name : null,
  }
}

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
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

export async function uploadCompanyLogo(formData: FormData): Promise<{ error?: string; success?: boolean }> {
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

  // Remove old logo if exists
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

  revalidatePath('/', 'layout')
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

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function updateCompanyName(name: string): Promise<{ error?: string; success?: boolean }> {
  const user = await requireAdmin()
  if (!user) return { error: 'Нет прав' }

  const trimmed = name.trim().slice(0, 60)

  try {
    await upsertSetting('company_name', trimmed || null)
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Не удалось обновить настройки' }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}
