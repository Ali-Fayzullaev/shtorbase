'use server'

import { createClient } from '@/lib/supabase/server'
import { isRegistrationAllowed } from './settings'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const RegisterSchema = z
  .object({
    full_name: z.string().min(2, 'Минимум 2 символа').max(100),
    email: z.string().email('Некорректный email'),
    password: z.string().min(8, 'Минимум 8 символов'),
    password_confirm: z.string(),
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
  // Проверяем, разрешена ли регистрация
  const allowed = await isRegistrationAllowed()
  if (!allowed) {
    return { error: 'Регистрация временно закрыта' }
  }

  const parsed = RegisterSchema.safeParse({
    full_name: formData.get('full_name'),
    email: formData.get('email'),
    password: formData.get('password'),
    password_confirm: formData.get('password_confirm'),
  })

  if (!parsed.success) {
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
