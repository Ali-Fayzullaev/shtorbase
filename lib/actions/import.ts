'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { consume, getClientIp, formatRetry } from '@/lib/utils/rate-limit'

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

const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB
const MAX_ROWS = 10_000
const ALLOWED_MIMES = new Set([
  'text/csv',
  'text/plain',
  'application/csv',
  'application/vnd.ms-excel', // некоторые браузеры возвращают это для .csv
  '', // Safari иногда пустой
])

export async function bulkUpdateStockAction(_prevState: ImportState, formData: FormData): Promise<ImportState> {
  const supabase = await createClient()

  // Check auth + role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  // Rate-limit: импорт — мутирующая операция, 10 / 15 мин на пользователя.
  const ip = await getClientIp()
  const rl = consume(`${user.id}:${ip}`, { key: 'import', limit: 10, windowMs: 15 * 60_000 })
  if (!rl.ok) {
    return { error: `Слишком много импортов. Попробуйте через ${formatRetry(rl.retryAfterMs)}.` }
  }

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

  if (file.size > MAX_SIZE_BYTES) return { error: 'Файл слишком большой (макс. 2MB)' }

  // MIME-проверка: только CSV-подобные файлы.
  if (file.type && !ALLOWED_MIMES.has(file.type)) {
    return { error: 'Неподдерживаемый формат файла. Используйте CSV.' }
  }

  // Расширение тоже должно быть CSV-подобным.
  const name = (file.name ?? '').toLowerCase()
  if (name && !name.endsWith('.csv') && !name.endsWith('.txt')) {
    return { error: 'Ожидается файл .csv' }
  }

  const text = await file.text()
  // Убираем control-символы (кроме \r\n\t), нормализуем.
  const clean = text.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '')
  const lines = clean.split(/\r?\n/).filter(Boolean)

  if (lines.length < 2) return { error: 'Файл пуст или не содержит данных' }
  if (lines.length > MAX_ROWS + 1) return { error: `Слишком много строк (макс. ${MAX_ROWS})` }

  // Parse CSV: expect columns SKU, Stock (with any header)
  const rows: ImportRow[] = []
  const header = lines[0].toLowerCase()

  // Auto-detect separator
  const sep = header.includes(';') ? ';' : ','

  // Find SKU and Stock columns
  const cols = header.split(sep).map(c => c.trim().replace(/^["']|["']$/g, ''))
  const skuIdx = cols.findIndex(c => c === 'артикул' || c === 'sku' || c === 'код')
  const stockIdx = cols.findIndex(c => c === 'остаток' || c === 'stock' || c === 'количество' || c === 'кол-во')

  if (skuIdx === -1 || stockIdx === -1) {
    return { error: 'Не найдены колонки "Артикул" и "Остаток". Проверьте заголовки CSV.' }
  }

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(sep).map(c => c.trim().replace(/^["']|["']$/g, ''))
    const rawSku = cells[skuIdx] ?? ''
    // Защита от CSV injection: если пришёл SKU вида =HYPERLINK(...) — срежем префикс.
    const sku = rawSku.replace(/^[=+\-@\t\r]+/, '').slice(0, 100)
    const stock = parseFloat((cells[stockIdx] ?? '').replace(',', '.'))

    if (!sku) continue
    if (isNaN(stock) || stock < 0 || stock > 1_000_000) continue

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
