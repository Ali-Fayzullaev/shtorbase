'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { Wallet } from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'

interface RevenueChartProps {
  data: { date: string; label: string; amount: number }[]
  total: number
  paymentCount: number
}

interface RevenueTooltipProps {
  active?: boolean
  payload?: Array<{ value?: number; payload?: { label?: string } }>
}

function CustomTooltip({ active, payload }: RevenueTooltipProps) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="rounded-lg border border-zinc-200 bg-white/95 backdrop-blur px-3 py-2 shadow-lg dark:border-white/10 dark:bg-zinc-900/95">
      {item.payload?.label && (
        <div className="text-[10px] uppercase tracking-wider text-zinc-400">{item.payload.label}</div>
      )}
      <div className="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
        {formatPrice(Number(item.value) || 0)} ₸
      </div>
    </div>
  )
}

export function RevenueChart({ data, total, paymentCount }: RevenueChartProps) {
  return (
    <div className="rounded-2xl glass-card p-5 h-full">
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="flex items-center gap-2 text-[13px] font-medium text-zinc-500">
            <Wallet size={13} className="text-emerald-500" />
            Выручка по дням
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-100">
              {formatPrice(total)} ₸
            </span>
            <span className="text-[11px] text-zinc-400">
              {paymentCount} {paymentCount === 1 ? 'платёж' : 'платежей'}
            </span>
          </div>
        </div>
      </div>

      <div className="h-52 mt-3 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid
              strokeDasharray="2 4"
              stroke="currentColor"
              className="text-zinc-200 dark:text-zinc-800"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: 'currentColor' }}
              className="text-zinc-400"
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'currentColor' }}
              className="text-zinc-400"
              axisLine={false}
              tickLine={false}
              width={40}
              allowDecimals={false}
              tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'currentColor', className: 'text-zinc-100 dark:text-zinc-800' }} />
            <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
