'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const InviteSchema = z.object({
  email: z.string().email('Некорректный email'),
  full_name: z.string().min(2, 'Минимум 2 символа').max(100, 'Максимум 100 символов'),
  role: z.enum(['employee', 'manager', 'admin'], { message: 'Некорректная роль' }),
})

export type InviteState = {
  error?: string
  success?: string
  token?: string
} | null

export async function inviteUserAction(_prevState: InviteState, formData: FormData): Promise<InviteState> {
  const raw = {
    email: formData.get('email'),
    full_name: formData.get('full_name'),
    role: formData.get('role'),
  }

  const parsed = InviteSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()

  // Проверяем что текущий пользователь — admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'Только администратор может приглашать пользователей' }
  }

  // Проверяем что email ещё не зарегистрирован
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', (await supabase.from('profiles').select('id')).data?.find(() => false)?.id ?? '')

  // Проверяем что нет активного инвайта на этот email
  const { data: existingInvite } = await supabase
    .from('invite_tokens')
    .select('id')
    .eq('email', parsed.data.email)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (existingInvite) {
    return { error: 'Приглашение для этого email уже существует' }
  }

  // Создаём инвайт
  const { data: invite, error } = await supabase
    .from('invite_tokens')
    .insert({
      email: parsed.data.email,
      full_name: parsed.data.full_name,
      role: parsed.data.role,
      invited_by: user.id,
    })
    .select('token')
    .single()

  if (error) {
    return { error: 'Не удалось создать приглашение' }
  }

  return {
    success: `Приглашение создано для ${parsed.data.email}`,
    token: invite.token,
  }
}
