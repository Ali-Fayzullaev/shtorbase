'use server'

import { createClient } from '@/lib/supabase/server'

export async function saveTelegramId(
  _: unknown,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const raw = (formData.get('telegram_chat_id') as string | null)?.trim() ?? ''
  if (raw && !/^-?\d+$/.test(raw)) {
    return { error: 'ID должен быть числом (например: 123456789)' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ telegram_chat_id: raw || null, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}
