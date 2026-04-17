import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { consume, getClientIp } from '@/lib/utils/rate-limit'
import { escapeIlike } from '@/lib/utils/sanitize'

export async function GET(request: NextRequest) {
  // Аутентификация: поиск не должен быть публичным.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // CSRF: запрос должен идти с того же origin.
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (origin && host && !new URL(origin).host.endsWith(host)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Rate-limit: 60 поисков / минуту на пользователя.
  const ip = await getClientIp()
  const rl = consume(`${user.id}:${ip}`, { key: 'search', limit: 60, windowMs: 60_000 })
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const qRaw = request.nextUrl.searchParams.get('q') ?? ''
  const q = escapeIlike(qRaw).slice(0, 100)
  if (q.length < 1) {
    return NextResponse.json({ products: [] })
  }

  const { data } = await supabase
    .from('products')
    .select('id, sku, name, price, stock, unit')
    .eq('status', 'active')
    .or(`name.ilike.%${q}%,sku.ilike.%${q}%`)
    .order('name')
    .limit(10)

  return NextResponse.json({ products: data ?? [] })
}
