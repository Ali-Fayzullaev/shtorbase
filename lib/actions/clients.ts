'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { type Client } from '@/lib/types/database'

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Не авторизован')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  return { user, role: profile?.role ?? 'employee' }
}

export async function getClients() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('clients')
    .select('*')
    .order('name')
  return (data ?? []) as Client[]
}

export async function searchClients(query: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('clients')
    .select('*')
    .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
    .order('name')
    .limit(20)
  return (data ?? []) as Client[]
}

export async function createNewClient(formData: {
  name: string
  phone?: string
  email?: string
  address?: string
  note?: string
}) {
  const { user } = await requireAuth()

  if (!formData.name || formData.name.trim().length < 2) {
    return { error: 'Имя клиента обязательно (мин. 2 символа)' }
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('clients')
    .insert({
      name: formData.name.trim(),
      phone: formData.phone?.trim() || null,
      email: formData.email?.trim() || null,
      address: formData.address?.trim() || null,
      note: formData.note?.trim() || null,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) return { error: `Не удалось создать клиента: ${error.message}` }
  revalidatePath('/orders')
  return { id: data.id }
}

export async function updateClient(id: string, formData: {
  name: string
  phone?: string
  email?: string
  address?: string
  note?: string
}) {
  const { role } = await requireAuth()
  if (role === 'employee') return { error: 'Нет прав' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('clients')
    .update({
      name: formData.name.trim(),
      phone: formData.phone?.trim() || null,
      email: formData.email?.trim() || null,
      address: formData.address?.trim() || null,
      note: formData.note?.trim() || null,
    })
    .eq('id', id)

  if (error) return { error: `Не удалось обновить клиента: ${error.message}` }
  revalidatePath('/orders')
  return { success: true }
}
