'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface ImportRow {
  sku: string
  stock: number
}

export type ImportState = {
  error?: string
  success?: string
  updated?: number
  notFound?: string[]
} | null

export async function bulkUpdateStockAction(_prevState: ImportState, formData: FormData): Promise<ImportState> {
  const supabase = await createClient()

  // Check auth + role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['manager', 'admin'].includes(profile.role)) {
    return { error: 'Нет прав для импорта' }
  }

  const file = formData.get('file') as File
  if (!file || file.size === 0) return { error: 'Выберите файл' }

  if (file.size > 2 * 1024 * 1024) return { error: 'Файл слишком большой (макс. 2MB)' }

  const text = await file.text()
  const lines = text.split(/\r?\n/).filter(Boolean)

  if (lines.length < 2) return { error: 'Файл пуст или не содержит данных' }

  // Parse CSV: expect columns SKU, Stock (with any header)
  const rows: ImportRow[] = []
  const header = lines[0].toLowerCase()
  
  // Auto-detect separator
  const sep = header.includes(';') ? ';' : ','
  
  // Find SKU and Stock columns
  const cols = header.split(sep).map(c => c.trim().replace(/"/g, ''))
  const skuIdx = cols.findIndex(c => c === 'артикул' || c === 'sku' || c === 'код')
  const stockIdx = cols.findIndex(c => c === 'остаток' || c === 'stock' || c === 'количество' || c === 'кол-во')

  if (skuIdx === -1 || stockIdx === -1) {
    return { error: 'Не найдены колонки "Артикул" и "Остаток". Проверьте заголовки CSV.' }
  }

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(sep).map(c => c.trim().replace(/"/g, ''))
    const sku = cells[skuIdx]
    const stock = parseFloat(cells[stockIdx])

    if (!sku) continue
    if (isNaN(stock) || stock < 0) continue

    rows.push({ sku, stock })
  }

  if (rows.length === 0) return { error: 'Не удалось прочитать данные из файла' }

  let updated = 0
  const notFound: string[] = []

  for (const row of rows) {
    const { data: product } = await supabase
      .from('products')
      .select('id, stock')
      .eq('sku', row.sku)
      .neq('status', 'discontinued')
      .maybeSingle()

    if (!product) {
      notFound.push(row.sku)
      continue
    }

    if (product.stock !== row.stock) {
      const { error } = await supabase
        .from('products')
        .update({ stock: row.stock, updated_by: user.id })
        .eq('id', product.id)

      if (!error) updated++
    }
  }

  revalidatePath('/catalog')
  revalidatePath('/')

  return {
    success: `Обновлено ${updated} из ${rows.length} товаров`,
    updated,
    notFound: notFound.length > 0 ? notFound : undefined,
  }
}
