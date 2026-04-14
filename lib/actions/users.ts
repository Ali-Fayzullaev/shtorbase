'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { type Profile, type UserRole } from '@/lib/types/database'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export async function getUsers() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (data ?? []) as Profile[]
}

export async function getInviteTokens() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('invite_tokens')
    .select('*')
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  return data ?? []
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
  return { supabase, userId: user.id }
}

export async function changeUserRole(userId: string, newRole: UserRole) {
  const ctx = await requireAdmin()
  if (!ctx) return { error: 'Нет прав' }

  if (ctx.userId === userId) return { error: 'Нельзя менять свою роль' }

  const { error } = await ctx.supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)

  if (error) return { error: 'Не удалось изменить роль' }

  revalidatePath('/users')
  return { success: true }
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  const ctx = await requireAdmin()
  if (!ctx) return { error: 'Нет прав' }

  if (ctx.userId === userId) return { error: 'Нельзя деактивировать себя' }

  const { error } = await ctx.supabase
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', userId)

  if (error) return { error: 'Не удалось обновить статус' }

  revalidatePath('/users')
  return { success: true }
}

// ============================================
// Прямое создание пользователя админом
// ============================================

const CreateUserSchema = z.object({
  email: z.string().email('Некорректный email'),
  full_name: z.string().min(2, 'Минимум 2 символа').max(100),
  password: z.string().min(8, 'Минимум 8 символов'),
  role: z.enum(['employee', 'manager', 'admin']),
})

export type CreateUserState = {
  error?: string
  success?: string
} | null

export async function createUserAction(
  _prev: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  const ctx = await requireAdmin()
  if (!ctx) return { error: 'Нет прав' }

  const parsed = CreateUserSchema.safeParse({
    email: formData.get('email'),
    full_name: formData.get('full_name'),
    password: formData.get('password'),
    role: formData.get('role'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const admin = createAdminClient()

  // Создаём пользователя через admin API (без email-подтверждения)
  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: {
      full_name: parsed.data.full_name,
      role: parsed.data.role,
    },
  })

  if (error) {
    if (error.message.includes('already been registered')) {
      return { error: 'Пользователь с таким email уже существует' }
    }
    return { error: `Ошибка: ${error.message}` }
  }

  if (!data.user) return { error: 'Не удалось создать пользователя' }

  revalidatePath('/users')
  return { success: `Пользователь ${parsed.data.full_name} создан` }
}

// ============================================
// Удаление пользователя
// ============================================

export async function deleteUser(userId: string) {
  const ctx = await requireAdmin()
  if (!ctx) return { error: 'Нет прав' }

  if (ctx.userId === userId) return { error: 'Нельзя удалить себя' }

  const admin = createAdminClient()

  // Удаляем из auth (каскадно удалит профиль)
  const { error } = await admin.auth.admin.deleteUser(userId)

  if (error) return { error: 'Не удалось удалить пользователя' }

  revalidatePath('/users')
  return { success: true }
}
