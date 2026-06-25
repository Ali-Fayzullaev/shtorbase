import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { type Profile } from '@/lib/types/database'

export const getProfile = cache(async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  return data as Profile | null
})

export async function requireProfile(): Promise<Profile & { authId: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const { redirect } = await import('next/navigation')
    redirect('/login')
  }
  const profile = await getProfile()
  if (!profile) {
    const { redirect } = await import('next/navigation')
    redirect('/login')
  }
  return { ...profile!, authId: user!.id }
}
