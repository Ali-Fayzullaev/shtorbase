'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { consume, getClientIp, formatRetry } from '@/lib/utils/rate-limit'
import { emailSchema, honeypotSchema } from '@/lib/schemas/auth'

// Логин использует упрощённую политику — существующие пароли могут быть короче.
// Новые пароли (register/invite) идут через полную политику passwordSchema.
const LoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Введите пароль').max(128),
  website: honeypotSchema,
})

export type AuthState = {
  error?: string
} | null

export async function loginAction(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
    website: formData.get('website') ?? '',
  }

  const parsed = LoginSchema.safeParse(raw)
  if (!parsed.success) {
    // Honeypot triggered — молча тормозим, не подсказывая боту.
    if (parsed.error.issues.some((i) => i.path[0] === 'website')) {
      await new Promise((r) => setTimeout(r, 1500))
      return { error: 'Ошибка входа. Попробуйте позже.' }
    }
    return { error: parsed.error.issues[0].message }
  }

  // Rate limit: по IP (5 попыток / 5 мин, затем блок на 15 мин)
  // и отдельно по email (10 попыток / 15 мин).
  const ip = await getClientIp()
  const byIp = consume(ip, { key: 'login:ip', limit: 5, windowMs: 5 * 60_000, blockMs: 15 * 60_000 })
  if (!byIp.ok) {
    return { error: `Слишком много попыток. Попробуйте через ${formatRetry(byIp.retryAfterMs)}.` }
  }
  const byEmail = consume(parsed.data.email.toLowerCase(), {
    key: 'login:email',
    limit: 10,
    windowMs: 15 * 60_000,
    blockMs: 15 * 60_000,
  })
  if (!byEmail.ok) {
    return { error: `Слишком много попыток для этого аккаунта. Попробуйте через ${formatRetry(byEmail.retryAfterMs)}.` }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      // Нейтральное сообщение, чтобы не раскрывать существование аккаунта.
      return { error: 'Неверный email или пароль' }
    }
    return { error: 'Ошибка входа. Попробуйте позже.' }
  }

  redirect('/')
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
