'use server'

import { createClient } from '@/lib/supabase/server'
import { isRegistrationAllowed } from './settings'
import { redirect } from 'next/navigation'
import { consume, getClientIp, formatRetry } from '@/lib/utils/rate-limit'
import { z } from 'zod'
import { emailSchema, passwordSchema } from '@/lib/schemas/auth'

const RegisterSchema = z
  .object({
    full_name: z.string().trim().min(2, 'Минимум 2 символа').max(100),
    email: emailSchema,
    phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Введите номер: +77001234567').optional().or(z.literal('')),
    password: passwordSchema,
    password_confirm: z.string(),
    website: z.string().max(0).optional(),
  })
  .refine((d) => d.password === d.password_confirm, {
    message: 'Пароли не совпадают',
    path: ['password_confirm'],
  })

export type RegisterState = {
  error?: string
  fieldErrors?: Record<string, string>
} | null

export async function registerAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  // Rate limit: 3 регистрации с одного IP за час.
  const ip = await getClientIp()
  const limit = consume(ip, { key: 'register:ip', limit: 3, windowMs: 60 * 60_000, blockMs: 60 * 60_000 })
  if (!limit.ok) {
    return { error: `Слишком много попыток регистрации. Попробуйте через ${formatRetry(limit.retryAfterMs)}.` }
  }

  // Проверяем, разрешена ли регистрация
  const allowed = await isRegistrationAllowed()
  if (!allowed) {
    return { error: 'Регистрация временно закрыта' }
  }

  const parsed = RegisterSchema.safeParse({
    full_name: formData.get('full_name'),
    email: formData.get('email'),
    phone: formData.get('phone') || '',
    password: formData.get('password'),
    password_confirm: formData.get('password_confirm'),
    website: formData.get('website') ?? '',
  })

  if (!parsed.success) {
    // Honeypot triggered
    if (parsed.error.issues.some((i) => i.path[0] === 'website')) {
      await new Promise((r) => setTimeout(r, 1500))
      return { error: 'Ошибка регистрации. Попробуйте позже.' }
    }
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path[0] as string] = issue.message
    }
    return { fieldErrors }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.full_name,
        phone: parsed.data.phone || null,
        role: 'employee', // всегда employee при самостоятельной регистрации
      },
    },
  })

  if (error) {
    if (error.message.includes('already been registered')) {
      return { error: 'Пользователь с таким email уже существует' }
    }
    return { error: 'Ошибка регистрации. Попробуйте позже.' }
  }

  redirect('/')
}
