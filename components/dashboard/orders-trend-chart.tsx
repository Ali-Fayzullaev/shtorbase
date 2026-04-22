'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { TrendingUp } from 'lucide-react'

interface OrdersTrendChartProps {
  data: { day: string; date: string; count: number }[]
}

interface TrendTooltipProps {
  active?: boolean
  payload?: Array<{
    value?: number
    payload?: {
      date?: string
    }
  }>
}

function CustomTooltip({ active, payload }: TrendTooltipProps) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  const date = item.payload?.date as string | undefined
  return (
    <div className="rounded-lg border border-zinc-200 bg-white/95 backdrop-blur px-3 py-2 shadow-lg dark:border-white/10 dark:bg-zinc-900/95">
      {date && (
        <div className="text-[10px] uppercase tracking-wider text-zinc-400">
          {new Date(date).toLocaleDateString('ru', { day: 'numeric', month: 'long' })}
        </div>
      )}
      <div className="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
        {item.value} {Number(item.value) === 1 ? 'заказ' : 'заказов'}
      </div>
    </div>
  )
}

export function OrdersTrendChart({ data }: OrdersTrendChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0)
  const avg = total / (data.length || 1)

  return (
    <div className="rounded-2xl glass-card p-5 h-full">
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="flex items-center gap-2 text-[13px] font-medium text-zinc-500">
            <TrendingUp size={13} className="text-indigo-500" />
            Заказы за 7 дней
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-100">
              {total}
            </span>
            <span className="text-[11px] text-zinc-400">
              ≈ {avg.toFixed(1)} / день
            </span>
          </div>
        </div>
      </div>

      <div className="h-44 mt-3 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="2 4"
              stroke="currentColor"
              className="text-zinc-200 dark:text-zinc-800"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: 'currentColor' }}
              className="text-zinc-400"
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'currentColor' }}
              className="text-zinc-400"
              axisLine={false}
              tickLine={false}
              width={24}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '3 3' }} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#ordersGradient)"
              dot={{ r: 3, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 5, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
