'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const AcceptInviteSchema = z.object({
  token: z.string().min(1, 'Токен обязателен'),
  password: z.string().min(8, 'Минимум 8 символов'),
  password_confirm: z.string().min(8, 'Подтвердите пароль'),
}).refine(d => d.password === d.password_confirm, {
  message: 'Пароли не совпадают',
  path: ['password_confirm'],
})

export type AcceptInviteState = {
  error?: string
} | null

export async function acceptInviteAction(_prevState: AcceptInviteState, formData: FormData): Promise<AcceptInviteState> {
  const raw = {
    token: formData.get('token'),
    password: formData.get('password'),
    password_confirm: formData.get('password_confirm'),
  }

  const parsed = AcceptInviteSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()

  // Находим инвайт по токену
  const { data: invite } = await supabase
    .from('invite_tokens')
    .select('*')
    .eq('token', parsed.data.token)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!invite) {
    return { error: 'Приглашение не найдено, истекло или уже использовано' }
  }

  // Регистрируем пользователя через Supabase Auth
  const { error: signUpError } = await supabase.auth.signUp({
    email: invite.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: invite.full_name,
        role: invite.role,
      },
    },
  })

  if (signUpError) {
    if (signUpError.message.includes('already registered')) {
      return { error: 'Пользователь с таким email уже зарегистрирован' }
    }
    return { error: 'Ошибка регистрации. Попробуйте позже.' }
  }

  // Помечаем инвайт как использованный
  await supabase
    .from('invite_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', invite.id)

  redirect('/')
}
