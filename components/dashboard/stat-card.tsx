import { cn } from '@/lib/utils/format'
import { type LucideIcon } from 'lucide-react'

interface BreakdownItem {
  label: string
  value: number
  color: 'indigo' | 'emerald' | 'red' | 'amber'
}

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  color?: 'indigo' | 'emerald' | 'red' | 'amber'
  subtitle?: string
  size?: 'sm' | 'lg'
  breakdown?: BreakdownItem[]
}

const colorMap = {
  indigo: {
    iconBg: 'bg-gradient-to-br from-indigo-500 to-violet-600',
    shadow: 'shadow-indigo-500/20',
    valueTint: 'text-zinc-900 dark:text-zinc-100',
    bar: 'from-indigo-500/20 to-transparent',
  },
  emerald: {
    iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    shadow: 'shadow-emerald-500/20',
    valueTint: 'text-zinc-900 dark:text-zinc-100',
    bar: 'from-emerald-500/20 to-transparent',
  },
  red: {
    iconBg: 'bg-gradient-to-br from-red-500 to-rose-600',
    shadow: 'shadow-red-500/20',
    valueTint: 'text-zinc-900 dark:text-zinc-100',
    bar: 'from-red-500/20 to-transparent',
  },
  amber: {
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
    shadow: 'shadow-amber-500/20',
    valueTint: 'text-zinc-900 dark:text-zinc-100',
    bar: 'from-amber-500/20 to-transparent',
  },
}

const dotColors: Record<'indigo' | 'emerald' | 'red' | 'amber', string> = {
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500',
  red: 'bg-red-500',
  amber: 'bg-amber-500',
}

export function StatCard({ label, value, icon: Icon, color = 'indigo', subtitle, size = 'sm', breakdown }: StatCardProps) {
  const c = colorMap[color]

  if (size === 'lg') {
    return (
      <div className="group relative overflow-hidden rounded-2xl glass-card p-5 h-full">
        <div className={cn('absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r', c.bar)} />
        <div className="flex items-start justify-between mb-3">
          <p className="text-[13px] font-medium text-zinc-500">{label}</p>
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-110', c.iconBg, c.shadow)}>
            <Icon size={18} className="text-white" strokeWidth={2} />
          </div>
        </div>
        <p className={cn('text-5xl font-bold tabular-nums tracking-tight leading-none', c.valueTint)}>{value}</p>
        {subtitle && <p className="text-[11px] text-zinc-400 mt-1.5">{subtitle}</p>}
        {breakdown && (
          <div className="mt-4 flex flex-wrap gap-2">
            {breakdown.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-1.5 rounded-full bg-zinc-100/70 dark:bg-zinc-800/70 px-2.5 py-1"
              >
                <div className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotColors[item.color])} />
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{item.label}</span>
                <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 tabular-nums">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl glass-card p-4 h-full">
      {/* Subtle gradient accent bar at top */}
      <div className={cn('absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r', c.bar)} />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[13px] font-medium text-zinc-500">{label}</p>
          <p className={cn('text-2xl font-bold tabular-nums tracking-tight', c.valueTint)}>{value}</p>
          {subtitle && <p className="text-[11px] text-zinc-400">{subtitle}</p>}
        </div>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-110', c.iconBg, c.shadow)}>
          <Icon size={18} className="text-white" strokeWidth={2} />
        </div>
      </div>
    </div>
  )
}
