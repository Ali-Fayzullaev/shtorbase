'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getPayable } from '@/lib/utils/format'

export type ReportPeriod = 'today' | 'week' | 'month'

const ALMATY_OFFSET_HOURS = 5 // Asia/Almaty, без перехода на летнее время

/** Начало периода в UTC, с поправкой на часовой пояс Алматы */
function getPeriodStart(period: ReportPeriod): Date {
  const now = new Date()
  const almatyNow = new Date(now.getTime() + ALMATY_OFFSET_HOURS * 60 * 60 * 1000)

  if (period === 'today') {
    almatyNow.setUTCHours(0, 0, 0, 0)
  } else if (period === 'week') {
    almatyNow.setUTCHours(0, 0, 0, 0)
    almatyNow.setUTCDate(almatyNow.getUTCDate() - 6)
  } else {
    almatyNow.setUTCHours(0, 0, 0, 0)
    almatyNow.setUTCDate(almatyNow.getUTCDate() - 29)
  }
  return new Date(almatyNow.getTime() - ALMATY_OFFSET_HOURS * 60 * 60 * 1000)
}

function dayKeyAlmaty(iso: string): string {
  const d = new Date(new Date(iso).getTime() + ALMATY_OFFSET_HOURS * 60 * 60 * 1000)
  return d.toISOString().slice(0, 10)
}

// ============================================
// Выручка за период (по фактическим платежам)
// ============================================
export async function getRevenueReport(period: ReportPeriod) {
  const admin = createAdminClient()
  const from = getPeriodStart(period)

  const { data: payments } = await admin
    .from('payments')
    .select('amount, created_at')
    .gte('created_at', from.toISOString())
    .order('created_at')

  const rows = payments ?? []
  const total = rows.reduce((sum, p) => sum + p.amount, 0)

  // Дневной разрез для графика
  const dayCount = period === 'today' ? 1 : period === 'week' ? 7 : 30
  const daily: { date: string; label: string; amount: number }[] = []
  for (let i = dayCount - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const almaty = new Date(d.getTime() + ALMATY_OFFSET_HOURS * 60 * 60 * 1000)
    const key = almaty.toISOString().slice(0, 10)
    daily.push({
      date: key,
      label: almaty.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
      amount: 0,
    })
  }
  const dayIndex = new Map(daily.map((d, i) => [d.date, i]))
  for (const p of rows) {
    const key = dayKeyAlmaty(p.created_at)
    const idx = dayIndex.get(key)
    if (idx !== undefined) daily[idx].amount += p.amount
  }

  return { total, paymentCount: rows.length, daily }
}

// ============================================
// Скидки за период (по дате создания заказа)
// ============================================
export async function getDiscountsReport(period: ReportPeriod) {
  const admin = createAdminClient()
  const from = getPeriodStart(period)

  const { data } = await admin
    .from('orders')
    .select('discount_amount')
    .gt('discount_amount', 0)
    .gte('created_at', from.toISOString())

  const rows = data ?? []
  return {
    total: rows.reduce((sum, o) => sum + o.discount_amount, 0),
    orderCount: rows.length,
  }
}

// ============================================
// Долги клиентов — снимок на сейчас, не завязан на период
// ============================================
export interface Debtor {
  clientId: string | null
  clientName: string
  phone: string | null
  debt: number
  orderCount: number
}

export async function getDebtSummary() {
  const admin = createAdminClient()

  const { data } = await admin
    .from('orders')
    .select('id, client_id, phone, total_amount, discount_amount, paid_amount, client:clients(name, phone)')
    .neq('status', 'cancelled')

  const rows = data ?? []
  const byClient = new Map<string, Debtor>()
  let totalDebt = 0

  for (const row of rows) {
    const payable = getPayable({ total_amount: row.total_amount, discount_amount: row.discount_amount })
    const debt = payable - row.paid_amount
    if (debt <= 0.01) continue

    totalDebt += debt
    const client = row.client as { name?: string; phone?: string } | null
    const key = row.client_id ?? `phone:${row.phone ?? row.id}`
    const existing = byClient.get(key)
    if (existing) {
      existing.debt += debt
      existing.orderCount += 1
    } else {
      byClient.set(key, {
        clientId: row.client_id,
        clientName: client?.name ?? 'Без клиента',
        phone: client?.phone ?? row.phone ?? null,
        debt,
        orderCount: 1,
      })
    }
  }

  const debtors = [...byClient.values()].sort((a, b) => b.debt - a.debt)
  return { totalDebt, debtors }
}
