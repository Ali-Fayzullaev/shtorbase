import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')
  if (!q || q.trim().length < 1) {
    return NextResponse.json({ products: [] })
  }

  const admin = createAdminClient()
  const { data } = await admin
    .from('products')
    .select('id, sku, name, price, stock, unit')
    .eq('status', 'active')
    .or(`name.ilike.%${q}%,sku.ilike.%${q}%`)
    .order('name')
    .limit(10)

  return NextResponse.json({ products: data ?? [] })
}
