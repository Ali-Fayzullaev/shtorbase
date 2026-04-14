'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function getAppSetting(key: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', key)
    .single()
  return data?.value ?? null
}

export async function updateAppSetting(key: string, value: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { error: 'Нет прав' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('app_settings')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('key', key)

  if (error) return { error: 'Не удалось обновить настройку: ' + error.message }

  revalidatePath('/users')
  revalidatePath('/register')
  revalidatePath('/login')
  return { success: true }
}

export async function isRegistrationAllowed() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('app_settings')
    .select('value')
    .eq('key', 'allow_registration')
    .single()
  return data?.value === true
}
