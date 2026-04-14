import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // Check auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const sp = request.nextUrl.searchParams
  const search = sp.get('q')
  const category = sp.get('category')
  const unit = sp.get('unit')
  const stock = sp.get('stock')

  let query = supabase
    .from('products')
    .select('sku, name, description, price, unit, stock, vat_included, note, status, category:categories(name)')
    .neq('status', 'discontinued')

  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`)
  }
  if (category) {
    query = query.eq('category_id', category)
  }
  if (unit) {
    query = query.eq('unit', unit)
  }
  if (stock === 'in-stock') query = query.gt('stock', 0)
  else if (stock === 'low') query = query.gt('stock', 0).lt('stock', 10)
  else if (stock === 'out') query = query.eq('stock', 0)

  const { data: products } = await query.order('sku')

  if (!products) {
    return new Response('No data', { status: 500 })
  }

  // BOM for UTF-8 Excel compatibility
  const BOM = '\uFEFF'
  const headers = ['Артикул', 'Название', 'Категория', 'Цена', 'Единица', 'Остаток', 'НДС', 'Статус', 'Заметка']

  const escapeCSV = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`
    }
    return val
  }

  const rows = products.map((p: Record<string, unknown>) => {
    const cat = p.category as { name: string } | null
    return [
      String(p.sku ?? ''),
      String(p.name ?? ''),
      cat?.name ?? '',
      String(p.price ?? '0'),
      p.unit === 'meter' ? 'метр' : 'штука',
      String(p.stock ?? '0'),
      p.vat_included ? 'Да' : 'Нет',
      p.status === 'active' ? 'Активен' : 'Скрыт',
      String(p.note ?? ''),
    ].map(escapeCSV).join(',')
  })

  const csv = BOM + headers.map(escapeCSV).join(',') + '\n' + rows.join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="products_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
