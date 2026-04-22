'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { PieChart as PieIcon } from 'lucide-react'

interface StatusDonutChartProps {
  data: { name: string; value: number; key: string }[]
}

const COLORS: Record<string, string> = {
  new: '#6366f1',
  in_progress: '#f59e0b',
  ready: '#10b981',
  delivered: '#64748b',
}

interface DonutTooltipProps {
  active?: boolean
  payload?: Array<{
    value?: number
    name?: string
  }>
}

function CustomTooltip({ active, payload }: DonutTooltipProps) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="rounded-lg border border-zinc-200 bg-white/95 backdrop-blur px-3 py-2 shadow-lg dark:border-white/10 dark:bg-zinc-900/95">
      <div className="text-[10px] uppercase tracking-wider text-zinc-400">{item.name}</div>
      <div className="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
        {item.value}
      </div>
    </div>
  )
}

export function StatusDonutChart({ data }: StatusDonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  if (total === 0) {
    return (
      <div className="rounded-2xl glass-card p-5 h-full flex flex-col">
        <div className="flex items-center gap-2 text-[13px] font-medium text-zinc-500">
          <PieIcon size={13} className="text-violet-500" />
          Статусы заказов
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-zinc-400">Нет данных</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl glass-card p-5 h-full flex flex-col">
      <div className="flex items-center gap-2 text-[13px] font-medium text-zinc-500 mb-2">
        <PieIcon size={13} className="text-violet-500" />
        Статусы заказов
      </div>

      <div className="flex items-center gap-4 flex-1 min-h-0">
        {/* Chart */}
        <div className="relative h-40 w-40 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={70}
                paddingAngle={2}
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell key={entry.key} fill={COLORS[entry.key] ?? '#a1a1aa'} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center text */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-100">
              {total}
            </span>
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider">всего</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 min-w-0 space-y-2">
          {data.map((item) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
            return (
              <div key={item.key} className="flex items-center gap-2 min-w-0">
                <div
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[item.key] ?? '#a1a1aa' }}
                />
                <span className="text-[12px] text-zinc-600 dark:text-zinc-400 truncate flex-1">
                  {item.name}
                </span>
                <span className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums">
                  {item.value}
                </span>
                <span className="text-[10px] text-zinc-400 tabular-nums w-8 text-right">{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
