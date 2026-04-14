'use server'

import { createClient } from '@/lib/supabase/server'
import { type Profile, type UserRole } from '@/lib/types/database'
import { revalidatePath } from 'next/cache'

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
